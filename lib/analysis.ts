import type { AnalysisInput, AnalysisProviderId, AnalysisResult, DailyLog, WeeklyReview } from "./types";

export type AnalysisProvider = {
  id: AnalysisProviderId;
  analyzeWeekly(input: AnalysisInput): Promise<AnalysisResult>;
};

const requiredArrayFields = ["strongestPatterns", "weakestPatterns", "risks", "nextActions", "sourceDates", "sourceMetrics", "caveats"] as const;

function topBy<T>(items: T[], score: (item: T) => number) {
  return [...items].sort((a, b) => score(b) - score(a))[0];
}

function weakestScore(review: WeeklyReview) {
  const domains = [
    ["Execution", review.averageExecution],
    ["Discipline", review.averageDiscipline],
    ["Career", review.averageCareer],
    ["Dopamine Control", review.averageDopamine],
    ["Physique", review.averagePhysique],
    ["Self-Respect", review.averageSelfRespect]
  ] as const;
  return [...domains].sort((a, b) => a[1] - b[1])[0];
}

function confidenceFor(logs: DailyLog[]) {
  if (logs.length >= 5) return "high";
  if (logs.length >= 2) return "medium";
  return "low";
}

export function buildAnalysisInputSummary(input: AnalysisInput) {
  const review = input.weeklyReview;
  return [
    `Week ${input.weekStart} to ${input.weekEnd}`,
    `${input.logs.length} logs`,
    `Avg execution ${review.averageExecution}`,
    `Avg discipline ${review.averageDiscipline}`,
    `Avg career ${review.averageCareer}`,
    `Avg dopamine ${review.averageDopamine}`,
    `Avg physique ${review.averagePhysique}`,
    `Relapse days ${review.relapseDays}`,
    `Biggest distraction ${review.repeatedDistraction}`
  ].join(" | ");
}

export function buildCompactAnalysisInput(input: AnalysisInput) {
  const review = input.weeklyReview;
  return {
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    sourceDates: input.logs.map((log) => log.date),
    metrics: {
      logs: input.logs.length,
      averageExecution: review.averageExecution,
      averageDiscipline: review.averageDiscipline,
      averageCareer: review.averageCareer,
      averageDopamine: review.averageDopamine,
      averagePhysique: review.averagePhysique,
      averageSelfRespect: review.averageSelfRespect,
      gymDays: review.gymDays,
      dietDays: review.dietDays,
      totalDsa: review.totalDsa,
      totalNirmiq: review.totalNirmiq,
      totalAcademic: review.totalAcademic,
      totalDeepWork: review.totalDeepWork,
      relapseDays: review.relapseDays,
      averageReels: review.averageReels,
      smokingDays: review.smokingDays,
      moneyEarned: review.moneyEarned,
      moneySpent: review.moneySpent
    },
    bestDay: review.bestDay
      ? {
          date: review.bestDay.date,
          executionScore: review.bestDay.execution_score,
          hardestTask: review.bestDay.hardest_task_done
        }
      : null,
    worstDay: review.worstDay
      ? {
          date: review.worstDay.date,
          executionScore: review.worstDay.execution_score,
          biggestDistraction: review.worstDay.biggest_distraction
        }
      : null,
    patterns: {
      repeatedDistraction: review.repeatedDistraction,
      biggestWin: review.biggestWin,
      biggestFailure: review.biggestFailure,
      brutalPattern: review.brutalPattern,
      nonNegotiables: review.nonNegotiables
    },
    goals: input.goals.map((goal) => ({
      category: goal.category,
      title: goal.title,
      target: goal.target,
      currentValue: goal.current_value,
      deadline: goal.deadline,
      status: goal.status
    })),
    memoryItems: input.memoryItems.slice(0, 10).map((item) => ({
      sourceType: item.source_type,
      sourceDate: item.source_date,
      title: item.title,
      tags: item.tags_json
    }))
  };
}

