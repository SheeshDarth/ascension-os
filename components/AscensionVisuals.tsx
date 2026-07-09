import type { ReactNode } from "react";
import { Activity, BarChart3, Brain, CalendarCheck2, Database, Flame, Shield, Sparkles, Zap } from "lucide-react";

type IconType = typeof Sparkles;

export function AscensionLogo({ compact = false, animated = false }: { compact?: boolean; animated?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${animated ? "logo-breathe" : ""}`}>
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-cyan/35 bg-cyan/10 shadow-signal">
        <svg viewBox="0 0 64 64" className="h-9 w-9" role="img" aria-label="AscensionOS mark">
          <path d="M12 46 32 10l20 36H42L32 27 22 46H12Z" fill="#A5F3FC" />
          <path d="M24 50h16l-8-15-8 15Z" fill="#6EE7B7" />
          <path d="M17 55h30" stroke="#C4B5FD" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-void bg-emerald" />
      </div>
      {compact ? null : (
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text">AscensionOS</p>
          <p className="text-xs text-ghost">Private growth operating system</p>
        </div>
      )}
    </div>
  );
}

export function SystemFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`os-frame ${className}`}>
      <div className="relative z-10">{children}</div>
    </section>
  );
}

export function SignalChip({ icon: Icon = Sparkles, children }: { icon?: IconType; children: ReactNode }) {
  return (
    <span className="signal-chip">
      <Icon size={14} aria-hidden="true" />
      {children}
    </span>
  );
}

export function ScoreRing({ value, label = "Execution", size = "lg" }: { value: number; label?: string; size?: "md" | "lg" }) {
  const score = Math.max(0, Math.min(100, value));
  const box = size === "lg" ? "w-52" : "w-32";
  const scoreText = size === "lg" ? "text-6xl" : "text-4xl";
  return (
    <div
      className={`ring-pulse mx-auto flex aspect-square ${box} items-center justify-center rounded-full p-3`}
      style={{
        background: `conic-gradient(from 205deg, #6EE7B7 0deg, #A5F3FC ${score * 3.6}deg, rgba(29, 49, 56, 0.9) ${score * 3.6}deg 360deg)`
      }}
      role="img"
      aria-label={`${label} score ${score} out of 100`}
    >
      <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-line bg-void text-center shadow-signal">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ghost">{label}</span>
        <span className={`${scoreText} mt-1 font-semibold tabular-nums text-text`}>{score}</span>
        <span className="mt-1 text-xs text-muted">/100</span>
      </div>
    </div>
  );
}

