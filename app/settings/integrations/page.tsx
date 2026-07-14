"use client";

import Link from "next/link";
import { Activity, Check, ChevronLeft, Clock3, HeartPulse, RefreshCw, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ModuleShell, StatusCell, SurfaceHeader } from "@/components/SurfaceModules";
import { ErrorBanner, EmptyState, PageTitle } from "@/components/ui";
import {
  deleteDeviceMetricSnapshots,
  getDeviceMetricSnapshots,
  saveDeviceMetricSnapshot
} from "@/lib/data";
import {
  formatImportedMetric,
  snapshotSourceLabel
} from "@/lib/device-metrics";
import {
  getNativeIntegrationStatus,
  nativeRuntimeAvailable,
  openUsageAccessSettings,
  readNativeDailyMetrics,
  requestHealthPermissions
} from "@/lib/native-bridge";
import { hapticImpact } from "@/lib/haptics";
import type { DeviceMetricSnapshot, IntegrationState, NativeIntegrationStatus } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

function stateLabel(state: IntegrationState) {
  return {
    connected: "Connected",
    permission_required: "Permission required",
    unavailable: "Unavailable",
    unsupported: "APK only",
    unknown: "Checking"
  }[state];
}

function stateTone(state: IntegrationState): "neutral" | "good" | "warn" | "danger" {
  if (state === "connected") return "good";
  if (state === "permission_required" || state === "unknown") return "warn";
  if (state === "unavailable") return "danger";
  return "neutral";
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/70 py-2 last:border-b-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-text">{value}</span>
    </div>
  );
}

