"use client";

import { useEffect, useState } from "react";
import { ChevronDown, CircleAlert, Flame, History, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ModuleShell, StatusCell } from "@/components/SurfaceModules";
import { EmptyState, ErrorBanner, Metric, PageTitle } from "@/components/ui";
import { getLogs } from "@/lib/data";
import { hapticImpact } from "@/lib/haptics";
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

  const averageExecution = logs.length
    ? Math.round(logs.reduce((total, log) => total + log.execution_score, 0) / logs.length)
    : 0;
  const cleanDays = logs.filter((log) => !log.porn_relapse).length;
  const bestDay = [...logs].sort((a, b) => b.execution_score - a.execution_score)[0];

  return (
    <AppShell>
      <PageTitle
        eyebrow="Identity ledger"
        title="History"
        subtitle="A clean timeline of what actually happened."
      />
      {error ? <ErrorBanner message={error} /> : null}

      {!logs.length ? <EmptyState>No history. No identity. Start logging proof.</EmptyState> : null}

      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <StatusCell label="Logged days" value={logs.length} detail="Proof captured" />
        <StatusCell label="Average" value={averageExecution} detail="All-time execution" />
        <StatusCell label="Clean days" value={cleanDays} detail="No relapse logged" tone={cleanDays === logs.length && logs.length ? "good" : "warn"} />
        <StatusCell label="Best proof" value={bestDay?.execution_score ?? "--"} detail={bestDay?.date ?? "No logs yet"} tone="good" />
      </div>

      <div className="grid gap-3">
        {logs.map((log) => {
          const open = openDate === log.date;
          return (
            <ModuleShell key={log.date}>
              <button
                type="button"
                className="min-h-12 w-full text-left"
                onClick={() => {
                  hapticImpact(6);
                  setOpenDate(open ? undefined : log.date);
                }}
                aria-expanded={open}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-cyan/25 bg-cyan/10 text-cyan">
                      {log.execution_score >= 70 ? <ShieldCheck size={18} aria-hidden="true" /> : log.porn_relapse ? <CircleAlert size={18} aria-hidden="true" /> : <History size={18} aria-hidden="true" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text">{log.date}</p>
                      <p className="mt-1 text-sm text-muted">{statusForScore(log.execution_score)}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="signal-chip">
                          <Flame size={14} aria-hidden="true" />
                          {log.deep_work_minutes}m deep
                        </span>
                        <span className="signal-chip">{log.porn_relapse ? "Relapse" : "Clean"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className={`text-3xl font-semibold tabular-nums ${scoreTone(log.execution_score)}`}>
                      {log.execution_score}
                    </div>
                    <ChevronDown className={`text-ghost transition ${open ? "rotate-180" : ""}`} size={18} aria-hidden="true" />
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
            </ModuleShell>
          );
        })}
      </div>
    </AppShell>
  );
}
