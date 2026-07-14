"use client";

import { FormEvent, useEffect, useState } from "react";
import { Activity, Brain, CalendarDays, Droplets, Dumbbell, Flame, Moon, RefreshCw, Shield, Smartphone, Sparkles, Wallet, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyState, ErrorBanner, PageTitle } from "@/components/ui";
import { numberFields, textFields, toggleFields } from "@/lib/checkin-fields";
import { getDeviceMetricSnapshots, getLogByDate, saveDeviceMetricSnapshot, saveLog } from "@/lib/data";
import { yesterdayDelta } from "@/lib/daily-insights";
import { applyDeviceMetricsToLog, formatImportedMetric, metricsForDate, snapshotSourceLabel } from "@/lib/device-metrics";
import { normalizeNumber, normalizeText } from "@/lib/form";
import { hapticImpact } from "@/lib/haptics";
import { readNativeDailyMetrics } from "@/lib/native-bridge";
import { calculateScores, emptyLog } from "@/lib/scoring";
import type { DailyLog, DeviceMetricSnapshot } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const draftKey = "ascensionos.checkin_draft.v1";

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

type Key = keyof DailyLog;

const scoreDomains = [
  ["Discipline", "discipline_score", Shield],
  ["Career", "career_score", Brain],
  ["Dopamine", "dopamine_score", Flame],
  ["Physique", "physique_score", Dumbbell],
  ["Self-respect", "self_respect_score", Sparkles]
] as const;

const numberSections = [
  {
    title: "Body Engine",
    detail: "Sleep, physique, fuel, and movement.",
    icon: Dumbbell,
    keys: ["sleep_hours", "workout_quality", "protein_grams", "water_litres", "weight_kg", "steps"]
  },
  {
    title: "Deep Work Core",
    detail: "Career, study, and momentum blocks.",
    icon: Brain,
    keys: ["dsa_minutes", "nirmiq_minutes", "academic_minutes", "deep_work_minutes"]
  },
  {
    title: "Dopamine Firewall",
    detail: "Leak detection and attention defense.",
    icon: Flame,
    keys: ["masturbation_count", "reels_minutes", "youtube_minutes"]
  },
  {
    title: "Reality Ledger",
    detail: "Money, mood, and self-respect state.",
    icon: Wallet,
    keys: ["money_earned", "money_spent", "mood", "self_respect"]
  }
] as const;

const fieldByKey = new Map(numberFields.map((field) => [field[0], field]));
const textFieldByKey = new Map(textFields.map((field) => [field[0], field]));