export default function IntegrationsPage() {
  const [status, setStatus] = useState<NativeIntegrationStatus | null>(null);
  const [snapshots, setSnapshots] = useState<DeviceMetricSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"health" | "usage" | "sync" | "delete" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [nextStatus, nextSnapshots] = await Promise.all([
        getNativeIntegrationStatus(),
        getDeviceMetricSnapshots(30)
      ]);
      setStatus(nextStatus);
      setSnapshots(nextSnapshots);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load device integrations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  async function grantHealthAccess() {
    hapticImpact(8);
    setBusy("health");
    setError("");
    setMessage("");
    try {
      setStatus(await requestHealthPermissions());
      setMessage("Health Connect permissions updated. Sync today's signal when ready.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to request Health Connect permissions.");
    } finally {
      setBusy(null);
    }
  }

  async function openUsageAccess() {
    hapticImpact(8);
    setBusy("usage");
    setError("");
    setMessage("");
    try {
      await openUsageAccessSettings();
      setMessage("Usage Access settings opened. Return to AscensionOS after enabling access.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to open Usage Access settings.");
    } finally {
      setBusy(null);
    }
  }

  async function syncNow() {
    hapticImpact(10);
    setBusy("sync");
    setError("");
    setMessage("");
    try {
      const result = await readNativeDailyMetrics(today());
      for (const snapshot of result.snapshots ?? []) await saveDeviceMetricSnapshot(snapshot);
      await load();
      const importedCount = result.snapshots?.length ?? 0;
      const warningCount = result.warnings?.length ?? 0;
      setMessage(
        importedCount
          ? `Today's phone signal is ready. ${importedCount} source${importedCount === 1 ? "" : "s"} captured${warningCount ? `; ${warningCount} permission warning${warningCount === 1 ? "" : "s"}` : ""}.`
          : "No phone signal was returned. Check permissions, then try again."
      );
      if (warningCount) setError(result.warnings?.join(" ") ?? "One or more phone permissions are missing.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sync phone metrics.");
    } finally {
      setBusy(null);
    }
  }

  async function clearSnapshots() {
    if (!window.confirm("Delete all imported phone telemetry from AscensionOS? Manual proof will remain.")) return;
    hapticImpact(12);
    setBusy("delete");
    setError("");
    try {
      await deleteDeviceMetricSnapshots();
      setSnapshots([]);
      setMessage("Imported phone telemetry deleted. Manual proof was not changed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete imported telemetry.");
    } finally {
      setBusy(null);
    }
  }

  const isAndroid = status?.runtime === "android" || nativeRuntimeAvailable();

  return (
    <AppShell>
      <div className="mb-4">
        <Link href="/settings" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted transition hover:text-cyan">
          <ChevronLeft size={16} aria-hidden="true" />
          Settings
        </Link>
      </div>
      <PageTitle
        eyebrow="Device bridge"
        title="Phone telemetry"
        subtitle="Bring Samsung Health and Android screen-time signals into your daily proof without overwriting what you entered yourself."
      />
      {error ? <ErrorBanner message={error} /> : null}
      {message ? <div className="mb-4 rounded-lg border border-cyan/25 bg-cyan/5 p-4 text-sm leading-6 text-cyan" role="status">{message}</div> : null}

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <StatusCell
          label="Runtime"
          value={isAndroid ? "Android APK" : "Browser / PWA"}
          detail={isAndroid ? "Native bridge available" : "Install the APK for private phone data"}
          tone={isAndroid ? "good" : "warn"}
        />
        <StatusCell label="Health Connect" value={stateLabel(status?.health_connect ?? "unknown")} detail="Samsung Health source" tone={stateTone(status?.health_connect ?? "unknown")} />
        <StatusCell label="Usage Access" value={stateLabel(status?.usage_stats ?? "unknown")} detail="Screen-time source" tone={stateTone(status?.usage_stats ?? "unknown")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ModuleShell>
          <SurfaceHeader
            icon={HeartPulse}
            eyebrow="Health Connect"
            title="Samsung Health signals"
            detail="Reads steps, sleep, exercise, and latest weight from Health Connect after you grant access."
            action={<span className="signal-chip">{stateLabel(status?.health_connect ?? "unknown")}</span>}
          />
          <div className="mt-4 grid gap-3">
            <div className="rounded-md border border-line bg-panel2/70 p-3 text-sm leading-6 text-muted">
              Samsung Health remains the source of truth. AscensionOS requests read-only access through Android Health Connect.
            </div>
            <button type="button" className="secondary-button w-full" onClick={grantHealthAccess} disabled={busy !== null || !isAndroid}>
              <ShieldCheck size={17} aria-hidden="true" />
              {busy === "health" ? "Opening permissions..." : "Grant Health Access"}
            </button>
          </div>
        </ModuleShell>

        <ModuleShell>
          <SurfaceHeader
            icon={Clock3}
            eyebrow="Usage Access"
            title="Screen-time signals"
            detail="Reads daily Android app usage for total screen time, YouTube, and short-form video minutes."
            action={<span className="signal-chip">{stateLabel(status?.usage_stats ?? "unknown")}</span>}
          />
          <div className="mt-4 grid gap-3">
            <div className="rounded-md border border-line bg-panel2/70 p-3 text-sm leading-6 text-muted">
              Android requires a one-time system permission. AscensionOS only summarizes usage; it does not read message content.
            </div>
            <button type="button" className="secondary-button w-full" onClick={openUsageAccess} disabled={busy !== null || !isAndroid}>
              <Smartphone size={17} aria-hidden="true" />
              {busy === "usage" ? "Opening system settings..." : "Enable Usage Access"}
            </button>
          </div>
        </ModuleShell>
      </div>

      <ModuleShell className="mt-4">
        <SurfaceHeader
          icon={RefreshCw}
          eyebrow="Explicit sync"
          title="Capture today's signal"
          detail="Sync is manual by design. Imported values appear in Check-in and fill blank fields only; your manual values always win."
          action={
            <button type="button" className="primary-button" onClick={syncNow} disabled={busy !== null || !isAndroid}>
              <RefreshCw size={17} aria-hidden="true" />
              {busy === "sync" ? "Syncing..." : "Sync now"}
            </button>
          }
        />
        {!isAndroid ? (
          <div className="mt-4">
            <EmptyState>Open this page inside the AscensionOS Android APK to connect your Samsung S23. The browser cannot read private phone sensors or app-usage data.</EmptyState>
          </div>
        ) : null}
        {loading ? <p className="mt-4 text-sm text-muted">Loading imported signal...</p> : null}
        {!loading && !snapshots.length ? <p className="mt-4 text-sm text-muted">No imported snapshots yet. Grant access, then sync today.</p> : null}
        {snapshots.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {snapshots.map((snapshot) => {
              const metrics = snapshot.metrics_json;
              return (
                <div key={`${snapshot.device_id}-${snapshot.source}-${snapshot.metric_date}`} className="rounded-md border border-line bg-panel2/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{snapshot.metric_date}</p>
                      <p className="mt-1 text-xs text-ghost">{snapshotSourceLabel(snapshot.source)} - captured {new Date(snapshot.captured_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <Check size={16} className="text-emerald" aria-label="Captured" />
                  </div>
                  <div className="mt-3 grid gap-1">
                    {snapshot.source === "health_connect" ? (
                      <>
                        <MetricLine label="Steps" value={formatImportedMetric(metrics.steps)} />
                        <MetricLine label="Sleep" value={formatImportedMetric(metrics.sleep_hours, " h")} />
                        <MetricLine label="Exercise" value={formatImportedMetric(metrics.exercise_minutes, " min")} />
                        <MetricLine label="Weight" value={formatImportedMetric(metrics.weight_kg, " kg")} />
                      </>
                    ) : (
                      <>
                        <MetricLine label="Total screen" value={formatImportedMetric(metrics.total_screen_minutes, " min")} />
                        <MetricLine label="Short-form" value={formatImportedMetric(metrics.reels_minutes, " min")} />
                        <MetricLine label="YouTube" value={formatImportedMetric(metrics.youtube_minutes, " min")} />
                        <MetricLine label="Social" value={formatImportedMetric(metrics.social_minutes, " min")} />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-ghost">Delete removes imported snapshots only. It never deletes daily proof or Samsung Health data.</p>
          <button type="button" className="secondary-button border-red-900/70 text-red-200" onClick={clearSnapshots} disabled={busy !== null || !snapshots.length}>
            <Trash2 size={16} aria-hidden="true" />
            {busy === "delete" ? "Deleting..." : "Delete imported data"}
          </button>
        </div>
      </ModuleShell>

      <ModuleShell className="mt-4">
        <SurfaceHeader
          icon={Activity}
          eyebrow="Privacy boundary"
          title="What is collected"
          detail="Only daily aggregates are stored: no raw app content, messages, contacts, or continuous location."
        />
      </ModuleShell>
    </AppShell>
  );
}
