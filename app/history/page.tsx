"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyState, ErrorBanner, Metric, PageTitle } from "@/components/ui";
import { getLogs } from "@/lib/data";
import { scoreTone, statusForScore } from "@/lib/scoring";
import type { DailyLog } from "@/lib/types";

export default function HistoryPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [openDate, setOpenDate] = useState<string | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load history."));
  }, []);

  return (
    <AppShell>
      <PageTitle
        eyebrow="Identity ledger"
        title="History"
        subtitle="A clean timeline of what actually happened."
      />
      {error ? <ErrorBanner message={error} /> : null}

      {!logs.length ? <EmptyState>No history. No identity. Start logging proof.</EmptyState> : null}

      <div className="grid gap-3">
        {logs.map((log) => {
          const open = openDate === log.date;
          return (
            <Card key={log.date}>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setOpenDate(open ? undefined : log.date)}
                aria-expanded={open}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text">{log.date}</p>
                    <p className="mt-1 text-sm text-muted">{statusForScore(log.execution_score)}</p>
                  </div>
                  <div className={`text-3xl font-semibold tabular-nums ${scoreTone(log.execution_score)}`}>
                    {log.execution_score}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  <Metric label="Gym" value={log.gym_done ? "Yes" : "No"} />
                  <Metric label="DSA" value={`${log.dsa_minutes}m`} />
                  <Metric label="NIRMIQ" value={`${log.nirmiq_minutes}m`} />
                  <Metric label="Porn relapse" value={log.porn_relapse ? "Yes" : "No"} />
                  <Metric label="Reels" value={`${log.reels_minutes}m`} />
                  <Metric label="Self-respect" value={log.self_respect_score} />
                </div>
              </button>

              {open ? (
                <div className="mt-4 border-t border-line pt-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric label="Discipline" value={log.discipline_score} />
                    <Metric label="Career" value={log.career_score} />
                    <Metric label="Dopamine" value={log.dopamine_score} />
                    <Metric label="Physique" value={log.physique_score} />
                    <Metric label="Academic minutes" value={log.academic_minutes} />
                    <Metric label="Deep work minutes" value={log.deep_work_minutes} />
                    <Metric label="Money earned" value={`Rs ${log.money_earned}`} />
                    <Metric label="Money spent" value={`Rs ${log.money_spent}`} />
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-muted">
                    <p>
                      <span className="font-semibold text-text">Hardest task:</span> {log.hardest_task_done || "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-text">Biggest distraction:</span> {log.biggest_distraction || "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-text">Notes:</span> {log.notes || "-"}
                    </p>
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
