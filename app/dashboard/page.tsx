"use client";

import { Activity, ArrowRight, BarChart3, Brain, CalendarCheck2, Flame, Gauge, Shield, Smartphone, Sparkles, Target, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusCell } from "@/components/SurfaceModules";
import { Card, EmptyState, ErrorBanner, Metric, PageTitle } from "@/components/ui";
import { dailyMode, nextBestAction, scoreContributors } from "@/lib/daily-insights";
import { getDeviceMetricSnapshots, getLogs, getSettings } from "@/lib/data";
import { buildDailyDeviceInsight } from "@/lib/device-metrics";
import { scoreTone, statusForScore } from "@/lib/scoring";
import { buildWeeklyReview } from "@/lib/weekly";
import type { DailyLog, DeviceMetricSnapshot, Settings } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

const domains = [
  ["Gym", "gym_done", Activity],
  ["Diet", "diet_followed", Shield],
  ["DSA", "dsa_minutes", Brain],
  ["NIRMIQ", "nirmiq_minutes", Sparkles],
  ["Academics", "academic_minutes", Target],
  ["Deep Work", "deep_work_minutes", Zap],
  ["Dopamine", "dopamine_score", Flame],
  ["Sleep", "sleep_hours", Gauge],
  ["Money", "money_earned", Target],
  ["Self-Respect", "self_respect_score", Shield]
] as const;

function domainValue(log: DailyLog, key: (typeof domains)[number][1]) {
  const value = log[key];
  if (typeof value === "boolean") return value ? "Done" : "Missed";
  if (key.includes("minutes")) return `${value}m`;
  if (key === "sleep_hours") return `${value}h`;
  if (key === "money_earned") return `Rs ${value}`;
  return String(value);
}

function ScoreRing({ value }: { value: number }) {
  const score = Math.max(0, Math.min(100, value));
  return (
    <div
      className="mx-auto flex aspect-square w-full max-w-[15rem] items-center justify-center rounded-full p-3"
      style={{
        background: `conic-gradient(from 220deg, #6EE7B7 0deg, #A5F3FC ${score * 3.6}deg, rgba(29, 49, 56, 0.9) ${score * 3.6}deg 360deg)`
      }}
      role="img"
      aria-label={`Execution score ${score} out of 100`}
    >
      <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-line bg-void text-center shadow-signal">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ghost">Execution</span>
        <span className="mt-1 text-6xl font-semibold tabular-nums text-text">{score}</span>
        <span className="mt-1 text-xs text-muted">/100 today</span>
      </div>
    </div>
  );
}

