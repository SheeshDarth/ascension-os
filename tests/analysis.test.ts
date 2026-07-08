import { describe, expect, it } from "vitest";
import { buildAnalysisInputSummary, buildCompactAnalysisInput, deterministicWeeklyAnalysis, parseAnalysisResult } from "../lib/analysis";
import { geminiAnalyzeWeekly } from "../lib/gemini";
import { calculateScores, emptyLog } from "../lib/scoring";
import { buildWeeklyReview } from "../lib/weekly";
import type { AnalysisInput } from "../lib/types";

function input(): AnalysisInput {
  const logs = [
    calculateScores({
      ...emptyLog("2026-07-06"),
      gym_done: true,
      diet_followed: true,
      dsa_minutes: 45,
      nirmiq_minutes: 60,
      deep_work_minutes: 90,
      reels_minutes: 20,
      hardest_task_done: "Built the AI spine"
    }),
    calculateScores({
      ...emptyLog("2026-07-07"),
      reels_minutes: 75,
      biggest_distraction: "shorts"
    })
  ];
  const weeklyReview = buildWeeklyReview(logs, new Date("2026-07-07T00:00:00.000Z"));
  return {
    weekStart: weeklyReview.weekStart,
    weekEnd: weeklyReview.weekEnd,
    logs,
    weeklyReview,
    goals: [],
    memoryItems: [],
    consent: { allowCloudAnalysis: false, provider: "deterministic" }
  };
}

describe("AI analysis", () => {
  it("returns a valid deterministic weekly analysis with citations", () => {
    const result = deterministicWeeklyAnalysis(input());

    expect(result.summary).toContain("execution");
    expect(result.provider).toBe("deterministic");
    expect(result.nextActions.length).toBeGreaterThan(0);
    expect(result.sourceDates).toContain("2026-07-06");
    expect(result.sourceMetrics.some((metric) => metric.startsWith("average_execution="))).toBe(true);
  });

  it("rejects invalid Gemini-style output", () => {
    expect(() => parseAnalysisResult({ summary: "missing arrays" })).toThrow(/missing string array/i);
  });

  it("falls back when Gemini API key is missing", async () => {
    const oldKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const result = await geminiAnalyzeWeekly(input());
    process.env.GEMINI_API_KEY = oldKey;

    expect(result.provider).toBe("deterministic");
    expect(result.caveats.join(" ")).toMatch(/missing/i);
  });

  it("builds an auditable input summary", () => {
    expect(buildAnalysisInputSummary(input())).toContain("Avg execution");
  });

  it("builds a compact cloud payload without raw daily log fields", () => {
    const compact = buildCompactAnalysisInput(input());

    expect(compact.metrics.averageExecution).toBeGreaterThan(0);
    expect(compact.sourceDates).toContain("2026-07-06");
    expect(JSON.stringify(compact)).not.toContain("wake_time");
    expect(JSON.stringify(compact)).not.toContain("sleep_time");
  });
});
