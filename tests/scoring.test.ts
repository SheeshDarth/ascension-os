import { describe, expect, it } from "vitest";
import { calculateScores, emptyLog, SCORE_FORMULA_VERSION } from "../lib/scoring";

describe("calculateScores", () => {
  it("calculates all max scores for a fully executed day", () => {
    const log = calculateScores({
      ...emptyLog("2026-07-01"),
      gym_done: true,
      diet_followed: true,
      dsa_minutes: 45,
      nirmiq_minutes: 60,
      academic_minutes: 30,
      deep_work_minutes: 90,
      porn_relapse: false,
      reels_minutes: 30,
      hardest_task_done: "Built proof",
      sleep_hours: 8,
      money_earned: 100,
      masturbation_count: 1,
      youtube_minutes: 60,
      smoking: false,
      protein_grams: 120,
      water_litres: 3,
      steps: 8000,
      self_respect: 10
    });

    expect(log.execution_score).toBe(100);
    expect(log.discipline_score).toBe(100);
    expect(log.career_score).toBe(100);
    expect(log.dopamine_score).toBe(100);
    expect(log.physique_score).toBe(100);
    expect(log.self_respect_score).toBe(100);
    expect(log.score_formula_version).toBe(SCORE_FORMULA_VERSION);
  });

  it("penalizes relapse, distraction, and missed execution", () => {
    const log = calculateScores({
      ...emptyLog("2026-07-02"),
      porn_relapse: true,
      reels_minutes: 120,
      youtube_minutes: 180,
      smoking: true,
      self_respect: 2
    });

    expect(log.execution_score).toBe(0);
    expect(log.discipline_score).toBe(0);
    expect(log.career_score).toBe(0);
    expect(log.dopamine_score).toBe(15);
    expect(log.physique_score).toBe(0);
    expect(log.self_respect_score).toBe(6);
  });
});
