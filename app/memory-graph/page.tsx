"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MemoryGraph } from "@/components/MemoryGraph";
import { EmptyState, ErrorBanner, PageTitle } from "@/components/ui";
import { getLogs } from "@/lib/data";
import type { GraphRange } from "@/lib/memory";
import type { DailyLog } from "@/lib/types";

export default function MemoryGraphPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [error, setError] = useState("");
  const [range, setRange] = useState<GraphRange>(30);

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load memory graph."));
  }, []);

  return (
    <AppShell>
      <PageTitle
        eyebrow="Performance memory"
        title="Memory Graph"
        subtitle="Visualize how your daily proof compounds across execution, discipline, career, dopamine control, physique, and self-respect."
      />
      {error ? <ErrorBanner message={error} /> : null}

      {!logs.length ? <EmptyState>No memory graph yet. Log proof daily and the pattern will become visible.</EmptyState> : null}
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg border border-line bg-panel p-1">
        {([7, 30, 90] as GraphRange[]).map((days) => (
          <button
            key={days}
            type="button"
            className={`min-h-11 rounded-md px-3 py-2 text-sm font-semibold transition ${
              range === days ? "bg-cyan text-black" : "text-muted hover:bg-panel2 hover:text-text"
            }`}
            onClick={() => setRange(days)}
            aria-pressed={range === days}
          >
            {days}D
          </button>
        ))}
      </div>
      <div className="mt-4">
        <MemoryGraph logs={logs} range={range} />
      </div>
    </AppShell>
  );
}