function DomainBar({ label, value }: { label: string; value: number }) {
  const score = Math.max(0, Math.min(100, value));
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-text">{label}</span>
        <span className="tabular-nums text-muted">{score}</span>
      </div>
      <div className="progress-rail">
        <div className="progress-fill" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [deviceSnapshots, setDeviceSnapshots] = useState<DeviceMetricSnapshot[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getLogs(), getSettings(), getDeviceMetricSnapshots(30)])
      .then(([nextLogs, nextSettings, nextDeviceSnapshots]) => {
        setLogs(nextLogs);
        setSettings(nextSettings);
        setDeviceSnapshots(nextDeviceSnapshots);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load dashboard data."));
  }, []);

  const current = logs.find((log) => log.date === today());
  const review = useMemo(() => buildWeeklyReview(logs), [logs]);
  const mode = dailyMode(current?.execution_score ?? 0);
  const contributors = scoreContributors(current);
  const best = [...logs].sort((a, b) => b.execution_score - a.execution_score)[0];
  const deviceInsight = useMemo(
    () => buildDailyDeviceInsight(deviceSnapshots, today(), settings ?? undefined),
    [deviceSnapshots, settings]
  );
  const deviceTone = deviceInsight.hasSignal
    ? deviceInsight.readinessScore >= 75
      ? "good"
      : deviceInsight.readinessScore >= 50
        ? "warn"
        : "danger"
    : "warn";

  return (
    <AppShell>
      <PageTitle
        eyebrow="Identity cockpit"
        title="AscensionOS"
        subtitle="A private operating system for daily proof, pattern memory, and ruthless weekly upgrades."
      />
      {error ? <ErrorBanner message={error} /> : null}

      {settings && !settings.onboarding_completed ? (
        <Card className="mb-4 border-cyan/35">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="signal-chip">
                <Sparkles size={14} aria-hidden="true" />
                First run
              </span>
              <p className="mt-3 text-xl font-semibold text-text">Arm AscensionOS before the first serious check-in.</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Set your season goal, daily thresholds, and AI consent so the daily loop has context.
              </p>
            </div>
            <Link href="/onboarding" className="primary-button">
              Open setup
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </Card>
      ) : null}

      <section className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCell label="Daily state" value={mode.mode} detail={mode.detail} tone={mode.tone} />
        <StatusCell label="Best proof" value={best?.execution_score ?? "--"} detail={best?.date ?? "No logs yet"} tone="good" />
        <StatusCell label="Next action" value="1 move" detail={nextBestAction(current)} />
        <StatusCell
          label="Phone signal"
          value={deviceInsight.hasSignal ? `${deviceInsight.readinessScore}/100` : "Sync"}
          detail={deviceInsight.hasSignal ? deviceInsight.summary : "Connect Health + Usage data."}
          tone={deviceTone}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="min-h-[28rem]">
          {current ? (
            <div className="grid gap-5 sm:grid-cols-[15rem_1fr] sm:items-center">
              <ScoreRing value={current.execution_score} />
              <div>
                <span className="signal-chip">
                  <Activity size={14} aria-hidden="true" />
                  Current form
                </span>
                <p className={`mt-4 text-2xl font-semibold leading-tight ${scoreTone(current.execution_score)}`}>
                  {statusForScore(current.execution_score)}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Today&apos;s system state is built from body, career, dopamine control, discipline, and self-respect.
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Link href="/checkin" className="primary-button">
                    <CalendarCheck2 size={17} aria-hidden="true" />
                    Log proof
                  </Link>
                  <Link href="/memory-graph" className="secondary-button">
                    <BarChart3 size={17} aria-hidden="true" />
                    Memory graph
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-[15rem_1fr] sm:items-center">
              <ScoreRing value={0} />
              <div>
                <span className="signal-chip">
                  <CalendarCheck2 size={14} aria-hidden="true" />
                  Awaiting proof
                </span>
                <div className="mt-4">
                  <EmptyState>No proof logged today. Open the protocol and capture the real state.</EmptyState>
                </div>
                <Link href="/checkin" className="primary-button mt-5 w-full sm:w-auto">
                  <CalendarCheck2 size={17} aria-hidden="true" />
                  Start today&apos;s protocol
                </Link>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text">Personality Matrix</p>
              <p className="text-xs text-ghost">Five subsystems driving the day.</p>
            </div>
            <span className="signal-chip">Live</span>
          </div>
          <div className="grid gap-4">
            {[
              ["Discipline", current?.discipline_score ?? 0],
              ["Career", current?.career_score ?? 0],
              ["Dopamine", current?.dopamine_score ?? 0],
              ["Physique", current?.physique_score ?? 0],
              ["Self-Respect", current?.self_respect_score ?? 0]
            ].map(([label, value]) => (
              <DomainBar key={label} label={String(label)} value={Number(value)} />
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4 border-cyan/25">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="signal-chip">
              <Smartphone size={14} aria-hidden="true" />
              S23 intelligence
            </span>
            <p className="mt-3 text-2xl font-semibold leading-tight text-text">
              {deviceInsight.hasSignal ? `${deviceInsight.readinessScore}/100 readiness` : "Phone telemetry not synced yet"}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{deviceInsight.summary}</p>
            <p className="mt-2 text-sm font-semibold text-cyan">{deviceInsight.nextAction}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/settings/integrations" className="secondary-button px-3">
              Sync phone
            </Link>
            <Link href="/checkin" className="primary-button px-3">
              Apply
            </Link>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {deviceInsight.cards.map((card) => (
            <StatusCell key={card.label} label={card.label} value={card.value} detail={card.detail} tone={card.tone} />
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-text">Score contributors</p>
          <p className="text-xs text-ghost">Oura-style explanation layer for today&apos;s number.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {contributors.map((item) => (
            <StatusCell key={item.label} label={item.label} value={item.value} detail={item.detail} tone={item.tone} />
          ))}
        </div>
      </Card>

      <section className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {domains.map(([label, key, Icon]) => (
          <div key={label} className="micro-panel">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[0.68rem] uppercase tracking-[0.12em] text-ghost">{label}</span>
              <Icon size={15} className="text-cyan" aria-hidden="true" />
            </div>
            <div className="mt-2 text-xl font-semibold tabular-nums text-text">{current ? domainValue(current, key) : "-"}</div>
          </div>
        ))}
      </section>

      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-text">Weekly Tactical Layer</p>
            <p className="text-xs text-ghost">
              {review.weekStart} to {review.weekEnd}
            </p>
          </div>
          <Link href="/weekly-review" className="secondary-button px-3">
            <Sparkles size={16} aria-hidden="true" />
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
