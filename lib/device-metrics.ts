import type { DailyLog, DeviceMetricSnapshot, DeviceMetricSource, DeviceMetrics, Settings } from "@/lib/types";

const fillableFields: Array<[keyof DailyLog, keyof DeviceMetricSnapshot["metrics_json"]]> = [
  ["steps", "steps"],
  ["sleep_hours", "sleep_hours"],
  ["weight_kg", "weight_kg"],
  ["water_litres", "water_litres"],
  ["reels_minutes", "reels_minutes"],
  ["youtube_minutes", "youtube_minutes"]
];

export function applyDeviceMetricsToLog(log: DailyLog, snapshots: DeviceMetricSnapshot[]) {
  const next = { ...log };
  const importedFields: string[] = [];

  for (const [logField, metricField] of fillableFields) {
    if (Number(next[logField]) !== 0) continue;
    const value = snapshots
      .map((snapshot) => snapshot.metrics_json[metricField])
      .find((candidate) => typeof candidate === "number" && Number.isFinite(candidate));
    if (typeof value !== "number") continue;
    next[logField] = value as never;
    importedFields.push(String(logField));
  }

  return { log: next, importedFields };
}

export function metricsForDate(snapshots: DeviceMetricSnapshot[], date: string) {
  return snapshots.filter((snapshot) => snapshot.metric_date === date);
}

const metricKeys: Array<keyof DeviceMetrics> = [
  "steps",
  "sleep_hours",
  "weight_kg",
  "water_litres",
  "exercise_minutes",
  "total_screen_minutes",
  "reels_minutes",
  "youtube_minutes",
  "social_minutes"
];

type Tone = "neutral" | "good" | "warn" | "danger";

export type DeviceInsightCard = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
};

export type DailyDeviceInsight = {
  date: string;
  hasSignal: boolean;
  readinessScore: number;
  recoveryScore: number;
  bodyScore: number;
  focusRisk: number;
  summary: string;
  nextAction: string;
  capturedAt?: string;
  cards: DeviceInsightCard[];
};

export type DeviceTelemetryDay = {
  date: string;
  metrics: DeviceMetrics;
  sources: DeviceMetricSource[];
  capturedAt?: string;
  hasSignal: boolean;
};

export type DeviceTelemetryStats = {
  days: DeviceTelemetryDay[];
  capturedDays: number;
  averageSleep: number;
  averageSteps: number;
  averageScreenMinutes: number;
  averageShortFormMinutes: number;
  latest?: DeviceTelemetryDay;
};

