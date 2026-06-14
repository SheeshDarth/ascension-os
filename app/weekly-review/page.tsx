"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyState, Metric, PageTitle } from "@/components/ui";
import { getLogs } from "@/lib/data";
import { buildWeeklyReview, weeklyMarkdown } from "@/lib/weekly";
import type { DailyLog } from "@/lib/types";

export default function WeeklyReviewPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getLogs().then(setLogs);
  }, []);

  const review = useMemo(() => buildWeeklyReview(logs), [logs]);
  const markdown = weeklyMarkdown(review);

  async function copyReview() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <AppShell>
      <PageTitle
        eyebrow="Brutal review"
        title="Weekly Review"
        subtitle="No reset fantasy. Only proof, patterns, and next week's non-negotiables."
      />

      {review.logs.length < 2 ? (
        <EmptyState>Not enough data. Live the week first.</EmptyState>
      ) : null}

      <Card className="mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-text">
              Week: {review.weekStart} to {review.weekEnd}
            </p>
            <p className="text-xs text-ghost">Export this to ChatGPT for a stricter external review.</p>
          </div>
          <button type="button" className="primary-button" onClick={copyReview}>
            {copied ? "Copied" : "Export Weekly Review for ChatGPT"}
          </button>
        </div>
      </Card>

      <section className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Average execution" value={review.averageExecution} />
        <Metric label="Average discipline" value={review.averageDiscipline} />
        <Metric label="Average career" value={review.averageCareer} />
        <Metric label="Average dopamine control" value={review.averageDopamine} />
        <Metric label="Average physique" value={review.averagePhysique} />
        <Metric label="Average self-respect" value={review.averageSelfRespect} />
      </section>

      <section className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Gym days" value={review.gymDays} />
        <Metric label="Diet-followed days" value={review.dietDays} />
        <Metric label="Total DSA minutes" value={review.totalDsa} />
        <Metric label="Total NIRMIQ minutes" value={review.totalNirmiq} />
        <Metric label="Total academic minutes" value={review.totalAcademic} />
        <Metric label="Total deep work minutes" value={review.totalDeepWork} />
        <Metric label="Porn relapse days" value={review.relapseDays} />
        <Metric label="Total masturbation count" value={review.totalMasturbation} />
        <Metric label="Average reels minutes" value={review.averageReels} />
        <Metric label="Smoking days" value={review.smokingDays} />
        <Metric label="Money earned" value={`Rs ${review.moneyEarned}`} />
        <Metric label="Money spent" value={`Rs ${review.moneySpent}`} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold text-text">Best Day</p>
          <p className="mt-2 text-sm text-muted">
            {review.bestDay ? `${review.bestDay.date} - ${review.bestDay.execution_score}/100` : "No best day yet."}
          </p>
          <p className="mt-4 text-sm font-semibold text-text">Biggest Win</p>
          <p className="mt-2 text-sm text-muted">{review.biggestWin}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-text">Worst Day</p>
          <p className="mt-2 text-sm text-muted">
            {review.worstDay ? `${review.worstDay.date} - ${review.worstDay.execution_score}/100` : "No worst day yet."}
          </p>
          <p className="mt-4 text-sm font-semibold text-text">Biggest Failure</p>
          <p className="mt-2 text-sm text-muted">{review.biggestFailure}</p>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-ghost">Biggest repeated distraction</p>
            <p className="mt-2 text-sm text-muted">{review.repeatedDistraction}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-ghost">Brutal pattern detected</p>
            <p className="mt-2 text-sm text-muted">{review.brutalPattern}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-ghost">Next week's 3 non-negotiables</p>
            <ul className="mt-2 grid gap-1 text-sm text-muted">
              {review.nonNegotiables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <label className="grid gap-2">
          <span className="label">Markdown export preview</span>
          <textarea className="field min-h-96 font-mono text-sm" value={markdown} readOnly />
        </label>
      </Card>
    </AppShell>
  );
}
