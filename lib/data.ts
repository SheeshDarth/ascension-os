"use client";

import { seedGoals, defaultSettings } from "@/lib/goals";
import {
  enqueueSyncOperation,
  getPendingSyncOperations,
  readLocalValue,
  removeSyncOperation,
  updateSyncOperationError,
  writeLocalValue,
  writeSyncSnapshot,
  type SyncOperation
} from "@/lib/local-first";
import { calculateScores } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { AiAnalysis, AnalysisResult, DailyLog, Goal, MemoryItem, Settings, WeeklyReview, WeeklyReviewRow } from "@/lib/types";

const LOGS_KEY = "ascensionos.daily_logs";
const GOALS_KEY = "ascensionos.goals";
const SETTINGS_KEY = "ascensionos.settings";
const REVIEWS_KEY = "ascensionos.weekly_reviews";
const AI_ANALYSES_KEY = "ascensionos.ai_analyses";
const MEMORY_ITEMS_KEY = "ascensionos.memory_items";

export class DataAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataAccessError";
  }
}

function sortLogs(logs: DailyLog[]) {
  return logs.sort((a, b) => b.date.localeCompare(a.date));
}

function sortAnalyses(analyses: AiAnalysis[]) {
  return analyses.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

async function requireUserId() {
  if (!supabase) throw new DataAccessError("Supabase is not configured.");
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new DataAccessError(error.message);
  if (!data.user) throw new DataAccessError("Sign in required. Open /login to unlock cross-device sync.");
  return data.user.id;
}

function fail(message: string): never {
  throw new DataAccessError(message);
}

function cloudClient() {
  if (!supabase) throw new DataAccessError("Supabase is not configured.");
  return supabase;
}

async function noteCloudError(error: unknown) {
  const message = error instanceof Error ? error.message : "Cloud sync failed.";
  await writeSyncSnapshot({ lastError: message });
  return message;
}

async function cloudOrLocal<T>(key: string, fallback: T, loadCloud: () => Promise<T>, hasLocalData: (value: T) => boolean = Boolean) {
  if (!supabase) return readLocalValue<T>(key, fallback);
  try {
    await flushSyncQueue();
    const data = await loadCloud();
    await writeLocalValue(key, data);
    await writeSyncSnapshot({ lastError: "" });
    return data;
  } catch (error) {
    await noteCloudError(error);
    const local = await readLocalValue<T>(key, fallback);
    if (hasLocalData(local)) return local;
    throw error;
  }
}

async function saveLocalLog(log: DailyLog) {
  const logs = await readLocalValue<DailyLog[]>(LOGS_KEY, []);
  const index = logs.findIndex((item) => item.date === log.date);
  const saved = {
    ...log,
    id: log.id ?? (index >= 0 ? logs[index].id : crypto.randomUUID()),
    created_at: log.created_at ?? (index >= 0 ? logs[index].created_at : new Date().toISOString())
  };
  if (index >= 0) logs[index] = saved;
  else logs.push(saved);
  await writeLocalValue(LOGS_KEY, sortLogs(logs));
  return saved;
}

async function saveLocalGoal(goal: Goal) {
  const goals = await readLocalValue<Goal[]>(GOALS_KEY, []);
  const id = goal.id ?? crypto.randomUUID();
  const next = goals.map((item) => (item.id === id ? { ...goal, id } : item));
  if (!goals.some((item) => item.id === id)) next.push({ ...goal, id });
  await writeLocalValue(GOALS_KEY, next);
  return { ...goal, id };
}

async function saveLocalSettings(settings: Settings) {
  await writeLocalValue(SETTINGS_KEY, settings);
  return settings;
}

async function saveLocalWeeklyReview(review: WeeklyReview, markdown: string) {
  const payload = {
    week_start: review.weekStart,
    week_end: review.weekEnd,
    markdown_export: markdown
  };
  const reviews = await readLocalValue<WeeklyReviewRow[]>(REVIEWS_KEY, []);
  const existing = reviews.find((item) => item.week_start === payload.week_start);
  const saved = {
    ...payload,
    id: existing?.id ?? crypto.randomUUID(),
    created_at: existing?.created_at ?? new Date().toISOString()
  };
  await writeLocalValue(REVIEWS_KEY, [...reviews.filter((item) => item.week_start !== payload.week_start), saved]);
  return saved;
}

async function saveLocalAiAnalysis(input: {
  week_start: string;
  week_end: string;
  provider: AiAnalysis["provider"];
  model: string;
  input_summary: string;
  output_json: AnalysisResult;
}) {
  const analyses = await readLocalValue<AiAnalysis[]>(AI_ANALYSES_KEY, []);
  const existing = analyses.find((item) => item.week_start === input.week_start && item.provider === input.provider);
  const saved = {
    ...input,
    id: existing?.id ?? crypto.randomUUID(),
    rating: existing?.rating ?? null,
    correction_note: existing?.correction_note ?? null,
    created_at: existing?.created_at ?? new Date().toISOString()
  };
  const next = analyses.filter((item) => !(item.week_start === input.week_start && item.provider === input.provider));
  next.push(saved);
  await writeLocalValue(AI_ANALYSES_KEY, sortAnalyses(next));
  return saved;
}

async function applySyncOperation(operation: SyncOperation, userId: string) {
  if (!supabase) return;
  switch (operation.entity) {
    case "daily_logs": {
      const { error } = await supabase
        .from("daily_logs")
        .upsert({ ...(operation.payload as DailyLog), user_id: userId }, { onConflict: "user_id,date" });
      if (error) throw new DataAccessError(error.message);
      return;
    }
    case "goals": {
      const { error } = await supabase.from("goals").upsert({ ...(operation.payload as Goal), user_id: userId });
      if (error) throw new DataAccessError(error.message);
      return;
    }
    case "settings": {
      const { error } = await supabase
        .from("settings")
        .upsert({ ...(operation.payload as Settings), user_id: userId }, { onConflict: "user_id" });
      if (error) throw new DataAccessError(error.message);
      return;
    }
    case "weekly_reviews": {
      const { error } = await supabase
        .from("weekly_reviews")
        .upsert({ ...(operation.payload as WeeklyReviewRow), user_id: userId }, { onConflict: "user_id,week_start" });
      if (error) throw new DataAccessError(error.message);
      return;
    }
    case "ai_analyses": {
      if (operation.action === "delete_all") {
        const { error } = await supabase.from("ai_analyses").delete().eq("user_id", userId);
        if (error) throw new DataAccessError(error.message);
        return;
      }
      if (operation.action === "rate") {
        const payload = operation.payload as Pick<AiAnalysis, "id" | "rating" | "correction_note">;
        const { error } = await supabase
          .from("ai_analyses")
          .update({ rating: payload.rating, correction_note: payload.correction_note })
          .eq("id", payload.id)
          .eq("user_id", userId);
        if (error) throw new DataAccessError(error.message);
        return;
      }
      const { error } = await supabase
        .from("ai_analyses")
        .upsert({ ...(operation.payload as AiAnalysis), user_id: userId }, { onConflict: "user_id,week_start,provider" });
      if (error) throw new DataAccessError(error.message);
    }
  }
}

export async function flushSyncQueue() {
  if (!supabase) return;
  const queue = await getPendingSyncOperations();
  if (!queue.length) {
    await writeSyncSnapshot({ pending: 0, lastError: "" });
    return;
  }
  const userId = await requireUserId();
  for (const operation of queue) {
    try {
      await applySyncOperation(operation, userId);
      await removeSyncOperation(operation.id);
    } catch (error) {
      await updateSyncOperationError(operation.id, error instanceof Error ? error.message : "Unable to sync local change.");
      throw error;
    }
  }
  await writeSyncSnapshot({ pending: 0, lastError: "" });
}

export async function getLogs(): Promise<DailyLog[]> {
  return cloudOrLocal<DailyLog[]>(LOGS_KEY, [], async () => {
    const client = cloudClient();
    const userId = await requireUserId();
    const { data, error } = await client
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    if (error) fail(error.message);
    return (data ?? []) as DailyLog[];
  }, (logs) => logs.length > 0).then(sortLogs);
}

export async function getLogByDate(date: string): Promise<DailyLog | undefined> {
  const logs = await getLogs();
  return logs.find((log) => log.date === date);
}

export async function saveLog(log: DailyLog): Promise<DailyLog> {
  const scored = calculateScores({
    ...log,
    updated_at: new Date().toISOString()
  });
  const local = await saveLocalLog(scored);

  if (supabase) {
    try {
      const userId = await requireUserId();
      const payload = { ...local, user_id: userId };
      const { data, error } = await supabase.from("daily_logs").upsert(payload, { onConflict: "user_id,date" }).select().single();
      if (error) fail(error.message);
      const saved = data as DailyLog;
      await saveLocalLog(saved);
      await writeSyncSnapshot({ lastError: "" });
      return saved;
    } catch (error) {
      await enqueueSyncOperation({ entity: "daily_logs", action: "upsert", payload: local });
      await noteCloudError(error);
      return local;
    }
  }

  return local;
}

export async function getGoals(): Promise<Goal[]> {
  return cloudOrLocal<Goal[]>(GOALS_KEY, [], async () => {
    const client = cloudClient();
    const userId = await requireUserId();
    const { data, error } = await client
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) fail(error.message);
    if (data && data.length > 0) return data as Goal[];
    if (data && data.length === 0) {
      const { data: seeded, error: seedError } = await client
        .from("goals")
        .insert(seedGoals.map((goal) => ({ ...goal, user_id: userId })))
        .select();
      if (seedError) fail(seedError.message);
      return (seeded ?? []) as Goal[];
    }
    return [];
  }, (goals) => goals.length > 0).then(async (goals) => {
    if (goals.length) return goals;
    const seeded = seedGoals.map((goal) => ({ ...goal, id: crypto.randomUUID() }));
    await writeLocalValue(GOALS_KEY, seeded);
    return seeded;
  });
}