function isFiniteMetric(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function rounded(value: number) {
  return Math.round(value * 10) / 10;
}

function averageMetric(values: number[]) {
  return values.length ? rounded(values.reduce((total, value) => total + value, 0) / values.length) : 0;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function datesInRange(days: 7 | 30 | 90, now = new Date()) {
  const start = addDays(now, -(days - 1));
  return Array.from({ length: days }, (_, index) => dateKey(addDays(start, index)));
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function parseSleepTarget(settings?: Pick<Settings, "sleep_target">) {
  const match = settings?.sleep_target.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 7;
}

function toneForScore(score: number): Tone {
  if (score >= 75) return "good";
  if (score >= 50) return "warn";
  return "danger";
}

function shortFormMetric(metrics: DeviceMetrics) {
  if (isFiniteMetric(metrics.reels_minutes)) return metrics.reels_minutes;
  if (isFiniteMetric(metrics.social_minutes)) return metrics.social_minutes;
  return undefined;
}

function sourceNames(sources: DeviceMetricSource[]) {
  return sources.length ? sources.map(snapshotSourceLabel).join(" + ") : "No device source";
}

export function aggregateDeviceMetrics(snapshots: DeviceMetricSnapshot[], date: string): DeviceTelemetryDay {
  const sources = new Set<DeviceMetricSource>();
  const metrics: DeviceMetrics = {};
  let capturedAt: string | undefined;

  const sorted = metricsForDate(snapshots, date).sort((a, b) => a.captured_at.localeCompare(b.captured_at));
  for (const snapshot of sorted) {
    sources.add(snapshot.source);
    if (!capturedAt || snapshot.captured_at > capturedAt) capturedAt = snapshot.captured_at;
    for (const key of metricKeys) {
      const value = snapshot.metrics_json[key];
      if (isFiniteMetric(value)) metrics[key] = value;
    }
  }

  const hasSignal = metricKeys.some((key) => isFiniteMetric(metrics[key]));
  return { date, metrics, sources: [...sources], capturedAt, hasSignal };
}

export function buildDeviceTelemetryStats(
  snapshots: DeviceMetricSnapshot[],
  range: 7 | 30 | 90,
  now = new Date()
): DeviceTelemetryStats {
  const days = datesInRange(range, now).map((date) => aggregateDeviceMetrics(snapshots, date));
  const captured = days.filter((day) => day.hasSignal);

  return {
    days,
    capturedDays: captured.length,
    averageSleep: averageMetric(captured.map((day) => day.metrics.sleep_hours).filter(isFiniteMetric)),
    averageSteps: Math.round(averageMetric(captured.map((day) => day.metrics.steps).filter(isFiniteMetric))),
    averageScreenMinutes: Math.round(averageMetric(captured.map((day) => day.metrics.total_screen_minutes).filter(isFiniteMetric))),
    averageShortFormMinutes: Math.round(averageMetric(captured.map((day) => shortFormMetric(day.metrics)).filter(isFiniteMetric))),
    latest: [...captured].reverse()[0]
  };
}

export function buildDailyDeviceInsight(
  snapshots: DeviceMetricSnapshot[],
  date: string,
  settings?: Pick<Settings, "sleep_target" | "reels_limit">
): DailyDeviceInsight {
  const day = aggregateDeviceMetrics(snapshots, date);
  const sleepTarget = parseSleepTarget(settings);
  const reelsLimit = settings?.reels_limit ?? 30;
  const sleepHours = day.metrics.sleep_hours;
  const steps = day.metrics.steps;
  const exerciseMinutes = day.metrics.exercise_minutes;
  const screenMinutes = day.metrics.total_screen_minutes;
  const shortMinutes = shortFormMetric(day.metrics);

  const recoveryScore = isFiniteMetric(sleepHours) ? clamp(Math.round((sleepHours / sleepTarget) * 100)) : 0;
  const stepScore = isFiniteMetric(steps) ? clamp(Math.round((steps / 8000) * 100)) : 0;
  const exerciseScore = isFiniteMetric(exerciseMinutes) ? clamp(Math.round((exerciseMinutes / 30) * 100)) : 0;
  const bodyScore = Math.max(stepScore, exerciseScore);
  const screenRisk = isFiniteMetric(screenMinutes) ? clamp(Math.round((screenMinutes / 360) * 60)) : 0;
  const shortRisk = isFiniteMetric(shortMinutes) ? clamp(Math.round((shortMinutes / Math.max(reelsLimit, 1)) * 65)) : 0;
  const focusRisk = clamp(Math.max(screenRisk, shortRisk));
  const readinessScore = day.hasSignal ? Math.round((recoveryScore + bodyScore + (100 - focusRisk)) / 3) : 0;

  let summary = "S23 telemetry is waiting for a sync.";
  let nextAction = "Open Phone telemetry and sync today's signal.";
  if (day.hasSignal && recoveryScore < 55) {
    summary = "Recovery is the main bottleneck today.";
    nextAction = "Protect sleep tonight before adding more intensity.";
  } else if (day.hasSignal && focusRisk >= 65) {
    summary = "Phone usage is creating a focus risk.";
    nextAction = "Set a hard short-form cutoff for the next 24 hours.";
  } else if (day.hasSignal && bodyScore < 55) {
    summary = "Body baseline is under target.";
    nextAction = "Get a walk or 30-minute training block before the day closes.";
  } else if (day.hasSignal) {
    summary = "Device layer supports a stronger operating day.";
    nextAction = "Use the signal: one hard block, one body lock, zero drift.";
  }

  return {
    date,
    hasSignal: day.hasSignal,
    readinessScore,
    recoveryScore,
    bodyScore,
    focusRisk,
    summary,
    nextAction,
    capturedAt: day.capturedAt,
    cards: [
      {
        label: "Recovery",
        value: formatImportedMetric(sleepHours, "h"),
        detail: isFiniteMetric(sleepHours) ? `${recoveryScore}/100 vs ${sleepTarget}h target` : "Grant Health Connect sleep access.",
        tone: day.hasSignal ? toneForScore(recoveryScore) : "neutral"
      },
      {
        label: "Body signal",
        value: isFiniteMetric(steps) ? `${Math.round(steps).toLocaleString()} steps` : formatImportedMetric(exerciseMinutes, "m exercise"),
        detail: isFiniteMetric(steps) || isFiniteMetric(exerciseMinutes) ? `${bodyScore}/100 movement readiness` : "Steps or workout data missing.",
        tone: day.hasSignal ? toneForScore(bodyScore) : "neutral"
      },
      {
        label: "Focus risk",
        value: isFiniteMetric(shortMinutes) ? `${Math.round(shortMinutes)}m short-form` : formatImportedMetric(screenMinutes, "m screen"),
        detail: isFiniteMetric(screenMinutes) ? `${Math.round(screenMinutes)}m total screen time` : "Usage access not synced yet.",
        tone: focusRisk >= 65 ? "danger" : focusRisk >= 35 ? "warn" : day.hasSignal ? "good" : "neutral"
      },
      {
        label: "Source",
        value: day.hasSignal ? sourceNames(day.sources) : "Not connected",
        detail: day.capturedAt ? `Captured ${new Date(day.capturedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "APK bridge required for phone telemetry.",
        tone: day.hasSignal ? "good" : "warn"
      }
    ]
  };
}

export function formatImportedMetric(value: number | undefined, suffix = "") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "No signal";
  return `${Math.round(value * 10) / 10}${suffix}`;
}

export function snapshotSourceLabel(source: DeviceMetricSnapshot["source"]) {
  return source === "health_connect" ? "Health Connect" : source === "android_usage_stats" ? "Android Usage Access" : "Manual";
}
