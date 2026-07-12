"use client";

import { FormEvent, useEffect, useState } from "react";
import { Brain, DatabaseBackup, RotateCcw, Save, ShieldCheck, SlidersHorizontal, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ModuleShell, StatusCell, SurfaceHeader } from "@/components/SurfaceModules";
import { ErrorBanner, PageTitle } from "@/components/ui";
import { deleteAiAnalyses, deleteMemoryItem, exportBackup, getAiAnalyses, getMemoryItems, getSettings, importBackup, saveSettings } from "@/lib/data";
import { hapticImpact } from "@/lib/haptics";
import type { MemoryItem, Settings } from "@/lib/types";

type EditableSettingKey =
  | "user_name"
  | "target_weight"
  | "dsa_daily_target"
  | "nirmiq_daily_target"
  | "academic_daily_target"
  | "reels_limit"
  | "sleep_target";

const fields: Array<[EditableSettingKey, string, string]> = [
  ["user_name", "User name", "text"],
  ["target_weight", "Target weight", "number"],
  ["dsa_daily_target", "DSA daily target", "number"],
  ["nirmiq_daily_target", "NIRMIQ daily target", "number"],
  ["academic_daily_target", "Academic daily target", "number"],
  ["reels_limit", "Reels limit", "number"],
  ["sleep_target", "Sleep target", "text"]
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [exportText, setExportText] = useState("");
  const [backupText, setBackupText] = useState("");
  const [importText, setImportText] = useState("");
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [memoryExport, setMemoryExport] = useState("");

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load settings."));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    hapticImpact(10);
    setError("");
    try {
      const savedSettings = await saveSettings(settings);
      setSettings(savedSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save settings.");
    }
  }

  async function exportHistory() {
    hapticImpact(6);
    setError("");
    try {
      const analyses = await getAiAnalyses();
      setExportText(JSON.stringify(analyses, null, 2));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to export AI history.");
    }
  }

  async function deleteHistory() {
    hapticImpact(12);
    setError("");
    try {
      await deleteAiAnalyses();
      setExportText("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete AI history.");
    }
  }

  async function exportAllData() {
    hapticImpact(6);
    setError("");
    try {
      setBackupText(JSON.stringify(await exportBackup(), null, 2));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to export backup.");
    }
  }

  async function loadMemoryVault() {
    hapticImpact(6);
    setError("");
    try {
      const items = await getMemoryItems(100);
      setMemoryItems(items);
      setMemoryExport(JSON.stringify(items, null, 2));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load memory vault.");
    }
  }

  async function removeMemory(id: string) {
    hapticImpact(10);
    setError("");
    try {
      await deleteMemoryItem(id);
      setMemoryItems((current) => {
        const next = current.filter((item) => item.id !== id);
        setMemoryExport(JSON.stringify(next, null, 2));
        return next;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete memory item.");
    }
  }

  async function importAllData() {
    hapticImpact(12);
    setError("");
    try {
      await importBackup(importText);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to import backup.");
    }
  }

  if (!settings) {
    return (
      <AppShell>
        <PageTitle eyebrow="Control surface" title="Settings" subtitle="Loading local-first settings and sync state." />
        {error ? <ErrorBanner message={error} /> : null}
        <ModuleShell>
          <p className="text-sm text-muted">Preparing control surface...</p>
        </ModuleShell>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageTitle
        eyebrow="Control surface"
        title="Settings"
        subtitle="Simple targets for the current season. Theme locked to dark for now."
      />
      {error ? <ErrorBanner message={error} /> : null}

      <form onSubmit={submit}>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <StatusCell label="Operator" value={settings.user_name || "Self"} detail="Private profile" />
          <StatusCell label="AI provider" value={settings.ai_provider} detail={settings.ai_consent ? "Cloud allowed" : "Cloud locked"} tone={settings.ai_consent ? "good" : "warn"} />
          <StatusCell label="First run" value={settings.onboarding_completed ? "Complete" : "Open"} detail="Onboarding state" tone={settings.onboarding_completed ? "good" : "warn"} />
        </div>

        <ModuleShell>
          <SurfaceHeader
            icon={SlidersHorizontal}
            eyebrow="Target controls"
            title="Season calibration"
            detail="Set the numbers the daily proof protocol will judge against."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map(([key, label, type]) => (
              <label key={key} className="grid gap-2">
                <span className="label">{label}</span>
                <input
                  className="field"
                  type={type}
                  value={settings[key]}
                  onChange={(e) =>
                    setSettings((current) =>
                      current
                        ? {
                            ...current,
                            [key]: type === "number" ? Number(e.target.value) : e.target.value
                          }
                        : current
                    )
                  }
                />
              </label>
            ))}
            <label className="grid gap-2 sm:col-span-2">
              <span className="label">Theme</span>
              <input className="field" value="Dark mode locked" readOnly />
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-md border border-line bg-panel2 px-3 py-2 text-sm text-muted sm:col-span-2">
              <input
                type="checkbox"
                checked={settings.onboarding_completed}
                onChange={(event) => setSettings((current) => (current ? { ...current, onboarding_completed: event.target.checked } : current))}
              />
              First-run onboarding completed.
            </label>
          </div>
          <button type="submit" className="primary-button mt-4">
            <Save size={17} aria-hidden="true" />
            {saved ? "Saved" : "Save Settings"}
          </button>
        </ModuleShell>

        <ModuleShell className="mt-4">
          <div className="grid gap-4">
            <SurfaceHeader
              icon={Brain}
              eyebrow="AI spine"
              title="Performance analysis consent"
              detail="Gemini only runs after consent. Deterministic mode stays local and uses rule-based insights."
            />
            <label className="grid gap-2">
              <span className="label">Provider</span>
              <select
                className="field"
                value={settings.ai_provider}
                onChange={(event) =>
                  setSettings((current) =>
                    current ? { ...current, ai_provider: event.target.value as Settings["ai_provider"] } : current
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
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" className="secondary-button" onClick={exportHistory}>
                <ShieldCheck size={17} aria-hidden="true" />
                Export AI History
              </button>
              <button type="button" className="secondary-button border-red-900/70 text-red-200" onClick={deleteHistory}>
                <Trash2 size={17} aria-hidden="true" />
                Delete AI History
              </button>
            </div>
            {exportText ? (
              <label className="grid gap-2">
                <span className="label">AI history export</span>
                <textarea className="field min-h-64 font-mono text-xs" value={exportText} readOnly />
              </label>
            ) : null}
          </div>
        </ModuleShell>

        <ModuleShell className="mt-4">
          <div className="grid gap-4">
            <SurfaceHeader
              icon={ShieldCheck}
              eyebrow="Memory vault"
              title="Review and prune saved memory"
              detail="Memory items are future fuel for weekly analysis and pattern detection."
            />
            <button type="button" className="secondary-button w-full sm:w-fit" onClick={loadMemoryVault}>
              Load Memory Items
            </button>
            {memoryItems.length ? (
              <div className="grid gap-2">
                {memoryItems.map((item) => (
                  <div key={item.id ?? item.title} className="rounded-md border border-line bg-panel2/70 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text">{item.title}</p>
                        <p className="mt-1 text-xs text-ghost">
                          {item.source_type} · {item.source_date ?? "undated"} · {item.tags_json.join(", ")}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
                      </div>
                      {item.id ? (
                        <button type="button" className="secondary-button border-red-900/70 px-3 text-red-200" onClick={() => removeMemory(item.id!)}>
                          <Trash2 size={16} aria-hidden="true" />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {memoryExport ? (
              <label className="grid gap-2">
                <span className="label">Memory export</span>
                <textarea className="field min-h-48 font-mono text-xs" value={memoryExport} readOnly />
              </label>
            ) : null}
          </div>
        </ModuleShell>

        <ModuleShell className="mt-4">
          <div className="grid gap-4">
            <SurfaceHeader
              icon={DatabaseBackup}
              eyebrow="Local-first vault"
              title="Backup and restore"
              detail="Export the full local cache as JSON or restore a previous backup. This works without paid storage."
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" className="secondary-button" onClick={exportAllData}>
                <DatabaseBackup size={17} aria-hidden="true" />
                Export Full Backup
              </button>
              <button type="button" className="secondary-button" onClick={importAllData} disabled={!importText.trim()}>
                <RotateCcw size={17} aria-hidden="true" />
                Import Backup
              </button>
            </div>
            <label className="grid gap-2">
              <span className="label">Paste backup JSON</span>
              <textarea
                className="field min-h-36 font-mono text-xs"
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
              />
            </label>
            {backupText ? (
              <label className="grid gap-2">
                <span className="label">Full backup export</span>
                <textarea className="field min-h-64 font-mono text-xs" value={backupText} readOnly />
              </label>
            ) : null}
          </div>
        </ModuleShell>
      </form>
    </AppShell>
  );
}
