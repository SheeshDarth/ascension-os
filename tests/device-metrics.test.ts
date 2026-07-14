import { describe, expect, it } from "vitest";
import { applyDeviceMetricsToLog, formatImportedMetric, metricsForDate, snapshotSourceLabel } from "../lib/device-metrics";
import { emptyLog } from "../lib/scoring";
import type { DeviceMetricSnapshot } from "../lib/types";

const snapshots: DeviceMetricSnapshot[] = [
  {
    device_id: "s23",
    source: "health_connect",
    metric_date: "2026-07-14",
    metrics_json: { steps: 8123, sleep_hours: 7.5, weight_kg: 73.4 },
    permission_snapshot: { health_connect: true },
    captured_at: "2026-07-14T12:00:00.000Z"
  },
  {
    device_id: "s23",
    source: "android_usage_stats",
    metric_date: "2026-07-14",
    metrics_json: { total_screen_minutes: 180, reels_minutes: 35, youtube_minutes: 42 },
    permission_snapshot: { usage_stats: true },
    captured_at: "2026-07-14T12:01:00.000Z"
  },
  {
    device_id: "s23",
    source: "health_connect",
    metric_date: "2026-07-13",
    metrics_json: { steps: 7000 },
    permission_snapshot: { health_connect: true },
    captured_at: "2026-07-13T12:00:00.000Z"
  }
];

describe("device metrics", () => {
  it("fills blank log fields while preserving manual values", () => {
    const result = applyDeviceMetricsToLog(
      {
        ...emptyLog("2026-07-14"),
        steps: 9000,
        sleep_hours: 0,
        reels_minutes: 10
      },
      snapshots
    );

    expect(result.log.steps).toBe(9000);
    expect(result.log.sleep_hours).toBe(7.5);
    expect(result.log.reels_minutes).toBe(10);
    expect(result.log.youtube_minutes).toBe(42);
    expect(result.importedFields).toEqual(["sleep_hours", "weight_kg", "youtube_minutes"]);
  });

  it("filters snapshots by explicit metric date", () => {
    expect(metricsForDate(snapshots, "2026-07-13")).toHaveLength(1);
    expect(metricsForDate(snapshots, "2026-07-14")).toHaveLength(2);
  });

  it("formats signal values and identifies sources", () => {
    expect(formatImportedMetric(7.56, " h")).toBe("7.6 h");
    expect(formatImportedMetric(undefined)).toBe("No signal");
    expect(snapshotSourceLabel("android_usage_stats")).toBe("Android Usage Access");
  });
});
