"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Plus, Save, Target, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ModuleShell, StatusCell, SurfaceHeader } from "@/components/SurfaceModules";
import { ErrorBanner, PageTitle } from "@/components/ui";
import { getGoals, saveGoal } from "@/lib/data";
import { hapticImpact } from "@/lib/haptics";
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

  function addGoal() {
    hapticImpact(10);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    setGoals((current) => [
      {
        id: crypto.randomUUID(),
        category: "New target",
        title: "Untitled protocol",
        target: "",
        current_value: "",
        deadline: deadline.toISOString().slice(0, 10),
        status: "Active",
        notes: ""
      },
      ...current
    ]);
  }

  async function persist(goal: Goal, index: number) {
    hapticImpact(8);
    setError("");
    try {
      const saved = await saveGoal(goal);
      setSavedId(saved.id);
      setGoals((current) => current.map((item, itemIndex) => (itemIndex === index ? saved : item)));
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

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <StatusCell label="Total goals" value={goals.length} detail="Active operating targets" />
        <StatusCell label="At risk" value={goals.filter((goal) => goal.status === "At risk").length} detail="Needs intervention" tone={goals.some((goal) => goal.status === "At risk") ? "warn" : "good"} />
        <StatusCell label="Complete" value={goals.filter((goal) => goal.status === "Complete").length} detail="Locked proof" tone="good" />
      </div>

      <ModuleShell className="mb-4">
        <SurfaceHeader
          icon={Target}
          eyebrow="Goal forge"
          title="Create or recalibrate a target"
          detail="Keep goals few, inspectable, and attached to the daily protocol."
          action={
            <button type="button" className="primary-button w-full sm:w-auto" onClick={addGoal}>
              <Plus size={17} aria-hidden="true" />
              Add Goal
            </button>
          }
        />
      </ModuleShell>

      <div className="grid gap-4">
        {goals.map((goal, index) => (
          <ModuleShell key={goal.id ?? `${goal.category}-${index}`}>
            <div className="grid gap-3 lg:grid-cols-[10rem_1fr]">
              <div className="rounded-md border border-line bg-panel2/70 p-3">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-cyan/25 bg-cyan/10 text-cyan">
                  {goal.status === "Complete" ? <Trophy size={18} aria-hidden="true" /> : <Target size={18} aria-hidden="true" />}
                </div>
                <label className="grid gap-2">
                  <span className="label">Category</span>
                  <input className="field" value={goal.category} onChange={(e) => update(index, { category: e.target.value })} />
                </label>
                <div className="mt-3 grid gap-2">
                  <div className="signal-chip">
                    <CalendarDays size={15} aria-hidden="true" />
                    {goal.deadline || "No deadline"}
                  </div>
                  <div className="signal-chip">{goal.status}</div>
                </div>
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
                <button type="button" className="secondary-button w-full sm:w-fit" onClick={() => persist(goal, index)}>
                  <Save size={17} aria-hidden="true" />
                  {savedId === goal.id ? "Saved" : "Save Goal"}
                </button>
              </div>
            </div>
          </ModuleShell>
        ))}
      </div>
    </AppShell>
  );
}
