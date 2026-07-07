import type { DailyLog, WeeklyReview } from "./types";

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export function getWeekRange(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    weekStart: start.toISOString().slice(0, 10),
    weekEnd: end.toISOString().slice(0, 10)
  };
}

function mode(values: string[]) {
  const clean = values.map((value) => value.trim()).filter(Boolean);
  if (!clean.length) return "No repeated distraction logged.";
  const counts = new Map<string, number>();
  clean.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function buildWeeklyReview(allLogs: DailyLog[], date = new Date()): WeeklyReview {
  const { weekStart, weekEnd } = getWeekRange(date);
  const logs = allLogs
    .filter((log) => log.date >= weekStart && log.date <= weekEnd)
    .sort((a, b) => a.date.localeCompare(b.date));

  const bestDay = [...logs].sort((a, b) => b.execution_score - a.execution_score)[0];
  const worstDay = [...logs].sort((a, b) => a.execution_score - b.execution_score)[0];
  const repeatedDistraction = mode(logs.map((log) => log.biggest_distraction));
  const relapseDays = logs.filter((log) => log.porn_relapse).length;
  const averageReels = average(logs.map((log) => log.reels_minutes));
  const smokingDays = logs.filter((log) => log.smoking).length;

  const brutalPattern =
    relapseDays > 0
      ? "Dopamine escape is still stealing identity."
      : averageReels > 30
        ? "Short-form content is leaking attention."
        : average(logs.map((log) => log.deep_work_minutes)) < 60
          ? "Execution exists, but depth is still weak."
          : "The pattern is improving. Keep pressure on the basics.";

  return {
    weekStart,
    weekEnd,
    logs,
    averageExecution: average(logs.map((log) => log.execution_score)),
    averageDiscipline: average(logs.map((log) => log.discipline_score)),
    averageCareer: average(logs.map((log) => log.career_score)),
    averageDopamine: average(logs.map((log) => log.dopamine_score)),
    averagePhysique: average(logs.map((log) => log.physique_score)),
    averageSelfRespect: average(logs.map((log) => log.self_respect_score)),
    gymDays: logs.filter((log) => log.gym_done).length,
    dietDays: logs.filter((log) => log.diet_followed).length,
    totalDsa: sum(logs.map((log) => log.dsa_minutes)),
    totalNirmiq: sum(logs.map((log) => log.nirmiq_minutes)),
    totalAcademic: sum(logs.map((log) => log.academic_minutes)),
    totalDeepWork: sum(logs.map((log) => log.deep_work_minutes)),
    relapseDays,
    totalMasturbation: sum(logs.map((log) => log.masturbation_count)),
    averageReels,
    smokingDays,
    moneyEarned: sum(logs.map((log) => log.money_earned)),
    moneySpent: sum(logs.map((log) => log.money_spent)),
    bestDay,
    worstDay,
    repeatedDistraction,
    biggestWin: bestDay?.hardest_task_done || "No biggest win logged.",
    biggestFailure: worstDay?.biggest_distraction || "No biggest failure logged.",
    brutalPattern,
    nonNegotiables: ["Log proof daily", "Hit DSA and NIRMIQ targets", "Protect dopamine before motivation"]
  };
}

export function weeklyMarkdown(review: WeeklyReview) {
  return `# AscensionOS Weekly Review

Week: ${review.weekStart} to ${review.weekEnd}

## Scores

Execution: ${review.averageExecution}
Discipline: ${review.averageDiscipline}
Career: ${review.averageCareer}
Dopamine Control: ${review.averageDopamine}
Physique: ${review.averagePhysique}
Self-Respect: ${review.averageSelfRespect}

## Totals

Gym days: ${review.gymDays}
Diet-followed days: ${review.dietDays}
DSA minutes: ${review.totalDsa}
NIRMIQ minutes: ${review.totalNirmiq}
Academic minutes: ${review.totalAcademic}
Deep work minutes: ${review.totalDeepWork}
Porn relapse days: ${review.relapseDays}
Masturbation count: ${review.totalMasturbation}
Average reels minutes: ${review.averageReels}
Smoking days: ${review.smokingDays}
Money earned: ${review.moneyEarned}
Money spent: ${review.moneySpent}

## Best Day

${review.bestDay ? `${review.bestDay.date} - ${review.bestDay.execution_score}/100` : "No data."}

## Worst Day

${review.worstDay ? `${review.worstDay.date} - ${review.worstDay.execution_score}/100` : "No data."}

## Wins

${review.biggestWin}

## Failures

${review.biggestFailure}

## Biggest Distraction

${review.repeatedDistraction}

## Where I Lied To Myself


## What I Avoided


## Brutal Pattern Detected

${review.brutalPattern}

## Next Week Commitments

${review.nonNegotiables.map((item) => `- ${item}`).join("\n")}

## What I Need From ChatGPT

Brutal review / plan adjustment / discipline reset
`;
}
