"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyState, PageTitle } from "@/components/ui";
import { getLogByDate, saveLog } from "@/lib/data";
import { calculateScores, emptyLog } from "@/lib/scoring";
import type { DailyLog } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

type Key = keyof DailyLog;

const numberFields: Array<[Key, string, number?, number?]> = [
  ["sleep_hours", "Sleep hours", 0, 16],
  ["workout_quality", "Workout quality", 1, 10],
  ["protein_grams", "Protein grams", 0],
  ["water_litres", "Water litres", 0],
  ["weight_kg", "Weight kg", 0],
  ["steps", "Steps", 0],
  ["dsa_minutes", "DSA minutes", 0],
  ["nirmiq_minutes", "NIRMIQ minutes", 0],
  ["academic_minutes", "Academic study minutes", 0],
  ["deep_work_minutes", "Deep work minutes", 0],
  ["masturbation_count", "Masturbation count", 0],
  ["reels_minutes", "Reels/shorts minutes", 0],
  ["youtube_minutes", "YouTube minutes", 0],
  ["money_earned", "Money earned", 0],
  ["money_spent", "Money spent", 0],
  ["mood", "Mood", 1, 10],
  ["self_respect", "Self-respect", 1, 10]
];

const textFields: Array<[Key, string, string]> = [
  ["social_action", "Social action", "One social rep you took"],
  ["hardest_task_done", "Hardest task done today", "The one task that mattered"],
  ["biggest_distraction", "Biggest distraction", "What pulled you off path"],
  ["notes", "Notes", "Brutal truth, no stories"]
];

function Toggle({
  label,
  value,
  onChange
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex min-h-11 items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
        value ? "border-emerald/40 bg-emerald/10 text-emerald" : "border-line bg-panel2 text-muted"
      }`}
      aria-pressed={value}
    >
      <span>{label}</span>
      <span className="font-semibold">{value ? "Yes" : "No"}</span>
    </button>
  );
}

export default function CheckinPage() {
  const router = useRouter();
  const [log, setLog] = useState<DailyLog>(emptyLog(today()));
  const [saved, setSaved] = useState("");

  useEffect(() => {
    getLogByDate(today()).then((existing) => {
      if (existing) setLog(existing);
    });
  }, []);

  const set = <T extends Key>(key: T, value: DailyLog[T]) => setLog((current) => ({ ...current, [key]: value }));
  const preview = calculateScores(log);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await saveLog(log);
    setSaved("Proof logged.");
    setTimeout(() => router.push("/dashboard"), 450);
  }

  return (
    <AppShell>
      <PageTitle
        eyebrow="Execute today"
        title="Log Today's Proof"
        subtitle="No stories. No excuses. Only what happened."
      />

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="grid gap-4">
          <Card>
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
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["Gym done", "gym_done"],
                ["Diet followed", "diet_followed"],
                ["Porn relapse", "porn_relapse"],
                ["Smoking", "smoking"],
                ["Grooming done", "grooming_done"],
                ["Skincare done", "skincare_done"]
              ].map(([label, key]) => (
                <Toggle
                  key={key}
                  label={label}
                  value={Boolean(log[key as Key])}
                  onChange={(value) => set(key as Key, value as never)}
                />
              ))}
            </div>
          </Card>

          <Card>
            <div className="grid gap-3 sm:grid-cols-2">
              {numberFields.map(([key, label, min, max]) => (
                <label key={String(key)} className="grid gap-2">
                  <span className="label">{label}</span>
                  <input
                    className="field"
                    type="number"
                    inputMode="decimal"
                    min={min}
                    max={max}
                    value={Number(log[key])}
                    onChange={(e) => set(key, Number(e.target.value) as never)}
                  />
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <div className="grid gap-3">
              {textFields.map(([key, label, placeholder]) => (
                <label key={String(key)} className="grid gap-2">
                  <span className="label">{label}</span>
                  {key === "notes" ? (
                    <textarea
                      className="field min-h-28"
                      value={String(log[key])}
                      placeholder={placeholder}
                      onChange={(e) => set(key, e.target.value as never)}
                    />
                  ) : (
                    <input
                      className="field"
                      value={String(log[key])}
                      placeholder={placeholder}
                      onChange={(e) => set(key, e.target.value as never)}
                    />
                  )}
                </label>
              ))}
            </div>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <p className="text-xs font-semibold uppercase text-ghost">Live Score Preview</p>
            <div className="mt-3 text-5xl font-semibold text-cyan">{preview.execution_score}</div>
            <div className="mt-3 grid gap-2 text-sm text-muted">
              <div>Discipline: {preview.discipline_score}</div>
              <div>Career: {preview.career_score}</div>
              <div>Dopamine: {preview.dopamine_score}</div>
              <div>Physique: {preview.physique_score}</div>
              <div>Self-respect: {preview.self_respect_score}</div>
            </div>
            {!log.hardest_task_done ? (
              <div className="mt-4">
                <EmptyState>Today is still blank. Execute before you judge yourself.</EmptyState>
              </div>
            ) : null}
            <button type="submit" className="primary-button mt-4 w-full">
              Save Proof
            </button>
            {saved ? <p className="mt-3 text-sm text-emerald" aria-live="polite">{saved}</p> : null}
          </Card>
        </aside>
      </form>
    </AppShell>
  );
}
