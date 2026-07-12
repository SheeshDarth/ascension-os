"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AscensionTierLadder, DisciplineRiskMap, HabitLoopFlow, WeeklyPulseTimeline } from "@/components/ProgressIntelligence";
import { StatusCell } from "@/components/SurfaceModules";
import { Card, EmptyState, ErrorBanner, Metric, PageTitle } from "@/components/ui";
import { buildAnalysisInputSummary } from "@/lib/analysis";
import { getAccessToken } from "@/lib/auth";
import { getAiAnalyses, getGoals, getLogs, getMemoryItems, getSettings, rateAiAnalysis, saveAiAnalysis, saveMemoryItem, saveWeeklyReview } from "@/lib/data";
import { previousWeekReviewDate } from "@/lib/daily-insights";
import { buildWeeklyReview, weeklyMarkdown } from "@/lib/weekly";
import type { AiAnalysis, AnalysisResult, DailyLog, Goal, MemoryItem, Settings } from "@/lib/types";

export default function WeeklyReviewPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [analyses, setAnalyses] = useState<AiAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AiAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [memorySaved, setMemorySaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getLogs(), getGoals(), getMemoryItems(), getSettings(), getAiAnalyses()])
      .then(([nextLogs, nextGoals, nextMemory, nextSettings, nextAnalyses]) => {
        setLogs(nextLogs);
        setGoals(nextGoals);
        setMemoryItems(nextMemory);
        setSettings(nextSettings);
        setAnalyses(nextAnalyses);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load weekly review."));
  }, []);

  const review = useMemo(() => buildWeeklyReview(logs), [logs]);
  const previousReview = useMemo(() => buildWeeklyReview(logs, previousWeekReviewDate(review)), [logs, review]);
  const markdown = weeklyMarkdown(review);
  const analysisInput = useMemo(
    () => ({
      weekStart: review.weekStart,
      weekEnd: review.weekEnd,
      logs: review.logs,
      weeklyReview: review,
      goals,
      memoryItems,
      consent: {
        allowCloudAnalysis: Boolean(settings?.ai_consent),
        provider: settings?.ai_provider ?? "deterministic"
      }
    }),
    [goals, memoryItems, review, settings]
  );
  const inputSummary = buildAnalysisInputSummary(analysisInput);

  async function copyReview() {
    setError("");
    try {
      await saveWeeklyReview(review, markdown);
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to export weekly review.");
    }
  }

  async function analyzeWeek() {
    setError("");
    setAnalysisLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/analyze/weekly", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(analysisInput)
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Unable to generate analysis.");
      }
      const result = (await response.json()) as AnalysisResult;
      const saved = await saveAiAnalysis({
        week_start: review.weekStart,
        week_end: review.weekEnd,
        provider: result.provider,
        model: result.model,
        input_summary: inputSummary,
        output_json: result
      });
      setCurrentAnalysis(saved);
      setAnalyses((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate analysis.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function rateCurrent(rating: "useful" | "not_useful") {
    if (!currentAnalysis?.id) return;
    setError("");
    try {
      const updated = await rateAiAnalysis(currentAnalysis.id, rating, correctionNote);
      setCurrentAnalysis(updated);
      setAnalyses((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to rate analysis.");
    }
  }

  async function saveReviewMemory() {
    setError("");
    try {
      await saveMemoryItem({
        source_type: "review",
        source_date: review.weekEnd,
        title: `Weekly review ${review.weekStart} to ${review.weekEnd}`,
        body: currentAnalysis?.output_json.summary ?? review.brutalPattern,
        tags_json: ["review", "identity", review.relapseDays > 0 ? "warning" : "win"]
      });
      setMemorySaved(true);
      setTimeout(() => setMemorySaved(false), 1500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save review memory.");
    }
  }

  return (
    <AppShell>
      <PageTitle
        eyebrow="Brutal review"
        title="Weekly Review"
        subtitle="No reset fantasy. Only proof, patterns, and next week's non-negotiables."
      />
      {error ? <ErrorBanner message={error} /> : null}

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

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
        <AscensionTierLadder score={review.averageExecution} />
        <WeeklyPulseTimeline review={review} />
      </div>

      <section className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["Execution delta", review.averageExecution - previousReview.averageExecution],
          ["Discipline delta", review.averageDiscipline - previousReview.averageDiscipline],
          ["Career delta", review.averageCareer - previousReview.averageCareer],
          ["Dopamine delta", review.averageDopamine - previousReview.averageDopamine],
          ["Physique delta", review.averagePhysique - previousReview.averagePhysique],
          ["Self-respect delta", review.averageSelfRespect - previousReview.averageSelfRespect]
        ].map(([label, deltaValue]) => {
          const delta = Number(deltaValue);
          return (
            <StatusCell
              key={String(label)}
              label={String(label)}
              value={`${delta >= 0 ? "+" : ""}${delta}`}
              detail="vs previous week"
              tone={delta >= 0 ? "good" : "warn"}
            />
          );
        })}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <DisciplineRiskMap review={review} />
        <HabitLoopFlow review={review} />
      </div>

      <Card className="mt-4">
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-text">AI Performance Analysis</p>
              <p className="mt-1 text-xs leading-5 text-ghost">
                Provider: {settings?.ai_provider ?? "deterministic"} · Gemini consent: {settings?.ai_consent ? "enabled" : "disabled"}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" className="primary-button" onClick={analyzeWeek} disabled={analysisLoading || review.logs.length === 0}>
                {analysisLoading ? "Analyzing..." : "Analyze Week"}
              </button>
              <button type="button" className="secondary-button" onClick={saveReviewMemory} disabled={review.logs.length === 0}>
                {memorySaved ? "Saved" : "Save Memory"}
              </button>
            </div>
          </div>

          <div className="rounded-md border border-line bg-panel2 p-3">
            <p className="text-xs font-semibold uppercase text-ghost">Data preview before analysis</p>
            <p className="mt-2 text-sm text-muted">{inputSummary}</p>
            {settings?.ai_provider === "gemini" && !settings.ai_consent ? (
              <p className="mt-2 text-xs text-amber">Gemini is selected, but cloud consent is off. Deterministic analysis will be used.</p>
            ) : null}
            {settings?.ai_provider !== "gemini" ? (
              <p className="mt-2 text-xs text-muted">Fallback status: deterministic analysis is the trusted baseline; Gemini is optional.</p>
            ) : null}
          </div>

          {currentAnalysis ? (
            <div className="grid gap-3">
              <div className="rounded-md border border-cyan/30 bg-cyan/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-cyan">
                    {currentAnalysis.provider} · {currentAnalysis.model} · {currentAnalysis.output_json.confidence} confidence
                  </p>
                  <p className="text-xs text-ghost">{currentAnalysis.created_at}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-text">{currentAnalysis.output_json.summary}</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {[
                  ["Strongest patterns", currentAnalysis.output_json.strongestPatterns],
                  ["Weakest patterns", currentAnalysis.output_json.weakestPatterns],
                  ["Risks", currentAnalysis.output_json.risks],
                  ["Next actions", currentAnalysis.output_json.nextActions]
                ].map(([title, items]) => (
                  <div key={String(title)} className="rounded-md border border-line bg-panel2 p-3">
                    <p className="text-xs font-semibold uppercase text-ghost">{String(title)}</p>
                    <ul className="mt-2 grid gap-1 text-sm text-muted">
                      {(items as string[]).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <label className="grid gap-2">
                <span className="label">Correction note</span>
                <textarea
                  className="field min-h-24"
                  value={correctionNote}
                  onChange={(event) => setCorrectionNote(event.target.value)}
                  placeholder="What did the analysis miss or get wrong?"
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" className="secondary-button" onClick={() => rateCurrent("useful")}>
                  Mark Useful
                </button>
                <button type="button" className="secondary-button" onClick={() => rateCurrent("not_useful")}>
                  Mark Not Useful
                </button>
              </div>
            </div>
          ) : analyses.length ? (
            <div className="rounded-md border border-line bg-panel2 p-3 text-sm text-muted">
              Latest saved analysis: {analyses[0].provider} · {analyses[0].week_start} to {analyses[0].week_end}
            </div>
          ) : null}
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
            <p className="text-xs font-semibold uppercase text-ghost">Next week&apos;s 3 non-negotiables</p>
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
