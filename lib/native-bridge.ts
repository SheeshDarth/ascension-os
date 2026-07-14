"use client";

import type { DeviceMetricSnapshot, NativeIntegrationStatus } from "@/lib/types";

type NativeDevicePlugin = {
  getIntegrationStatus: () => Promise<NativeIntegrationStatus>;
  requestHealthPermissions: () => Promise<NativeIntegrationStatus>;
  openUsageAccessSettings: () => Promise<void>;
  readDailyMetrics: (options: { date: string }) => Promise<{
    snapshots?: DeviceMetricSnapshot[];
    warnings?: string[];
    status?: NativeIntegrationStatus;
  }>;
};

type NativeWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    Plugins?: {
      AscensionDevice?: NativeDevicePlugin;
    };
  };
  __ASCENSION_NATIVE__?: NativeDevicePlugin;
};

const browserStatus: NativeIntegrationStatus = {
  runtime: "browser",
  health_connect: "unsupported",
  usage_stats: "unsupported"
};

function nativePlugin() {
  if (typeof window === "undefined") return null;
  const nativeWindow = window as NativeWindow;
  return nativeWindow.__ASCENSION_NATIVE__ ?? nativeWindow.Capacitor?.Plugins?.AscensionDevice ?? null;
}

export function nativeRuntimeAvailable() {
  if (typeof window === "undefined") return false;
  const nativeWindow = window as NativeWindow;
  return Boolean(nativeWindow.Capacitor?.isNativePlatform?.() && nativePlugin());
}

export async function getNativeIntegrationStatus(): Promise<NativeIntegrationStatus> {
  const plugin = nativePlugin();
  if (!plugin) return browserStatus;
  try {
    return await plugin.getIntegrationStatus();
  } catch {
    return {
      runtime: "android",
      health_connect: "unknown",
      usage_stats: "unknown"
    };
  }
}

export async function requestHealthPermissions() {
  const plugin = nativePlugin();
  if (!plugin) throw new Error("Health Connect is available only in the AscensionOS Android APK.");
  return plugin.requestHealthPermissions();
}

export async function openUsageAccessSettings() {
  const plugin = nativePlugin();
  if (!plugin) throw new Error("Screen-time access is available only in the AscensionOS Android APK.");
  return plugin.openUsageAccessSettings();
}

export async function readNativeDailyMetrics(date: string) {
  const plugin = nativePlugin();
  if (!plugin) throw new Error("Install the AscensionOS Android APK to read Samsung Health and screen-time data.");
  return plugin.readDailyMetrics({ date });
}
