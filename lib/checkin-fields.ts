import type { DailyLog } from "@/lib/types";

export type DailyLogKey = keyof DailyLog;

export const toggleFields: Array<[DailyLogKey, string]> = [
  ["gym_done", "Gym done"],
  ["diet_followed", "Diet followed"],
  ["porn_relapse", "Porn relapse"],
  ["smoking", "Smoking"],
  ["grooming_done", "Grooming done"],
  ["skincare_done", "Skincare done"]
];

export const numberFields: Array<[DailyLogKey, string, number?, number?]> = [
  ["sleep_hours", "Sleep hours", 0, 16],
  ["workout_quality", "Workout quality", 1, 10],
  ["protein_grams", "Protein grams", 0],
  ["water_litres", "Water litres", 0],
  ["weight_kg", "Weight kg", 0],
  ["steps", "Steps", 0],
  ["dsa_minutes", "DSA minutes", 0],
  ["nirmiq_minutes", "NIRMIQ minutes", 0],
  ["academic_minutes", "Academic study minutes", 0],
  ["deep_work_minutes", "Deep work minutes", 0],
  ["masturbation_count", "Masturbation count", 0],
  ["reels_minutes", "Reels/shorts minutes", 0],
  ["youtube_minutes", "YouTube minutes", 0],
  ["money_earned", "Money earned", 0],
  ["money_spent", "Money spent", 0],
  ["mood", "Mood", 1, 10],
  ["self_respect", "Self-respect", 1, 10]
];

export const textFields: Array<[DailyLogKey, string, string]> = [
  ["social_action", "Social action", "One social rep you took"],
  ["hardest_task_done", "Hardest task done today", "The one task that mattered"],
  ["biggest_distraction", "Biggest distraction", "What pulled you off path"],
  ["notes", "Notes", "Brutal truth, no stories"]
];
