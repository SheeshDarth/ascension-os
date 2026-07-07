import type { DailyLog } from "./types";

export type GraphRange = 7 | 30 | 90;

export type DomainNode = {
  label: string;
  value: number;
  detail: string;
  x: number;
  y: number;
};

export type MemoryStats = {
  logs: DailyLog[];
  averageExecution: number;
  currentStreak: number;
  bestStreak: number;
  weakestDomain: string;
  nodes: DomainNode[];
};

export const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function logsInRange(logs: DailyLog[], days: GraphRange, now = new Date()) {
  const end = dateKey(now);
  const start = dateKey(addDays(now, -(days - 1)));
  return [...logs].filter((log) => log.date >= start && log.date <= end).sort((a, b) => a.date.localeCompare(b.date));
}

function streaks(logs: DailyLog[], threshold = 60) {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0;
  let running = 0;

  for (const log of sorted) {
    if (log.execution_score >= threshold) {
      running += 1;
      best = Math.max(best, running);
    } else {
      running = 0;
    }
  }

  let current = 0;
  for (const log of [...sorted].reverse()) {
    if (log.execution_score < threshold) break;
    current += 1;
  }

  return { current, best };
}

export function buildDomainNodes(logs: DailyLog[]): DomainNode[] {
  const gymDays = logs.filter((log) => log.gym_done).length;
  const dietDays = logs.filter((log) => log.diet_followed).length;
  const cleanDays = logs.filter((log) => !log.porn_relapse).length;
  const count = Math.max(logs.length, 1);

  return [
    {
      label: "Physique",
      value: average(logs.map((log) => log.physique_score)),
      detail: `${gymDays}/${count} gym days`,
      x: 50,
      y: 14
    },
    {
      label: "Career",
      value: average(logs.map((log) => log.career_score)),
      detail: `${logs.reduce((total, log) => total + log.dsa_minutes + log.nirmiq_minutes, 0)}m DSA+NIRMIQ`,
      x: 84,
      y: 35
    },
    {
      label: "Discipline",
      value: average(logs.map((log) => log.discipline_score)),
      detail: `${dietDays}/${count} diet days`,
      x: 72,
      y: 78
    },
    {
      label: "Dopamine",
      value: average(logs.map((log) => log.dopamine_score)),
      detail: `${cleanDays}/${count} clean days`,
      x: 28,
      y: 78
    },
    {
      label: "Self-Respect",
      value: average(logs.map((log) => log.self_respect_score)),
      detail: `${average(logs.map((log) => log.self_respect))}/10 rating`,
      x: 16,
      y: 35
    }
  ];
}

export function buildMemoryStats(logs: DailyLog[], range: GraphRange, now = new Date()): MemoryStats {
  const windowLogs = logsInRange(logs, range, now);
  const nodes = buildDomainNodes(windowLogs);
  const { current, best } = streaks(windowLogs);
  const weakest = [...nodes].sort((a, b) => a.value - b.value)[0];

  return {
    logs: windowLogs,
    averageExecution: average(windowLogs.map((log) => log.execution_score)),
    currentStreak: current,
    bestStreak: best,
    weakestDomain: weakest?.label ?? "No data",
    nodes
  };
}
