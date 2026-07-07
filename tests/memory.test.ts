import { describe, expect, it } from "vitest";
import { buildMemoryStats, logsInRange } from "../lib/memory";
import { calculateScores, emptyLog } from "../lib/scoring";

const makeLog = (date: string, execution: "strong" | "weak") =>
  calculateScores({
    ...emptyLog(date),
    gym_done: execution === "strong",
    diet_followed: execution === "strong",
    dsa_minutes: execution === "strong" ? 45 : 0,
    nirmiq_minutes: execution === "strong" ? 60 : 0,
    academic_minutes: execution === "strong" ? 30 : 0,
    deep_work_minutes: execution === "strong" ? 90 : 0,
    reels_minutes: execution === "strong" ? 20 : 90,
    hardest_task_done: execution === "strong" ? "Proof" : ""
  });

describe("memory graph analytics", () => {
  it("filters logs into explicit date windows", () => {
    const logs = [makeLog("2026-04-01", "strong"), makeLog("2026-07-01", "weak"), makeLog("2026-07-07", "strong")];
    const ranged = logsInRange(logs, 7, new Date("2026-07-07T00:00:00.000Z"));

    expect(ranged.map((log) => log.date)).toEqual(["2026-07-01", "2026-07-07"]);
  });

  it("calculates streaks, averages, and weakest domain", () => {
    const logs = [makeLog("2026-07-05", "strong"), makeLog("2026-07-06", "weak"), makeLog("2026-07-07", "strong")];
    const stats = buildMemoryStats(logs, 7, new Date("2026-07-07T00:00:00.000Z"));

    expect(stats.logs).toHaveLength(3);
    expect(stats.averageExecution).toBeGreaterThan(0);
    expect(stats.currentStreak).toBe(1);
    expect(stats.bestStreak).toBe(1);
    expect(stats.weakestDomain).toBeTruthy();
  });
});