export async function saveGoal(goal: Goal): Promise<Goal> {
  const payload = { ...goal, updated_at: new Date().toISOString() };
  const local = await saveLocalGoal(payload);
  if (supabase) {
    try {
      const userId = await requireUserId();
      const { data, error } = await supabase.from("goals").upsert({ ...local, user_id: userId }).select().single();
      if (error) fail(error.message);
      const saved = data as Goal;
      await saveLocalGoal(saved);
      await writeSyncSnapshot({ lastError: "" });
      return saved;
    } catch (error) {
      await enqueueSyncOperation({ entity: "goals", action: "upsert", payload: local });
      await noteCloudError(error);
      return local;
    }
  }
  return local;
}

export async function getSettings(): Promise<Settings> {
  return cloudOrLocal<Settings>(SETTINGS_KEY, defaultSettings, async () => {
    const client = cloudClient();
    const userId = await requireUserId();
    const { data, error } = await client.from("settings").select("*").eq("user_id", userId).maybeSingle();
    if (error) fail(error.message);
    if (data) return { ...defaultSettings, ...(data as Settings) };
    const { data: inserted, error: insertError } = await client
      .from("settings")
      .insert({ ...defaultSettings, user_id: userId })
      .select()
      .single();
    if (insertError) fail(insertError.message);
    return inserted as Settings;
  }, Boolean).then((settings) => ({ ...defaultSettings, ...settings }));
}

