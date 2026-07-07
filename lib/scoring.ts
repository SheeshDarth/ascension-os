import type { DailyLog } from "./types";

export const SCORE_FORMULA_VERSION = 1;

export const emptyLog = (date = new Date().toISOString().slice(0, 10)): DailyLog => ({
  date,
  score_formula_version: SCORE_FORMULA_VERSION,
  wake_time: "",
  sleep_time: "",
  sleep_hours: 0,
  gym_done: false,
  workout_quality: 5,
  diet_followed: false,
  protein_grams: 0,
  water_litres: 0,
  weight_kg: 0,
  steps: 0,
  dsa_minutes: 0,
  nirmiq_minutes: 0,
  academic_minutes: 0,
  deep_work_minutes: 0,
  porn_relapse: false,
  masturbation_count: 0,
  reels_minutes: 0,
  youtube_minutes: 0,
  smoking: false,
  money_earned: 0,
  money_spent: 0,
  grooming_done: false,
  skincare_done: false,
  social_action: "",
  hardest_task_done: "",
  biggest_distraction: "",
  mood: 5,
  self_respect: 5,
  notes: "",
  execution_score: 0,
  discipline_score: 0,
  career_score: 0,
  dopamine_score: 0,
  physique_score: 0,
  self_respect_score: 0
});

const hasProof = (value: string) => value.trim().length > 0;
const sleptTarget = (hours: number) => hours >= 7 && hours <= 8.5;

export function calculateScores(input: DailyLog): DailyLog {
  const execution =
    (input.gym_done ? 10 : 0) +
    (input.diet_followed ? 10 : 0) +
    (input.dsa_minutes >= 45 ? 15 : 0) +
    (input.nirmiq_minutes >= 60 ? 15 : 0) +
    (input.academic_minutes >= 30 ? 10 : 0) +
    (input.deep_work_minutes >= 90 ? 15 : 0) +
    (!input.porn_relapse ? 10 : 0) +
    (input.reels_minutes <= 30 ? 10 : 0) +
    (hasProof(input.hardest_task_done) ? 5 : 0);

  const discipline =
    (sleptTarget(input.sleep_hours) ? 15 : 0) +
    (input.gym_done ? 10 : 0) +
    (input.diet_followed ? 10 : 0) +
    (!input.porn_relapse ? 20 : 0) +
    (input.reels_minutes <= 30 ? 15 : 0) +
    (input.dsa_minutes >= 45 ? 15 : 0) +
    (input.nirmiq_minutes >= 60 ? 15 : 0);

  const career =
    (input.dsa_minutes >= 45 ? 30 : 0) +
    (input.nirmiq_minutes >= 60 ? 30 : 0) +
    (input.deep_work_minutes >= 90 ? 20 : 0) +
    (input.money_earned > 0 ? 10 : 0) +
    (hasProof(input.hardest_task_done) ? 10 : 0);

  const dopamine =
    (!input.porn_relapse ? 35 : 0) +
    (input.masturbation_count <= 1 ? 15 : 0) +
    (input.reels_minutes <= 30 ? 25 : 0) +
    (input.youtube_minutes <= 60 ? 10 : 0) +
    (!input.smoking ? 15 : 0);

  const physique =
    (input.gym_done ? 25 : 0) +
    (input.diet_followed ? 25 : 0) +
    (input.protein_grams >= 100 ? 20 : 0) +
    (input.water_litres >= 3 ? 10 : 0) +
    (sleptTarget(input.sleep_hours) ? 10 : 0) +
    (input.steps >= 7000 ? 10 : 0);

  const selfRespect = Math.round(execution * 0.4 + discipline * 0.3 + input.self_respect * 10 * 0.3);

  return {
    ...input,
    score_formula_version: input.score_formula_version || SCORE_FORMULA_VERSION,
    execution_score: execution,
    discipline_score: discipline,
    career_score: career,
    dopamine_score: dopamine,
    physique_score: physique,
    self_respect_score: selfRespect
  };
}

export function statusForScore(score: number) {
  if (score >= 90) return "Ascending - today you acted like the future version.";
  if (score >= 75) return "Locked In - strong day, keep stacking proof.";
  if (score >= 60) return "Surviving - acceptable, but not dangerous yet.";
  if (score >= 40) return "Slipping - you gave your weakness too much control.";
  return "Wasted Potential - brutal reset needed tomorrow.";
}

export function scoreTone(score: number) {
  if (score >= 75) return "text-emerald";
  if (score >= 60) return "text-cyan";
  if (score >= 40) return "text-amber";
  return "text-red-400";
}
