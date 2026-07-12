import type { DailyLog, WeeklyReview } from "@/lib/types";

export type DailyMode = "Attack" | "Maintain" | "Recover";

export function dailyMode(score: number): { mode: DailyMode; detail: string; tone: "good" | "warn" | "danger" } {
  if (score >= 75) return { mode: "Attack", detail: "High proof state. Push the hardest meaningful block.", tone: "good" };
  if (score >= 55) return { mode: "Maintain", detail: "Stable state. Protect basics and avoid dopamine leaks.", tone: "warn" };
  return { mode: "Recover", detail: "Low proof state. Shrink the day to sleep, body, and one honest task.", tone: "danger" };
}

export function scoreContributors(log?: DailyLog) {
  if (!log) {
    return [
      { label: "Daily proof", value: "Missing", detail: "Log today to unlock contributors.", tone: "warn" as const },
      { label: "Next action", value: "Start", detail: "Open the daily protocol.", tone: "good" as const }
    ];
  }

  return [
    {
      label: "Sleep",
      value: `${log.sleep_hours || 0}h`,
      detail: log.sleep_hours >= 7 ? "Recovery base is online." : "Recovery is the first bottleneck.",
      tone: log.sleep_hours >= 7 ? ("good" as const) : ("warn" as const)
    },
    {
      label: "Deep work",
      value: `${log.deep_work_minutes}m`,
      detail: log.deep_work_minutes >= 60 ? "Depth protected the day." : "Depth is still under the useful threshold.",
      tone: log.deep_work_minutes >= 60 ? ("good" as const) : ("warn" as const)
    },
    {
      label: "Dopamine",
      value: log.porn_relapse ? "Leak" : `${log.reels_minutes}m reels`,
      detail: log.porn_relapse ? "Relapse dominated the signal." : log.reels_minutes > 30 ? "Short-form is leaking attention." : "Dopamine boundary held.",
      tone: log.porn_relapse || log.reels_minutes > 30 ? ("danger" as const) : ("good" as const)
    },
    {
      label: "Body basics",
      value: log.gym_done || log.diet_followed ? "Partial" : "Missing",
      detail: log.gym_done && log.diet_followed ? "Training and food aligned." : "Body proof needs a cleaner lock.",
      tone: log.gym_done && log.diet_followed ? ("good" as const) : ("warn" as const)
    },
    {
      label: "Money discipline",
      value: `Rs ${log.money_earned - log.money_spent}`,
      detail: log.money_earned >= log.money_spent ? "Net money signal is controlled." : "Spending exceeded earning.",
      tone: log.money_earned >= log.money_spent ? ("good" as const) : ("warn" as const)
    }
  ];
}

export function nextBestAction(log?: DailyLog) {
  if (!log) return "Log today before the day becomes a story.";
  if (log.porn_relapse || log.reels_minutes > 30) return "Protect the next 24 hours from dopamine escape.";
  if (log.deep_work_minutes < 60) return "Schedule one 60-minute deep work block tomorrow.";
  if (!log.gym_done && !log.diet_followed) return "Lock one body basic tomorrow: gym or diet.";
  if (!log.hardest_task_done) return "Name the hardest task before sleep.";
  return "Repeat the strongest proof tomorrow and raise one weak domain.";
}

export function yesterdayDelta(todayLog?: DailyLog, yesterdayLog?: DailyLog) {
  if (!todayLog || !yesterdayLog) return null;
  return todayLog.execution_score - yesterdayLog.execution_score;
}

export function previousWeekReviewDate(review: WeeklyReview) {
  const date = new Date(`${review.weekStart}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date;
}

export function repeatedDistractions(logs: DailyLog[], limit = 3) {
  const counts = new Map<string, number>();
  logs
    .map((log) => log.biggest_distraction.trim())
    .filter(Boolean)
    .forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

export function winLeakPatterns(logs: DailyLog[]) {
  const wins = logs.filter((log) => log.execution_score >= 70);
  const leaks = logs.filter((log) => log.execution_score < 50);
  const winDeepWork = wins.length ? Math.round(wins.reduce((total, log) => total + log.deep_work_minutes, 0) / wins.length) : 0;
  const leakReels = leaks.length ? Math.round(leaks.reduce((total, log) => total + log.reels_minutes, 0) / leaks.length) : 0;
  return {
    win: wins.length ? `You usually win when deep work reaches about ${winDeepWork}m.` : "Win pattern needs more high-score days.",
    leak: leaks.length ? `You usually leak when reels average around ${leakReels}m or proof is sparse.` : "Leak pattern needs more low-score days."
  };
}
