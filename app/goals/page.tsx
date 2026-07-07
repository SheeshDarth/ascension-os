"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorBanner, PageTitle } from "@/components/ui";
import { getGoals, saveGoal } from "@/lib/data";
import type { Goal } from "@/lib/types";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [savedId, setSavedId] = useState<string | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    getGoals()
      .then(setGoals)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load goals."));
  }, []);

  function update(index: number, patch: Partial<Goal>) {
    setGoals((current) => current.map((goal, itemIndex) => (itemIndex === index ? { ...goal, ...patch } : goal)));
  }

  async function persist(goal: Goal) {
    setError("");
    try {
      const saved = await saveGoal(goal);
      setSavedId(saved.id);
      setTimeout(() => setSavedId(undefined), 1500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save goal.");
    }
  }

  return (
    <AppShell>
      <PageTitle
        eyebrow="Target Form: Ultimate"
        title="Goals"
        subtitle="Editable direction. Execution still decides identity."
      />
      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-4">
        {goals.map((goal, index) => (
          <Card key={goal.id ?? `${goal.category}-${index}`}>
            <div className="grid gap-3 lg:grid-cols-[10rem_1fr]">
              <div>
                <p className="text-xs font-semibold uppercase text-cyan">{goal.category}</p>
                <p className="mt-2 text-xs text-ghost">Deadline: {goal.deadline}</p>
                <p className="mt-1 text-xs text-muted">Status: {goal.status}</p>
              </div>
              <div className="grid gap-3">
                <label className="grid gap-2">
                  <span className="label">Title</span>
                  <input className="field" value={goal.title} onChange={(e) => update(index, { title: e.target.value })} />
                </label>
                <label className="grid gap-2">
                  <span className="label">Target</span>
                  <textarea className="field min-h-24" value={goal.target} onChange={(e) => update(index, { target: e.target.value })} />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="grid gap-2">
                    <span className="label">Current value</span>
                    <input className="field" value={goal.current_value} onChange={(e) => update(index, { current_value: e.target.value })} />
                  </label>
                  <label className="grid gap-2">
                    <span className="label">Deadline</span>
                    <input className="field" type="date" value={goal.deadline} onChange={(e) => update(index, { deadline: e.target.value })} />
                  </label>
                  <label className="grid gap-2">
                    <span className="label">Status</span>
                    <select className="field" value={goal.status} onChange={(e) => update(index, { status: e.target.value })}>
                      <option>Active</option>
                      <option>At risk</option>
                      <option>Paused</option>
                      <option>Complete</option>
                    </select>
                  </label>
                </div>
                <label className="grid gap-2">
                  <span className="label">Notes</span>
                  <textarea className="field min-h-20" value={goal.notes} onChange={(e) => update(index, { notes: e.target.value })} />
                </label>
                <button type="button" className="secondary-button w-full sm:w-fit" onClick={() => persist(goal)}>
                  {savedId === goal.id ? "Saved" : "Save Goal"}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
