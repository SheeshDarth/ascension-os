import { describe, expect, it } from "vitest";
import { buildWeeklyReview } from "../lib/weekly";
import { calculateScores, emptyLog } from "../lib/scoring";

describe("buildWeeklyReview", () => {
  it("handles an empty week", () => {
    const review = buildWeeklyReview([], new Date("2026-07-07T00:00:00.000Z"));

    expect(review.logs).toHaveLength(0);
    expect(review.averageExecution).toBe(0);
    expect(review.repeatedDistraction).toBe("No repeated distraction logged.");
  });

  it("aggregates partial week totals and detects best, worst, and repeated distraction", () => {
    const logs = [
      calculateScores({
        ...emptyLog("2026-07-06"),
        gym_done: true,
        diet_followed: true,
        dsa_minutes: 45,
        nirmiq_minutes: 60,
        academic_minutes: 30,
        deep_work_minutes: 90,
        reels_minutes: 20,
        hardest_task_done: "DSA",
        biggest_distraction: "reels"
      }),
      calculateScores({
        ...emptyLog("2026-07-07"),
        porn_relapse: true,
        reels_minutes: 90,
        biggest_distraction: "reels"
      })
    ];

    const review = buildWeeklyReview(logs, new Date("2026-07-07T00:00:00.000Z"));

    expect(review.logs).toHaveLength(2);
    expect(review.totalDsa).toBe(45);
    expect(review.totalNirmiq).toBe(60);
    expect(review.relapseDays).toBe(1);
    expect(review.bestDay?.date).toBe("2026-07-06");
    expect(review.worstDay?.date).toBe("2026-07-07");
    expect(review.repeatedDistraction).toBe("reels");
  });
});
