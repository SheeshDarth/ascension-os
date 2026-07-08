"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, PageTitle } from "@/components/ui";
import { deleteAiAnalyses, exportBackup, getAiAnalyses, getSettings, importBackup, saveSettings } from "@/lib/data";
import type { Settings } from "@/lib/types";

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

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load settings."));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
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
    setError("");
    try {
      const analyses = await getAiAnalyses();
      setExportText(JSON.stringify(analyses, null, 2));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to export AI history.");
    }
  }

  async function deleteHistory() {
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
    setError("");
    try {
      setBackupText(JSON.stringify(await exportBackup(), null, 2));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to export backup.");
    }
  }

  async function importAllData() {
    setError("");
    try {
      await importBackup(importText);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to import backup.");
    }
  }

  if (!settings) return null;

  return (
    <AppShell>
      <PageTitle
        eyebrow="Control surface"
        title="Settings"
        subtitle="Simple targets for the current season. Theme locked to dark for now."
      />
      {error ? <ErrorBanner message={error} /> : null}

      <form onSubmit={submit}>
        <Card>
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
          </div>
          <button type="submit" className="primary-button mt-4">
            {saved ? "Saved" : "Save Settings"}
          </button>
        </Card>

        <Card className="mt-4">
          <div className="grid gap-4">
            <div>
              <p className="text-sm font-semibold text-text">AI Analysis</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Gemini only runs after consent. AscensionOS sends a compact weekly summary with scores, goals, and recent memory labels. Deterministic mode stays local and uses rule-based insights.
              </p>
            </div>
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
            <label className="flex min-h-11 items-center gap-3 rounded-md border border-line bg-panel2 px-3 py-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={settings.ai_consent}
                onChange={(event) => setSettings((current) => (current ? { ...current, ai_consent: event.target.checked } : current))}
              />
              Allow cloud AI analysis when Gemini is selected.
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" className="secondary-button" onClick={exportHistory}>
                Export AI History
              </button>
              <button type="button" className="secondary-button border-red-900/70 text-red-200" onClick={deleteHistory}>
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
        </Card>

        <Card className="mt-4">
          <div className="grid gap-4">
            <div>
              <p className="text-sm font-semibold text-text">Local Backup</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Export the full local cache as JSON or restore a previous backup. This works without paid storage.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" className="secondary-button" onClick={exportAllData}>
                Export Full Backup
              </button>
              <button type="button" className="secondary-button" onClick={importAllData} disabled={!importText.trim()}>
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
        </Card>
      </form>
    </AppShell>
  );
}
