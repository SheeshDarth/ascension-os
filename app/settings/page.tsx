"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, PageTitle } from "@/components/ui";
import { getSettings, saveSettings } from "@/lib/data";
import type { Settings } from "@/lib/types";

const fields: Array<[keyof Settings, string, string]> = [
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
      </form>
    </AppShell>
  );
}
