import type { Goal, Settings } from "./types";

export const defaultSettings: Settings = {
  id: undefined,
  user_id: undefined,
  user_name: "Siddharth",
  target_weight: 74,
  dsa_daily_target: 45,
  nirmiq_daily_target: 60,
  academic_daily_target: 30,
  reels_limit: 30,
  sleep_target: "7-8.5 hours",
  ai_provider: "deterministic",
  ai_consent: false
};

export const seedGoals: Goal[] = [
  {
    category: "Physique",
    title: "Reach 72-75 kg lean athletic body",
    target:
      "Reduce from 82-83 kg to 72-75 kg with visible muscle, reduced love handles, better shoulders, better posture, and hybrid athlete look.",
    current_value: "82-83 kg",
    deadline: "2026-12-31",
    status: "Active",
    notes: ""
  },
  {
    category: "Career",
    title: "Build NIRMIQ ResearchOS MVP",
    target:
      "Local-first academic intelligence system for document understanding, exam preparation, research paper development, and academic guide creation.",
    current_value: "MVP in progress",
    deadline: "2026-12-31",
    status: "Active",
    notes: ""
  },
  {
    category: "DSA",
    title: "Become competent in DSA",
    target: "Build consistent DSA practice and become strong enough for interviews and confidence.",
    current_value: "Building consistency",
    deadline: "2026-12-31",
    status: "Active",
    notes: ""
  },
  {
    category: "Academics",
    title: "Academic comeback",
    target: "9.0+ GPA and a proper exam preparation system.",
    current_value: "System under construction",
    deadline: "2026-12-31",
    status: "Active",
    notes: ""
  },
  {
    category: "Income",
    title: "Earn first meaningful money",
    target: "First Rs 1k, Rs 5k, Rs 10k, then Rs 30k+/month through AI automation, NIRMIQ, services, or projects.",
    current_value: "Rs 0 baseline",
    deadline: "2026-12-31",
    status: "Active",
    notes: ""
  },
  {
    category: "Looks",
    title: "Clean masculine athletic presence",
    target: "Better grooming, skincare, haircare, clothing fit, posture, fragrance, and photo confidence.",
    current_value: "Baseline audit needed",
    deadline: "2026-12-31",
    status: "Active",
    notes: ""
  },
  {
    category: "Habits",
    title: "Break porn/reels/procrastination loop",
    target: "Reduce porn, reels, smoking, dopamine escape, binge watching, and procrastination.",
    current_value: "Loop being tracked",
    deadline: "2026-12-31",
    status: "Active",
    notes: ""
  },
  {
    category: "Social Confidence",
    title: "Rebuild confident social identity",
    target: "Become calmer, more expressive, less needy, better at conversations, and more confident around people.",
    current_value: "Daily social proof required",
    deadline: "2026-12-31",
    status: "Active",
    notes: ""
  }
];
