import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SurfaceHeader({
  icon: Icon,
  eyebrow,
  title,
  detail,
  action
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-cyan/30 bg-cyan/10 text-cyan shadow-signal">
          <Icon size={19} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-cyan">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold leading-tight text-text">{title}</h2>
          {detail ? <p className="mt-1 text-sm leading-6 text-muted">{detail}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatusCell({
  label,
  value,
  detail,
  tone = "neutral"
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: "neutral" | "good" | "warn" | "danger";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald/25 bg-emerald/5"
      : tone === "warn"
        ? "border-amber/25 bg-amber/5"
        : tone === "danger"
          ? "border-red-400/30 bg-red-400/10"
          : "border-line bg-panel2/70";

  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ghost">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-text">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-muted">{detail}</p> : null}
    </div>
  );
}

export function ModuleShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`panel p-4 ${className}`}>
      <div className="relative z-10">{children}</div>
    </section>
  );
}
