"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, Radio, Shield, Sparkles, Zap } from "lucide-react";
import {
  AscensionLogo,
  MatrixBar,
  MiniMemoryGraph,
  ProgressIntelligence,
  ProtocolTile,
  ScoreRing,
  SignalChip,
  SystemFrame,
  moduleTiles
} from "@/components/AscensionVisuals";
import { BootIntro } from "@/components/BootIntro";
import { hapticImpact } from "@/lib/haptics";

export default function LandingPage() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(window.navigator.onLine);
    const sync = () => setOnline(window.navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <main className="relative min-h-dvh overflow-x-hidden text-text">
      <BootIntro />
      <section className="relative mx-auto grid min-h-dvh w-full max-w-7xl content-between gap-8 px-3 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5 lg:px-8">
        <header className="relative z-10 flex min-h-14 items-center justify-between gap-3">
          <AscensionLogo />
          <Link href="/dashboard" className="secondary-button px-3" onClick={() => hapticImpact(8)}>
            Enter
          </Link>
        </header>

        <div className="relative z-10 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="grid gap-5">
            <div className="flex flex-wrap gap-2">
              <SignalChip icon={Radio}>{online ? "Online sync ready" : "Offline shell active"}</SignalChip>
              <SignalChip icon={Shield}>Private self-use</SignalChip>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan">Proof over potential</p>
              <h1 className="mt-3 max-w-3xl text-[2.55rem] font-semibold leading-[0.98] text-text sm:text-6xl lg:text-7xl">
                Your private growth operating system.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                A tactical cockpit for discipline, dopamine, physique, career, and self-respect. Log proof, read the pattern, adjust the next move.
              </p>
            </div>
            <div className="grid gap-2 sm:max-w-md sm:grid-cols-2">
              <Link href="/dashboard" className="primary-button w-full" onClick={() => hapticImpact(12)}>
                Enter Cockpit
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/checkin" className="secondary-button w-full" onClick={() => hapticImpact(10)}>
                Log Proof
                <Zap size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className="micro-panel max-w-xl">
              <div className="flex items-start gap-3">
                <Download size={18} className="mt-0.5 shrink-0 text-cyan" aria-hidden="true" />
                <p className="text-sm leading-6 text-muted">
                  APK mode path: install this as a standalone PWA now. Later, wrap the same app with Trusted Web Activity or Capacitor without rewriting the cockpit.
                </p>
              </div>
            </div>
          </div>

          <SystemFrame className="launch-cockpit p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
              <div className="grid content-start gap-4">
                <ScoreRing value={72} />
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="micro-panel">
                    <p className="text-[0.65rem] uppercase tracking-[0.14em] text-ghost">Streak</p>
                    <p className="mt-1 text-2xl font-semibold text-text">11</p>
                  </div>
                  <div className="micro-panel">
                    <p className="text-[0.65rem] uppercase tracking-[0.14em] text-ghost">Tier</p>
                    <p className="mt-1 text-2xl font-semibold text-cyan">III</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="micro-panel">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ghost">Personality matrix</p>
                    <Sparkles size={15} className="text-cyan" aria-hidden="true" />
                  </div>
                  <div className="grid gap-3">
                    <MatrixBar label="Discipline" value={68} icon={Shield} />
                    <MatrixBar label="Career" value={74} icon={Zap} />
                    <MatrixBar label="Dopamine" value={82} icon={Radio} />
                    <MatrixBar label="Physique" value={59} icon={Sparkles} />
                  </div>
                </div>
                <MiniMemoryGraph />
              </div>
            </div>
          </SystemFrame>
        </div>

        <div className="relative z-10 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {moduleTiles.map((tile) => (
              <ProtocolTile key={tile.title} {...tile} />
            ))}
          </div>
          <SystemFrame className="p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-text">Progress intelligence layer</p>
                <p className="mt-1 text-xs leading-5 text-muted">Reference-informed growth visuals, tailored to AscensionOS.</p>
              </div>
              <SignalChip icon={Sparkles}>AntV-ready concepts</SignalChip>
            </div>
            <ProgressIntelligence />
          </SystemFrame>
        </div>
      </section>
    </main>
  );
}