export async function saveSettings(settings: Settings) {
  const local = await saveLocalSettings(settings);
  if (supabase) {
    try {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("settings")
        .upsert({ ...settings, user_id: userId }, { onConflict: "user_id" })
        .select()
        .single();
      if (error) fail(error.message);
      const saved = data as Settings;
      await saveLocalSettings(saved);
      await writeSyncSnapshot({ lastError: "" });
      return saved;
    } catch (error) {
      await enqueueSyncOperation({ entity: "settings", action: "upsert", payload: local });
      await noteCloudError(error);
      return local;
    }
  }
  return local;
}

export async function saveWeeklyReview(review: WeeklyReview, markdown: string): Promise<WeeklyReviewRow> {
  const local = await saveLocalWeeklyReview(review, markdown);

  if (supabase) {
    try {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("weekly_reviews")
        .upsert({ ...local, user_id: userId }, { onConflict: "user_id,week_start" })
        .select()
        .single();
      if (error) fail(error.message);
      const saved = data as WeeklyReviewRow;
      await writeLocalValue(REVIEWS_KEY, [
        ...(await readLocalValue<WeeklyReviewRow[]>(REVIEWS_KEY, [])).filter((item) => item.week_start !== saved.week_start),
        saved
      ]);
      await writeSyncSnapshot({ lastError: "" });
      return saved;
    } catch (error) {
      await enqueueSyncOperation({ entity: "weekly_reviews", action: "upsert", payload: local });
      await noteCloudError(error);
      return local;
    }
  }
  return local;
}

