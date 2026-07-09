import { AlertTriangle, ArrowUpRight, CheckCircle2, Flame, ShieldAlert, Target, Zap } from "lucide-react";
import type { DailyLog, WeeklyReview } from "@/lib/types";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const tierBands = [
  { name: "Dormant", range: "0-39", min: 0, max: 39, signal: "Identity drift" },
  { name: "Activated", range: "40-59", min: 40, max: 59, signal: "Basics online" },
  { name: "Operator", range: "60-74", min: 60, max: 74, signal: "Reliable proof" },
  { name: "Architect", range: "75-89", min: 75, max: 89, signal: "Compound gains" },
  { name: "Ascendant", range: "90-100", min: 90, max: 100, signal: "Elite control" }
];

function tierForScore(score: number) {
  return [...tierBands].reverse().find((tier) => score >= tier.min) ?? tierBands[0];
}

export function AscensionTierLadder({ score }: { score: number }) {
  const safeScore = clamp(score);
  const currentTier = tierForScore(safeScore);

  return (
    <section className="panel p-4" aria-label="Ascension tier ladder">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">Ascension Tier Ladder</p>
          <p className="mt-1 text-xs leading-5 text-ghost">Your current execution score mapped into operating tiers.</p>
        </div>
        <div className="rounded-md border border-cyan/30 bg-cyan/10 px-3 py-2 text-right">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-cyan">Current</p>
          <p className="text-sm font-semibold text-text">{currentTier.name}</p>
        </div>
      </div>

      <div className="grid gap-2">
        {[...tierBands].reverse().map((tier) => {
          const active = safeScore >= tier.min;
          const current = currentTier.name === tier.name;
          return (
            <div
              key={tier.name}
              className={`grid grid-cols-[4.5rem_1fr] items-center gap-3 rounded-md border p-3 transition ${
                current
                  ? "border-cyan/45 bg-cyan/10 shadow-signal"
                  : active
                    ? "border-emerald/25 bg-emerald/5"
                    : "border-line bg-panel2/60"
              }`}
            >
              <div className="text-xs font-semibold tabular-nums text-muted">{tier.range}</div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-text">{tier.name}</p>
                  {active ? <CheckCircle2 size={16} className="shrink-0 text-emerald" aria-hidden="true" /> : null}
                </div>
                <p className="mt-1 text-xs text-ghost">{tier.signal}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function dayName(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" });
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function WeeklyPulseTimeline({ review }: { review: WeeklyReview }) {
  const byDate = new Map(review.logs.map((log) => [log.date, log]));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(review.weekStart, index);
    const log = byDate.get(date);
    return {
      date,
      log,
      value: log?.execution_score ?? 0
    };
  });

  return (
    <section className="panel p-4" aria-label="Weekly operating timeline">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">Weekly Operating Timeline</p>
          <p className="mt-1 text-xs leading-5 text-ghost">Seven-day proof trail with gaps visible on purpose.</p>
        </div>
        <span className="signal-chip">{review.logs.length}/7 logged</span>
      </div>

      <div className="grid grid-cols-7 items-end gap-2" role="img" aria-label="Daily execution bars for the current week">
        {days.map((day) => {
          const height = Math.max(10, day.value);
          return (
            <div key={day.date} className="grid gap-2 text-center">
              <div className="flex h-32 items-end rounded-md border border-line bg-black/25 p-1">
                <div
                  className={`w-full rounded-sm ${day.log ? "bg-gradient-to-t from-emerald via-cyan to-violet" : "bg-panel2"}`}
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.log ? `${day.value}/100` : "not logged"}`}
                />
              </div>
              <div>
                <p className="text-[0.65rem] font-semibold text-muted">{dayName(day.date)}</p>
                <p className="text-[0.62rem] tabular-nums text-ghost">{day.log ? day.value : "--"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function riskRows(review: WeeklyReview) {
  const attentionLeak = Math.min(100, review.averageReels + review.relapseDays * 18 + review.smokingDays * 12);
  const depthRisk = Math.max(0, 100 - Math.min(100, Math.round(review.totalDeepWork / 6)));
  const physiqueRisk = Math.max(0, 100 - Math.round(((review.gymDays + review.dietDays) / 14) * 100));
  const financeLeak = review.moneySpent > review.moneyEarned ? 78 : review.moneySpent > review.moneyEarned * 0.5 ? 48 : 18;

  return [
    {
      label: "Dopamine leak",
      value: clamp(attentionLeak),
      detail: `${review.relapseDays} relapse days / ${review.averageReels}m avg reels`,
      icon: Flame
    },
    {
      label: "Depth deficit",
      value: clamp(depthRisk),
      detail: `${review.totalDeepWork}m deep work this week`,
      icon: Zap
    },
    {
      label: "Body drift",
      value: clamp(physiqueRisk),
      detail: `${review.gymDays} gym / ${review.dietDays} diet days`,
      icon: Target
    },
    {
      label: "Money leak",
      value: clamp(financeLeak),
      detail: `Rs ${review.moneyEarned} earned / Rs ${review.moneySpent} spent`,
      icon: ShieldAlert
    }
  ];
}

export function DisciplineRiskMap({ review }: { review: WeeklyReview }) {
  const rows = riskRows(review);
  const topRisk = [...rows].sort((a, b) => b.value - a.value)[0];

  return (
    <section className="panel p-4" aria-label="Discipline and dopamine risk map">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">Discipline / Dopamine Risk Map</p>
          <p className="mt-1 text-xs leading-5 text-ghost">Risk is derived from behavior, not vibes.</p>
        </div>
        <div className="rounded-md border border-amber/30 bg-amber/10 px-3 py-2 text-right">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-amber">Watch</p>
          <p className="text-sm font-semibold text-text">{topRisk?.label ?? "No data"}</p>
        </div>
      </div>

      <div className="grid gap-3">
        {rows.map((row) => {
          const Icon = row.icon;
          const severe = row.value >= 70;
          return (
            <div key={row.label} className="rounded-md border border-line bg-panel2/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${severe ? "border-red-400/35 bg-red-400/10 text-red-200" : "border-cyan/25 bg-cyan/10 text-cyan"}`}>
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{row.label}</p>
                    <p className="mt-1 text-xs text-ghost">{row.detail}</p>
                  </div>
                </div>
                <p className="text-lg font-semibold tabular-nums text-text">{row.value}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40" aria-hidden="true">
                <div className={severe ? "h-full rounded-full bg-red-300" : "h-full rounded-full bg-gradient-to-r from-emerald to-cyan"} style={{ width: `${row.value}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function HabitLoopFlow({ review }: { review: WeeklyReview }) {
  const items = [
    { label: "Trigger", value: review.repeatedDistraction, icon: AlertTriangle },
    { label: "Response", value: review.brutalPattern, icon: ArrowUpRight },
    { label: "Protocol", value: review.nonNegotiables[0] ?? "Log proof daily", icon: Target },
    { label: "Upgrade", value: review.nonNegotiables[1] ?? "Protect deep work", icon: CheckCircle2 }
  ];

  return (
    <section className="panel p-4" aria-label="Habit loop flow">
      <div className="mb-4">
        <p className="text-sm font-semibold text-text">Habit Loop Flow</p>
        <p className="mt-1 text-xs leading-5 text-ghost">Turn repeated failure signals into next-week operating rules.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="relative rounded-md border border-line bg-panel2/70 p-3">
              <div className="mb-3 flex items-center justify-between">
                <Icon size={17} className="text-cyan" aria-hidden="true" />
                <span className="text-[0.65rem] font-semibold tabular-nums text-ghost">0{index + 1}</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.label}</p>
              <p className="mt-2 text-sm leading-5 text-text">{item.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PatternSnapshot({ logs }: { logs: DailyLog[] }) {
  const latest = [...logs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const best = [...logs].sort((a, b) => b.execution_score - a.execution_score)[0];
  const worst = [...logs].sort((a, b) => a.execution_score - b.execution_score)[0];

  return (
    <section className="grid gap-2 sm:grid-cols-3" aria-label="Pattern snapshot">
      {[
        ["Latest signal", latest ? `${latest.execution_score}/100` : "--", latest?.date ?? "No logs yet"],
        ["Best proof", best ? `${best.execution_score}/100` : "--", best?.date ?? "No logs yet"],
        ["Lowest leak", worst ? `${worst.execution_score}/100` : "--", worst?.date ?? "No logs yet"]
      ].map(([label, value, detail]) => (
        <div key={label} className="micro-panel">
          <p className="text-[0.68rem] uppercase tracking-[0.12em] text-ghost">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-text">{value}</p>
          <p className="mt-1 text-xs text-muted">{detail}</p>
        </div>
      ))}
    </section>
  );
}
