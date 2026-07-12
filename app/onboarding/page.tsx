"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Brain, Flag, SlidersHorizontal, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ModuleShell, StatusCell, SurfaceHeader } from "@/components/SurfaceModules";
import { ErrorBanner, PageTitle } from "@/components/ui";
import { getSettings, saveGoal, saveSettings } from "@/lib/data";
import { hapticImpact } from "@/lib/haptics";
import type { AnalysisProviderId, Settings } from "@/lib/types";

const defaultDeadline = () => {
  const date = new Date();
  date.setDate(date.getDate() + 90);
  return date.toISOString().slice(0, 10);
};

export default function OnboardingPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [primaryGoal, setPrimaryGoal] = useState("Become consistent with proof, body, career, and dopamine control.");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load onboarding settings."));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    hapticImpact(14);
    setSaving(true);
    setError("");
    try {
      const savedSettings = await saveSettings({ ...settings, onboarding_completed: true });
      await saveGoal({
        category: "Season",
        title: "Primary Ascension Protocol",
        target: primaryGoal,
        current_value: "Starting now",
        deadline: defaultDeadline(),
        status: "Active",
        notes: "Generated during first-run onboarding."
      });
      setSettings(savedSettings);
      router.push("/checkin");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to complete onboarding.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageTitle
        eyebrow="First run"
        title="Arm the daily loop"
        subtitle="Set only the targets that change today's protocol. You can edit everything later in Settings."
      />
      {error ? <ErrorBanner message={error} /> : null}

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <StatusCell label="Loop" value="Under 60s" detail="Phone-first check-in" tone="good" />
        <StatusCell label="Analysis" value="Explainable" detail="Deterministic by default" />
        <StatusCell label="Storage" value="Local-first" detail="Syncs when configured" tone="good" />
      </div>

      {!settings ? (
        <ModuleShell>
          <p className="text-sm text-muted">Loading first-run controls...</p>
        </ModuleShell>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <ModuleShell>
            <SurfaceHeader
              icon={Sparkles}
              eyebrow="Identity"
              title="Who is operating this system?"
              detail="This name appears in private settings and future coaching copy."
            />
            <label className="mt-4 grid gap-2">
              <span className="label">Name</span>
              <input
                className="field"
                value={settings.user_name}
                onChange={(event) => setSettings((current) => (current ? { ...current, user_name: event.target.value } : current))}
              />
            </label>
          </ModuleShell>

          <ModuleShell>
            <SurfaceHeader
              icon={Flag}
              eyebrow="Season target"
              title="What is the primary protocol?"
              detail="One sentence. The app will create an editable goal from it."
            />
            <label className="mt-4 grid gap-2">
              <span className="label">Primary goal</span>
              <textarea className="field min-h-28" value={primaryGoal} onChange={(event) => setPrimaryGoal(event.target.value)} />
            </label>
          </ModuleShell>

          <ModuleShell>
            <SurfaceHeader
              icon={SlidersHorizontal}
              eyebrow="Daily targets"
              title="Calibrate the proof thresholds"
              detail="These values drive score interpretation and dashboard contributors."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["dsa_daily_target", "DSA daily target"],
                ["nirmiq_daily_target", "NIRMIQ daily target"],
                ["academic_daily_target", "Academic daily target"],
                ["reels_limit", "Reels limit"],
                ["target_weight", "Target weight"]
              ].map(([key, label]) => (
                <label key={key} className="grid gap-2">
                  <span className="label">{label}</span>
                  <input
                    className="field"
                    type="number"
                    inputMode="decimal"
                    value={Number(settings[key as keyof Settings])}
                    onChange={(event) =>
                      setSettings((current) => (current ? { ...current, [key]: Number(event.target.value) } : current))
                    }
                  />
                </label>
              ))}
              <label className="grid gap-2 sm:col-span-2">
                <span className="label">Sleep target</span>
                <input
                  className="field"
                  value={settings.sleep_target}
                  onChange={(event) => setSettings((current) => (current ? { ...current, sleep_target: event.target.value } : current))}
                />
              </label>
            </div>
          </ModuleShell>

          <ModuleShell>
            <SurfaceHeader
              icon={Brain}
              eyebrow="AI consent"
              title="Choose the analysis mode"
              detail="Deterministic analysis works offline. Gemini is optional and only runs after consent."
            />
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <span className="label">Provider</span>
                <select
                  className="field"
                  value={settings.ai_provider}
                  onChange={(event) =>
                    setSettings((current) =>
                      current ? { ...current, ai_provider: event.target.value as AnalysisProviderId } : current
                    )
                  }
                >
                  <option value="off">Off</option>
                  <option value="deterministic">Deterministic offline</option>
                  <option value="gemini">Gemini cloud</option>
                </select>
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-md border border-line bg-panel2 px-3 py-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={settings.ai_consent}
                  onChange={(event) => setSettings((current) => (current ? { ...current, ai_consent: event.target.checked } : current))}
                />
                Allow cloud AI analysis when Gemini is selected.
              </label>
            </div>
          </ModuleShell>

          <button type="submit" className="primary-button w-full" disabled={saving || !primaryGoal.trim()}>
            {saving ? "Arming..." : "Start Daily Protocol"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </form>
      )}
    </AppShell>
  );
}