export function MatrixBar({ label, value, icon: Icon = Activity }: { label: string; value: number; icon?: IconType }) {
  const score = Math.max(0, Math.min(100, value));
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium text-text">
          <Icon size={14} className="text-cyan" aria-hidden="true" />
          {label}
        </span>
        <span className="tabular-nums text-muted">{score}</span>
      </div>
      <div className="progress-rail" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function ProtocolTile({
  icon: Icon,
  title,
  detail,
  signal
}: {
  icon: IconType;
  title: string;
  detail: string;
  signal: string;
}) {
  return (
    <div className="protocol-tile">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-cyan/25 bg-cyan/10 text-cyan">
          <Icon size={18} aria-hidden="true" />
        </div>
        <span className="rounded-md border border-line bg-black/25 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ghost">
          {signal}
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-text">{title}</p>
      <p className="mt-2 text-xs leading-5 text-muted">{detail}</p>
    </div>
  );
}

export function MiniMemoryGraph() {
  const points = "0,72 14,60 28,64 42,38 56,45 70,24 84,30 100,18";
  return (
    <div className="micro-panel">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ghost">Memory graph</p>
        <BarChart3 size={15} className="text-cyan" aria-hidden="true" />
      </div>
      <svg viewBox="0 0 100 80" className="h-28 w-full overflow-visible" role="img" aria-label="Rising execution memory graph preview">
        {[20, 40, 60].map((line) => (
          <line key={line} x1="0" x2="100" y1={line} y2={line} stroke="#1D3138" strokeWidth="0.8" />
        ))}
        <polyline points={points} fill="none" stroke="#A5F3FC" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
        {points.split(" ").map((point) => {
          const [x, y] = point.split(",");
          return <circle key={point} cx={x} cy={y} r="2.7" fill="#6EE7B7" vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <p className="mt-2 text-xs text-muted">Pattern recall across discipline, dopamine, physique, and work.</p>
    </div>
  );
}

export function ProgressIntelligence() {
  return (
    <div className="grid gap-3 lg:grid-cols-5">
      <VisualCard title="Tier ladder" icon={Sparkles}>
        <div className="grid gap-2">
          {["Base", "Locked", "Sharp", "Ascendant"].map((tier, index) => (
            <div key={tier} className={`rounded-md border px-3 py-2 text-xs ${index === 2 ? "border-cyan/45 bg-cyan/10 text-cyan" : "border-line bg-panel2/60 text-muted"}`}>
              {tier}
            </div>
          ))}
        </div>
      </VisualCard>
      <VisualCard title="Radar matrix" icon={Activity}>
        <svg viewBox="0 0 100 100" className="h-32 w-full" role="img" aria-label="Personality radar matrix preview">
          <polygon points="50,8 88,36 74,84 26,84 12,36" fill="none" stroke="#1D3138" />
          <polygon points="50,20 76,40 66,72 32,74 24,42" fill="rgba(165,243,252,0.18)" stroke="#A5F3FC" />
          <circle cx="50" cy="50" r="3" fill="#6EE7B7" />
        </svg>
      </VisualCard>
      <VisualCard title="Habit loop" icon={Zap}>
        <div className="grid gap-2 text-xs text-muted">
          {["Trigger", "Proof", "Reward", "Identity"].map((step) => (
            <div key={step} className="rounded-md border border-line bg-panel2/60 px-3 py-2">{step}</div>
          ))}
        </div>
      </VisualCard>
      <VisualCard title="Timeline" icon={CalendarCheck2}>
        <div className="relative grid gap-3 pl-4 text-xs text-muted before:absolute before:bottom-2 before:left-1 before:top-2 before:w-px before:bg-cyan/35">
          {["Log", "Review", "Adapt", "Compound"].map((step) => (
            <div key={step} className="relative before:absolute before:-left-[1.12rem] before:top-1 before:h-2 before:w-2 before:rounded-full before:bg-emerald">{step}</div>
          ))}
        </div>
      </VisualCard>
      <VisualCard title="Risk map" icon={Flame}>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span className="rounded-md border border-emerald/30 bg-emerald/10 p-2 text-emerald">Stable</span>
          <span className="rounded-md border border-amber/30 bg-amber/10 p-2 text-amber">Watch</span>
          <span className="rounded-md border border-cyan/30 bg-cyan/10 p-2 text-cyan">Focus</span>
          <span className="rounded-md border border-red-900/70 bg-red-950/30 p-2 text-red-200">Leak</span>
        </div>
      </VisualCard>
    </div>
  );
}

function VisualCard({ title, icon: Icon, children }: { title: string; icon: IconType; children: ReactNode }) {
  return (
    <div className="micro-panel">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ghost">{title}</p>
        <Icon size={14} className="text-cyan" aria-hidden="true" />
      </div>
      {children}
    </div>
  );
}

export const moduleTiles = [
  {
    icon: CalendarCheck2,
    title: "Daily Proof",
    detail: "Capture the actual day before memory edits the story.",
    signal: "Input"
  },
  {
    icon: BarChart3,
    title: "Memory Graph",
    detail: "Turn scattered logs into visible performance patterns.",
    signal: "Recall"
  },
  {
    icon: Brain,
    title: "Weekly Analysis",
    detail: "Compress the week into patterns, risks, and next moves.",
    signal: "Review"
  },
  {
    icon: Database,
    title: "Local Backup",
    detail: "Keep your proof trail usable even without cloud sync.",
    signal: "Offline"
  },
  {
    icon: Sparkles,
    title: "AI Performance",
    detail: "Optional Gemini analysis with deterministic fallback.",
    signal: "AI"
  },
  {
    icon: Shield,
    title: "Dopamine Firewall",
    detail: "Track leaks, boundaries, and attention recovery.",
    signal: "Guard"
  }
];