function Toggle({
  label,
  fieldKey,
  value,
  onChange
}: {
  label: string;
  fieldKey: Key;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const negative = fieldKey === "porn_relapse" || fieldKey === "smoking";
  const activeClass = negative ? "border-red-400/40 bg-red-400/10 text-red-200" : "border-emerald/40 bg-emerald/12 text-emerald shadow-signal";
  const status = negative ? (value ? "Yes" : "No") : value ? "Done" : "Open";
  return (
    <button
      type="button"
      onClick={() => {
        hapticImpact(value ? 6 : 10);
        onChange(!value);
      }}
      className={`flex min-h-14 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
        value ? activeClass : "border-line bg-panel2/75 text-muted active:bg-panel"
      }`}
      aria-pressed={value}
    >
      <span>{label}</span>
      <span className="rounded-md border border-current/20 px-2 py-1 text-xs">{status}</span>
    </button>
  );
}

function ScoreRing({ value }: { value: number }) {
  const score = Math.max(0, Math.min(100, value));
  return (
    <div
      className="flex aspect-square w-32 shrink-0 items-center justify-center rounded-full p-2"
      style={{
        background: `conic-gradient(#6EE7B7 0deg, #A5F3FC ${score * 3.6}deg, rgba(29, 49, 56, 0.88) ${score * 3.6}deg 360deg)`
      }}
      aria-label={`Live execution score ${score}`}
      role="img"
    >
      <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-line bg-void">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-ghost">Score</span>
        <span className="text-4xl font-semibold tabular-nums text-cyan">{score}</span>
      </div>
    </div>
  );
}

function NumberInput({ field, log, set }: { field: [Key, string, number?, number?]; log: DailyLog; set: <T extends Key>(key: T, value: DailyLog[T]) => void }) {
  const [key, label, min, max] = field;
  return (
    <label className="grid gap-2">
      <span className="label">{label}</span>
      <input
        className="field"
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        value={Number(log[key])}
        onChange={(e) => set(key, normalizeNumber(e.target.value) as never)}
      />
    </label>
  );
}

export default function CheckinPage() {
  const router = useRouter();
  const [log, setLog] = useState<DailyLog>(emptyLog(today()));
  const [yesterday, setYesterday] = useState<DailyLog | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [phoneSnapshot, setPhoneSnapshot] = useState<DeviceMetricSnapshot[]>([]);
  const [phoneSyncing, setPhoneSyncing] = useState(false);

  useEffect(() => {
    Promise.all([getLogByDate(today()), getLogByDate(addDays(today(), -1))])
      .then(([existing, prior]) => {
        setYesterday(prior);
        if (existing) {
          setLog(existing);
        } else {
          const rawDraft = window.localStorage.getItem(draftKey);
          if (rawDraft) {
            const draft = JSON.parse(rawDraft) as DailyLog;
            if (draft.date === today()) setLog(draft);
          }
        }
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load today's log."))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(draftKey, JSON.stringify(log));
  }, [loaded, log]);

  useEffect(() => {
    if (!loaded) return;
    getDeviceMetricSnapshots(7).then(setPhoneSnapshot).catch(() => undefined);
  }, [loaded]);

  const set = <T extends Key>(key: T, value: DailyLog[T]) => setLog((current) => ({ ...current, [key]: value }));
  const preview = calculateScores(log);
  const delta = yesterdayDelta(preview, yesterday);
  const todayPhoneSnapshots = metricsForDate(phoneSnapshot, log.date);

  async function syncPhoneMetrics() {
    hapticImpact(8);
    setPhoneSyncing(true);
    setError("");
    setSaved("");
    try {
      const result = await readNativeDailyMetrics(log.date);
      for (const snapshot of result.snapshots ?? []) await saveDeviceMetricSnapshot(snapshot);
      const merged = applyDeviceMetricsToLog(log, result.snapshots ?? []);
      setLog(merged.log);
      setPhoneSnapshot((current) => [
        ...(result.snapshots ?? []),
        ...current.filter((currentSnapshot) => !result.snapshots?.some((next) => next.source === currentSnapshot.source && next.metric_date === currentSnapshot.metric_date))
      ]);
      setSaved(
        merged.importedFields.length
          ? `Imported ${merged.importedFields.length} blank field${merged.importedFields.length === 1 ? "" : "s"}. Review and save proof.`
          : "Phone signal captured. Your existing manual values were preserved."
      );
      if (result.warnings?.length) setError(result.warnings.join(" "));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Install the Android APK and grant phone permissions before syncing.");
    } finally {
      setPhoneSyncing(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await saveLog(log);
      window.localStorage.removeItem(draftKey);
      hapticImpact(16);
      setSaved("Proof logged.");
      setTimeout(() => router.push("/dashboard"), 450);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save proof.");
    }
  }

  return (
    <AppShell>
      <PageTitle
        eyebrow="Daily protocol"
        title="Log Today's Proof"
        subtitle="Fast capture for the real state: body, work, dopamine, money, and self-respect."
      />
      {error ? <ErrorBanner message={error} /> : null}

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-4">
          <Card className="min-h-[15rem]">
            <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <ScoreRing value={preview.execution_score} />
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="signal-chip">
                    <CalendarDays size={14} aria-hidden="true" />
                    {log.date}
                  </span>
                  <span className="signal-chip">
                    <Moon size={14} aria-hidden="true" />
                    {log.sleep_hours || 0}h sleep
                  </span>
                  <span className="signal-chip">
                    <Zap size={14} aria-hidden="true" />
                    {log.deep_work_minutes || 0}m deep work
                  </span>
                  <span className="signal-chip">
                    {delta === null ? "No yesterday" : `${delta >= 0 ? "+" : ""}${delta} vs yesterday`}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-semibold leading-tight text-text">Capture proof before memory edits the day.</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Draft autosaves on this device. Every input feeds the memory graph and weekly analysis.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-cyan/30 bg-cyan/10 text-cyan">
                  <Smartphone size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">Phone telemetry</p>
                  <p className="mt-1 text-xs leading-5 text-ghost">S23 Health Connect and Usage Access. Blank fields only.</p>
                </div>
              </div>
              <button type="button" className="secondary-button shrink-0" onClick={syncPhoneMetrics} disabled={phoneSyncing}>
                <RefreshCw size={16} aria-hidden="true" />
                {phoneSyncing ? "Syncing..." : "Sync from S23"}
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {todayPhoneSnapshots.length ? todayPhoneSnapshots.map((snapshot) => (
                <div key={`${snapshot.source}-${snapshot.metric_date}`} className="rounded-md border border-line bg-panel2/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan">{snapshotSourceLabel(snapshot.source)}</p>
                  {snapshot.source === "health_connect" ? (
                    <div className="mt-2 grid gap-1">
                      <div className="flex justify-between gap-3 text-sm"><span className="text-muted">Steps</span><span className="font-semibold text-text">{formatImportedMetric(snapshot.metrics_json.steps)}</span></div>
                      <div className="flex justify-between gap-3 text-sm"><span className="text-muted">Sleep</span><span className="font-semibold text-text">{formatImportedMetric(snapshot.metrics_json.sleep_hours, " h")}</span></div>
                    </div>
                  ) : (
                    <div className="mt-2 grid gap-1">
                      <div className="flex justify-between gap-3 text-sm"><span className="text-muted">Screen time</span><span className="font-semibold text-text">{formatImportedMetric(snapshot.metrics_json.total_screen_minutes, " min")}</span></div>
                      <div className="flex justify-between gap-3 text-sm"><span className="text-muted">Short-form</span><span className="font-semibold text-text">{formatImportedMetric(snapshot.metrics_json.reels_minutes, " min")}</span></div>
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-sm leading-6 text-muted sm:col-span-2">No phone signal captured for this date. Open Settings - Integrations to grant access, then sync here.</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan/30 bg-cyan/10 text-cyan">
                <CalendarDays size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Mission Clock</p>
                <p className="text-xs text-ghost">Date and sleep window.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-2">
                <span className="label">Date</span>
                <input className="field" type="date" value={log.date} onChange={(e) => set("date", e.target.value)} />
              </label>
              <label className="grid gap-2">
                <span className="label">Wake time</span>
                <input className="field" type="time" value={log.wake_time} onChange={(e) => set("wake_time", e.target.value)} />
              </label>
              <label className="grid gap-2">
                <span className="label">Sleep time</span>
                <input className="field" type="time" value={log.sleep_time} onChange={(e) => set("sleep_time", e.target.value)} />
              </label>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald/30 bg-emerald/10 text-emerald">
                <Shield size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Binary Locks</p>
                <p className="text-xs text-ghost">The simple yes/no systems that change identity.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {toggleFields.map(([key, label]) => (
                <Toggle
                  key={key}
                  label={label}
                  fieldKey={key as Key}
                  value={Boolean(log[key as Key])}
                  onChange={(value) => set(key as Key, value as never)}
                />
              ))}
            </div>
          </Card>

          {numberSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-violet/30 bg-violet/10 text-violet">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{section.title}</p>
                    <p className="text-xs text-ghost">{section.detail}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {section.keys.map((key) => {
                    const field = fieldByKey.get(key);
                    return field ? <NumberInput key={String(key)} field={field as [Key, string, number?, number?]} log={log} set={set} /> : null;
                  })}
                </div>
              </Card>
            );
          })}

          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-amber/30 bg-amber/10 text-amber">
                <Activity size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Narrative Compression</p>
                <p className="text-xs text-ghost">A few words only. No essay needed.</p>
              </div>
            </div>
            <div className="grid gap-3">
              {(["social_action", "hardest_task_done", "biggest_distraction", "notes"] as Key[]).map((key) => {
                const field = textFieldByKey.get(key);
                if (!field) return null;
                const [, label, placeholder] = field;
                return (
                <label key={String(key)} className="grid gap-2">
                  <span className="label">{label}</span>
                  {key === "notes" ? (
                    <textarea
                      className="field min-h-28"
                      value={String(log[key])}
                      placeholder={placeholder}
                      onChange={(e) => set(key, normalizeText(e.target.value) as never)}
                    />
                  ) : (
                    <input
                      className="field"
                      value={String(log[key])}
                      placeholder={placeholder}
                      onChange={(e) => set(key, normalizeText(e.target.value) as never)}
                    />
                  )}
                </label>
              )})}
            </div>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ghost">Live score preview</p>
            <div className="mt-3 flex items-end gap-3">
              <div className="text-6xl font-semibold tabular-nums text-cyan">{preview.execution_score}</div>
              <div className="pb-2 text-xs uppercase tracking-[0.14em] text-muted">Execution</div>
            </div>
            <div className="mt-4 grid gap-3">
              {scoreDomains.map(([label, key, Icon]) => {
                const value = Number(preview[key]);
                return (
                  <div key={label} className="grid gap-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-muted">
                        <Icon size={14} className="text-cyan" aria-hidden="true" />
                        {label}
                      </span>
                      <span className="font-semibold tabular-nums text-text">{value}</span>
                    </div>
                    <div className="progress-rail">
                      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {!log.hardest_task_done ? (
              <div className="mt-4">
                <EmptyState>Today is still blank. Execute before you judge yourself.</EmptyState>
              </div>
            ) : null}
            <button type="submit" className="primary-button mt-4 w-full">
              <Droplets size={17} aria-hidden="true" />
              Save Proof
            </button>
            {saved ? <p className="mt-3 text-sm text-emerald" aria-live="polite">{saved}</p> : null}
          </Card>
        </aside>
      </form>
    </AppShell>
  );
}
