"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MemoryGraph } from "@/components/MemoryGraph";
import { EmptyState, PageTitle } from "@/components/ui";
import { getLogs } from "@/lib/data";
import type { DailyLog } from "@/lib/types";

export default function MemoryGraphPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    getLogs().then(setLogs);
  }, []);

  return (
    <AppShell>
      <PageTitle
        eyebrow="Performance memory"
        title="Memory Graph"
        subtitle="Visualize how your daily proof compounds across execution, discipline, career, dopamine control, physique, and self-respect."
      />

      {!logs.length ? <EmptyState>No memory graph yet. Log proof daily and the pattern will become visible.</EmptyState> : null}
      <div className="mt-4">
        <MemoryGraph logs={logs} />
      </div>
    </AppShell>
  );
}
