"use client";

import { useEffect, useState } from "react";
import { flushSyncQueue } from "@/lib/data";
import { getSyncSnapshot, type SyncSnapshot } from "@/lib/local-first";
import { isSupabaseConfigured } from "@/lib/supabase";

export function SyncStatus() {
  const [snapshot, setSnapshot] = useState<SyncSnapshot | null>(null);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const next = await getSyncSnapshot();
      if (active) setSnapshot(next);
    }

    async function syncNow() {
      if (!isSupabaseConfigured) {
        await refresh();
        return;
      }
      try {
        await flushSyncQueue();
      } catch {
        // The sync snapshot already captures the visible error.
      } finally {
        await refresh();
      }
    }

    refresh();
    const interval = window.setInterval(refresh, 5000);
    window.addEventListener("online", syncNow);
    window.addEventListener("offline", refresh);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("online", syncNow);
      window.removeEventListener("offline", refresh);
    };
  }, []);

  if (!snapshot) return null;
  if (snapshot.online && snapshot.pending === 0 && !snapshot.lastError) return null;

  const message = !snapshot.online
    ? `Offline mode active. ${snapshot.pending} change(s) waiting to sync.`
    : snapshot.pending > 0
      ? `${snapshot.pending} local change(s) waiting to sync.`
      : snapshot.lastError;

  return (
    <div className="border-b border-amber/30 bg-amber/10 px-4 py-2 text-center text-xs font-medium text-amber" role="status">
      {message}
      {snapshot.lastError && snapshot.pending > 0 ? ` Last error: ${snapshot.lastError}` : null}
    </div>
  );
}