export function deterministicWeeklyAnalysis(input: AnalysisInput, caveats: string[] = []): AnalysisResult {
  const review = input.weeklyReview;
  const best = topBy(input.logs, (log) => log.execution_score);
  const worst = topBy(input.logs, (log) => -log.execution_score);
  const weakest = weakestScore(review);
  const sourceDates = input.logs.map((log) => log.date);
  const lowDataCaveat = input.logs.length < 3 ? ["Low confidence: fewer than 3 daily logs were available."] : [];

  return {
    summary:
      input.logs.length === 0
        ? "No proof was logged for this week, so the analysis can only identify that the execution loop is missing data."
        : `This week averaged ${review.averageExecution}/100 execution. The strongest visible proof came from ${best?.date ?? "no day"}, while the weakest pressure point is ${weakest[0]} at ${weakest[1]}/100.`,
    strongestPatterns: [
      review.gymDays > 0 ? `${review.gymDays} gym day(s) were logged.` : "The logging system captured the absence of gym proof.",
      review.totalDsa + review.totalNirmiq > 0
        ? `${review.totalDsa + review.totalNirmiq} minutes went into DSA and NIRMIQ combined.`
        : "Career execution had no logged DSA/NIRMIQ minutes.",
      best?.hardest_task_done ? `Best proof: ${best.hardest_task_done}.` : "Hardest-task proof is not yet consistently captured."
    ],
    weakestPatterns: [
      `${weakest[0]} is the weakest score domain.`,
      review.repeatedDistraction,
      worst ? `Worst day was ${worst.date} at ${worst.execution_score}/100 execution.` : "No worst day can be identified yet."
    ],
    risks: [
      review.relapseDays > 0 ? "Dopamine escape is actively weakening the week." : "Dopamine control looks stable from available logs.",
      review.averageReels > 30 ? "Reels/shorts exceeded the limit and may be leaking attention." : "Short-form content stayed within the target on average.",
      input.logs.length < 5 ? "Sparse logging can hide the real pattern." : "Pattern quality is strong enough for weekly review."
    ],
    nextActions: [
      weakest[0] === "Career" ? "Protect one 60-minute NIRMIQ or DSA block tomorrow." : `Attack ${weakest[0]} first tomorrow.`,
      "Log the hardest task before sleep so the proof trail stays honest.",
      review.averageReels > 30 ? "Set a hard 30-minute reels cap for the next 24 hours." : "Repeat the current dopamine boundary tomorrow."
    ],
    confidence: confidenceFor(input.logs),
    sourceDates,
    sourceMetrics: [
      `average_execution=${review.averageExecution}`,
      `average_discipline=${review.averageDiscipline}`,
      `average_career=${review.averageCareer}`,
      `average_dopamine=${review.averageDopamine}`,
      `average_physique=${review.averagePhysique}`,
      `relapse_days=${review.relapseDays}`,
      `average_reels=${review.averageReels}`
    ],
    provider: "deterministic",
    model: "rules-v1",
    caveats: [...lowDataCaveat, ...caveats]
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isProvider(value: unknown): value is AnalysisProviderId {
  return value === "off" || value === "deterministic" || value === "gemini";
}

export function parseAnalysisResult(value: unknown, fallbackProvider: AnalysisProviderId = "gemini"): AnalysisResult {
  if (!value || typeof value !== "object") throw new Error("Analysis output must be an object.");
  const record = value as Record<string, unknown>;
  for (const field of requiredArrayFields) {
    if (!isStringArray(record[field])) throw new Error(`Analysis output missing string array: ${field}.`);
  }
  if (typeof record.summary !== "string" || record.summary.trim().length === 0) throw new Error("Analysis output missing summary.");
  if (!["low", "medium", "high"].includes(String(record.confidence))) throw new Error("Analysis output has invalid confidence.");
  if (typeof record.model !== "string" || record.model.trim().length === 0) throw new Error("Analysis output missing model.");
  if (record.provider !== undefined && !isProvider(record.provider)) throw new Error("Analysis output has invalid provider.");
  const strongestPatterns = record.strongestPatterns as string[];
  const weakestPatterns = record.weakestPatterns as string[];
  const risks = record.risks as string[];
  const nextActions = record.nextActions as string[];
  const sourceDates = record.sourceDates as string[];
  const sourceMetrics = record.sourceMetrics as string[];
  const caveats = record.caveats as string[];

  return {
    summary: record.summary,
    strongestPatterns,
    weakestPatterns,
    risks,
    nextActions,
    confidence: record.confidence as "low" | "medium" | "high",
    sourceDates,
    sourceMetrics,
    provider: (record.provider as AnalysisProviderId) || fallbackProvider,
    model: record.model,
    caveats
  };
}

export const deterministicProvider: AnalysisProvider = {
  id: "deterministic",
  async analyzeWeekly(input) {
    return deterministicWeeklyAnalysis(input);
  }
};