export async function getMemoryItems(limit = 20): Promise<MemoryItem[]> {
  return cloudOrLocal<MemoryItem[]>(MEMORY_ITEMS_KEY, [], async () => {
    const client = cloudClient();
    const userId = await requireUserId();
    const { data, error } = await client
      .from("memory_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) fail(error.message);
    return (data ?? []) as MemoryItem[];
  }, (items) => items.length > 0).then((items) => items.slice(0, limit));
}

export async function getAiAnalyses(): Promise<AiAnalysis[]> {
  return cloudOrLocal<AiAnalysis[]>(AI_ANALYSES_KEY, [], async () => {
    const client = cloudClient();
    const userId = await requireUserId();
    const { data, error } = await client
      .from("ai_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) fail(error.message);
    return (data ?? []) as AiAnalysis[];
  }, (items) => items.length > 0).then(sortAnalyses);
}

export async function saveAiAnalysis(input: {
  week_start: string;
  week_end: string;
  provider: AiAnalysis["provider"];
  model: string;
  input_summary: string;
  output_json: AnalysisResult;
}): Promise<AiAnalysis> {
  const local = await saveLocalAiAnalysis(input);
  if (supabase) {
    try {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("ai_analyses")
        .upsert({ ...local, user_id: userId }, { onConflict: "user_id,week_start,provider" })
        .select()
        .single();
      if (error) fail(error.message);
      const saved = data as AiAnalysis;
      await saveLocalAiAnalysis(saved);
      await writeSyncSnapshot({ lastError: "" });
      return saved;
    } catch (error) {
      await enqueueSyncOperation({ entity: "ai_analyses", action: "upsert", payload: local });
      await noteCloudError(error);
      return local;
    }
  }
  return local;
}

export async function rateAiAnalysis(id: string, rating: "useful" | "not_useful", correctionNote: string) {
  const analyses = await readLocalValue<AiAnalysis[]>(AI_ANALYSES_KEY, []);
  const next = analyses.map((item) => (item.id === id ? { ...item, rating, correction_note: correctionNote } : item));
  await writeLocalValue(AI_ANALYSES_KEY, next);
  const local = next.find((item) => item.id === id);
  if (!local) fail("Analysis not found.");

  if (supabase) {
    try {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("ai_analyses")
        .update({ rating, correction_note: correctionNote })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) fail(error.message);
      const saved = data as AiAnalysis;
      await writeLocalValue(AI_ANALYSES_KEY, next.map((item) => (item.id === id ? saved : item)));
      await writeSyncSnapshot({ lastError: "" });
      return saved;
    } catch (error) {
      await enqueueSyncOperation({ entity: "ai_analyses", action: "rate", payload: { id, rating, correction_note: correctionNote } });
      await noteCloudError(error);
      return local;
    }
  }
  return local;
}

export async function deleteAiAnalyses() {
  await writeLocalValue(AI_ANALYSES_KEY, []);
  if (supabase) {
    try {
      const userId = await requireUserId();
      const { error } = await supabase.from("ai_analyses").delete().eq("user_id", userId);
      if (error) fail(error.message);
      await writeSyncSnapshot({ lastError: "" });
    } catch (error) {
      await enqueueSyncOperation({ entity: "ai_analyses", action: "delete_all" });
      await noteCloudError(error);
    }
    return;
  }
}

export async function exportBackup() {
  return {
    exported_at: new Date().toISOString(),
    daily_logs: await readLocalValue<DailyLog[]>(LOGS_KEY, []),
    goals: await readLocalValue<Goal[]>(GOALS_KEY, []),
    settings: await readLocalValue<Settings>(SETTINGS_KEY, defaultSettings),
    weekly_reviews: await readLocalValue<WeeklyReviewRow[]>(REVIEWS_KEY, []),
    ai_analyses: await readLocalValue<AiAnalysis[]>(AI_ANALYSES_KEY, []),
    memory_items: await readLocalValue<MemoryItem[]>(MEMORY_ITEMS_KEY, [])
  };
}

export async function importBackup(raw: string) {
  const backup = JSON.parse(raw) as Partial<Awaited<ReturnType<typeof exportBackup>>>;
  await writeLocalValue(LOGS_KEY, sortLogs((backup.daily_logs ?? []) as DailyLog[]));
  await writeLocalValue(GOALS_KEY, (backup.goals ?? []) as Goal[]);
  await writeLocalValue(SETTINGS_KEY, { ...defaultSettings, ...backup.settings });
  await writeLocalValue(REVIEWS_KEY, (backup.weekly_reviews ?? []) as WeeklyReviewRow[]);
  await writeLocalValue(AI_ANALYSES_KEY, sortAnalyses((backup.ai_analyses ?? []) as AiAnalysis[]));
  await writeLocalValue(MEMORY_ITEMS_KEY, (backup.memory_items ?? []) as MemoryItem[]);
  await writeSyncSnapshot({ lastError: "Backup imported locally. Edit and save an item to push it to Supabase." });
}
