import type { DailyLog, DeviceMetricSnapshot } from "@/lib/types";

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

export function formatImportedMetric(value: number | undefined, suffix = "") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "No signal";
  return `${Math.round(value * 10) / 10}${suffix}`;
}

export function snapshotSourceLabel(source: DeviceMetricSnapshot["source"]) {
  return source === "health_connect" ? "Health Connect" : source === "android_usage_stats" ? "Android Usage Access" : "Manual";
}
