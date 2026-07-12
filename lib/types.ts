export type DailyLog = {
  id?: string;
  user_id?: string;
  date: string;
  score_formula_version: number;
  wake_time: string;
  sleep_time: string;
  sleep_hours: number;
  gym_done: boolean;
  workout_quality: number;
  diet_followed: boolean;
  protein_grams: number;
  water_litres: number;
  weight_kg: number;
  steps: number;
  dsa_minutes: number;
  nirmiq_minutes: number;
  academic_minutes: number;
  deep_work_minutes: number;
  porn_relapse: boolean;
  masturbation_count: number;
  reels_minutes: number;
  youtube_minutes: number;
  smoking: boolean;
  money_earned: number;
  money_spent: number;
  grooming_done: boolean;
  skincare_done: boolean;
  social_action: string;
  hardest_task_done: string;
  biggest_distraction: string;
  mood: number;
  self_respect: number;
  notes: string;
  execution_score: number;
  discipline_score: number;
  career_score: number;
  dopamine_score: number;
  physique_score: number;
  self_respect_score: number;
  created_at?: string;
  updated_at?: string;
};

export type Goal = {
  id?: string;
  user_id?: string;
  category: string;
  title: string;
  target: string;
  current_value: string;
  deadline: string;
  status: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
};

export type Settings = {
  id?: string;
  user_id?: string;
  user_name: string;
  target_weight: number;
  dsa_daily_target: number;
  nirmiq_daily_target: number;
  academic_daily_target: number;
  reels_limit: number;
  sleep_target: string;
  ai_provider: AnalysisProviderId;
  ai_consent: boolean;
  onboarding_completed: boolean;
};

export type WeeklyReviewRow = {
  id?: string;
  user_id?: string;
  week_start: string;
  week_end: string;
  markdown_export: string;
  created_at?: string;
};

export type WeeklyReview = {
  weekStart: string;
  weekEnd: string;
  logs: DailyLog[];
  averageExecution: number;
  averageDiscipline: number;
  averageCareer: number;
  averageDopamine: number;
  averagePhysique: number;
  averageSelfRespect: number;
  gymDays: number;
  dietDays: number;
  totalDsa: number;
  totalNirmiq: number;
  totalAcademic: number;
  totalDeepWork: number;
  relapseDays: number;
  totalMasturbation: number;
  averageReels: number;
  smokingDays: number;
  moneyEarned: number;
  moneySpent: number;
  bestDay?: DailyLog;
  worstDay?: DailyLog;
  repeatedDistraction: string;
  biggestWin: string;
  biggestFailure: string;
  brutalPattern: string;
  nonNegotiables: string[];
};

export type AnalysisProviderId = "off" | "deterministic" | "gemini";

export type MemoryItem = {
  id?: string;
  user_id?: string;
  source_type: "log" | "review" | "note" | "goal" | "analysis";
  source_date?: string | null;
  title: string;
  body: string;
  tags_json: string[];
  created_at?: string;
  updated_at?: string;
};

export type AnalysisInput = {
  weekStart: string;
  weekEnd: string;
  logs: DailyLog[];
  weeklyReview: WeeklyReview;
  goals: Goal[];
  memoryItems: MemoryItem[];
  consent: {
    allowCloudAnalysis: boolean;
    provider: AnalysisProviderId;
  };
};

export type AnalysisResult = {
  summary: string;
  strongestPatterns: string[];
  weakestPatterns: string[];
  risks: string[];
  nextActions: string[];
  confidence: "low" | "medium" | "high";
  sourceDates: string[];
  sourceMetrics: string[];
  provider: AnalysisProviderId;
  model: string;
  caveats: string[];
};

export type AiAnalysis = {
  id?: string;
  user_id?: string;
  week_start: string;
  week_end: string;
  provider: AnalysisProviderId;
  model: string;
  input_summary: string;
  output_json: AnalysisResult;
  rating?: "useful" | "not_useful" | null;
  correction_note?: string | null;
  created_at?: string;
};
