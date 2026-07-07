"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyState, ErrorBanner, Metric, PageTitle } from "@/components/ui";
import { getLogs } from "@/lib/data";
import { scoreTone, statusForScore } from "@/lib/scoring";
import { buildWeeklyReview } from "@/lib/weekly";
import type { DailyLog } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

const domains = [
  ["Gym", "gym_done"],
  ["Diet", "diet_followed"],
  ["DSA", "dsa_minutes"],
  ["NIRMIQ", "nirmiq_minutes"],
  ["Academics", "academic_minutes"],
  ["Deep Work", "deep_work_minutes"],
  ["Dopamine Control", "dopamine_score"],
  ["Sleep", "sleep_hours"],
  ["Money", "money_earned"],
  ["Self-Respect", "self_respect_score"]
] as const;

function domainValue(log: DailyLog, key: (typeof domains)[number][1]) {
  const value = log[key];
  if (typeof value === "boolean") return value ? "Done" : "Missed";
  if (key.includes("minutes")) return `${value}m`;
  if (key === "sleep_hours") return `${value}h`;
  if (key === "money_earned") return `Rs ${value}`;
  return String(value);
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load dashboard data."));
  }, []);

  const current = logs.find((log) => log.date === today());
  const review = useMemo(() => buildWeeklyReview(logs), [logs]);

  return (
    <AppShell>
      <PageTitle
        eyebrow="Current Form: Unstable"
        title="AscensionOS"
        subtitle="Target Form: Ultimate. Ascension through execution."
      />
      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/70 to-transparent" />
          <p className="text-xs font-semibold uppercase text-ghost">Today&apos;s Execution Score</p>
          {current ? (
            <>
              <div className={`mt-3 text-6xl font-semibold tabular-nums ${scoreTone(current.execution_score)}`}>
                {current.execution_score}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{statusForScore(current.execution_score)}</p>
            </>
          ) : (
            <div className="mt-4">
              <EmptyState>No proof logged today.</EmptyState>
            </div>
          )}
          <Link href="/checkin" className="primary-button mt-5 w-full sm:w-auto">
            Log Today&apos;s Proof
          </Link>
          <Link href="/memory-graph" className="secondary-button mt-3 w-full sm:ml-2 sm:mt-5 sm:w-auto">
            View Memory Graph
          </Link>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase text-ghost">Score Stack</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ["Discipline", current?.discipline_score ?? 0],
              ["Career", current?.career_score ?? 0],
              ["Dopamine", current?.dopamine_score ?? 0],
              ["Physique", current?.physique_score ?? 0],
              ["Self-Respect", current?.self_respect_score ?? 0]
            ].map(([label, value]) => (
              <Metric key={label} label={String(label)} value={value} />
            ))}
          </div>
        </Card>
      </div>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {domains.map(([label, key]) => (
          <Metric key={label} label={label} value={current ? domainValue(current, key) : "-"} />
        ))}
      </section>

      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-text">Weekly Compact Analytics</p>
            <p className="text-xs text-ghost">
              {review.weekStart} to {review.weekEnd}
            </p>
          </div>
          <Link href="/weekly-review" className="secondary-button px-3">
            Review
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Gym days" value={review.gymDays} />
          <Metric label="DSA minutes" value={review.totalDsa} />
          <Metric label="NIRMIQ minutes" value={review.totalNirmiq} />
          <Metric label="Academic minutes" value={review.totalAcademic} />
          <Metric label="Deep work minutes" value={review.totalDeepWork} />
          <Metric label="Porn relapse days" value={review.relapseDays} />
          <Metric label="Avg reels minutes" value={review.averageReels} />
          <Metric label="Money earned" value={`Rs ${review.moneyEarned}`} />
          <Metric label="Money spent" value={`Rs ${review.moneySpent}`} />
          <Metric label="Avg execution" value={review.averageExecution} />
        </div>
      </Card>
    </AppShell>
  );
}
