"use client";

import { seedGoals, defaultSettings } from "@/lib/goals";
import { calculateScores } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { DailyLog, Goal, Settings, WeeklyReview, WeeklyReviewRow } from "@/lib/types";

const LOGS_KEY = "ascensionos.daily_logs";
const GOALS_KEY = "ascensionos.goals";
const SETTINGS_KEY = "ascensionos.settings";
const REVIEWS_KEY = "ascensionos.weekly_reviews";

export class DataAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataAccessError";
  }
}

const browser = () => typeof window !== "undefined";

function readLocal<T>(key: string, fallback: T): T {
  if (!browser()) return fallback;
  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

function writeLocal<T>(key: string, value: T) {
  if (browser()) window.localStorage.setItem(key, JSON.stringify(value));
}

function sortLogs(logs: DailyLog[]) {
  return logs.sort((a, b) => b.date.localeCompare(a.date));
}

async function requireUserId() {
  if (!supabase) return undefined;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new DataAccessError(error.message);
  if (!data.user) throw new DataAccessError("Sign in required. Open /login to unlock cross-device sync.");
  return data.user.id;
}

function fail(message: string) {
  throw new DataAccessError(message);
}

export async function getLogs(): Promise<DailyLog[]> {
  if (supabase) {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    if (error) fail(error.message);
    return (data ?? []) as DailyLog[];
  }
  return sortLogs(readLocal<DailyLog[]>(LOGS_KEY, []));
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

  if (supabase) {
    const userId = await requireUserId();
    const payload = { ...scored, user_id: userId };
    const { data, error } = await supabase.from("daily_logs").upsert(payload, { onConflict: "user_id,date" }).select().single();
    if (error) fail(error.message);
    return data as DailyLog;
  }

  const logs = readLocal<DailyLog[]>(LOGS_KEY, []);
  const index = logs.findIndex((item) => item.date === scored.date);
  if (index >= 0) logs[index] = scored;
  else logs.push({ ...scored, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  writeLocal(LOGS_KEY, sortLogs(logs));
  return scored;
}

export async function getGoals(): Promise<Goal[]> {
  if (supabase) {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) fail(error.message);
    if (data && data.length > 0) return data as Goal[];
    if (data && data.length === 0) {
      const { data: seeded, error: seedError } = await supabase
        .from("goals")
        .insert(seedGoals.map((goal) => ({ ...goal, user_id: userId })))
        .select();
      if (seedError) fail(seedError.message);
      return (seeded ?? []) as Goal[];
    }
  }

  const local = readLocal<Goal[]>(GOALS_KEY, []);
  if (local.length) return local;
  const seeded = seedGoals.map((goal) => ({ ...goal, id: crypto.randomUUID() }));
  writeLocal(GOALS_KEY, seeded);
  return seeded;
}

export async function saveGoal(goal: Goal): Promise<Goal> {
  const payload = { ...goal, updated_at: new Date().toISOString() };
  if (supabase) {
    const userId = await requireUserId();
    const { data, error } = await supabase.from("goals").upsert({ ...payload, user_id: userId }).select().single();
    if (error) fail(error.message);
    return data as Goal;
  }

  const goals = await getGoals();
  const id = payload.id ?? crypto.randomUUID();
  const next = goals.map((item) => (item.id === id ? { ...payload, id } : item));
  if (!goals.some((item) => item.id === id)) next.push({ ...payload, id });
  writeLocal(GOALS_KEY, next);
  return { ...payload, id };
}

export async function getSettings(): Promise<Settings> {
  if (supabase) {
    const userId = await requireUserId();
    const { data, error } = await supabase.from("settings").select("*").eq("user_id", userId).maybeSingle();
    if (error) fail(error.message);
    if (data) return data as Settings;
    const { data: inserted, error: insertError } = await supabase
      .from("settings")
      .insert({ ...defaultSettings, user_id: userId })
      .select()
      .single();
    if (insertError) fail(insertError.message);
    return inserted as Settings;
  }
  return readLocal<Settings>(SETTINGS_KEY, defaultSettings);
}

export async function saveSettings(settings: Settings) {
  if (supabase) {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("settings")
      .upsert({ ...settings, user_id: userId }, { onConflict: "user_id" })
      .select()
      .single();
    if (error) fail(error.message);
    return data as Settings;
  }
  writeLocal(SETTINGS_KEY, settings);
  return settings;
}

export async function saveWeeklyReview(review: WeeklyReview, markdown: string): Promise<WeeklyReviewRow> {
  const payload = {
    week_start: review.weekStart,
    week_end: review.weekEnd,
    markdown_export: markdown
  };

  if (supabase) {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("weekly_reviews")
      .upsert({ ...payload, user_id: userId }, { onConflict: "user_id,week_start" })
      .select()
      .single();
    if (error) fail(error.message);
    return data as WeeklyReviewRow;
  }

  const reviews = readLocal<WeeklyReviewRow[]>(REVIEWS_KEY, []);
  const next = reviews.filter((item) => item.week_start !== payload.week_start);
  const saved = { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  next.push(saved);
  writeLocal(REVIEWS_KEY, next);
  return saved;
}
