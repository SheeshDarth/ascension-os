"use client";

import { seedGoals, defaultSettings } from "@/lib/goals";
import { calculateScores } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import type { DailyLog, Goal, Settings } from "@/lib/types";

const LOGS_KEY = "ascensionos.daily_logs";
const GOALS_KEY = "ascensionos.goals";
const SETTINGS_KEY = "ascensionos.settings";

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

export async function getLogs(): Promise<DailyLog[]> {
  if (supabase) {
    const { data, error } = await supabase.from("daily_logs").select("*").order("date", { ascending: false });
    if (!error && data) return data as DailyLog[];
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
    const { data, error } = await supabase.from("daily_logs").upsert(scored, { onConflict: "date" }).select().single();
    if (!error && data) return data as DailyLog;
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
    const { data, error } = await supabase.from("goals").select("*").order("created_at", { ascending: true });
    if (!error && data && data.length > 0) return data as Goal[];
    if (!error && data && data.length === 0) {
      const { data: seeded } = await supabase.from("goals").insert(seedGoals).select();
      if (seeded) return seeded as Goal[];
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
    const { data, error } = await supabase.from("goals").upsert(payload).select().single();
    if (!error && data) return data as Goal;
  }

  const goals = await getGoals();
  const id = payload.id ?? crypto.randomUUID();
  const next = goals.map((item) => (item.id === id ? { ...payload, id } : item));
  if (!goals.some((item) => item.id === id)) next.push({ ...payload, id });
  writeLocal(GOALS_KEY, next);
  return { ...payload, id };
}

export function getSettings(): Settings {
  return readLocal<Settings>(SETTINGS_KEY, defaultSettings);
}

export function saveSettings(settings: Settings) {
  writeLocal(SETTINGS_KEY, settings);
}
