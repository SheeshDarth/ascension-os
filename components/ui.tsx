import type { ReactNode } from "react";

export function PageTitle({
  eyebrow,
  title,
  subtitle
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">{eyebrow}</p> : null}
      <h1 className="max-w-3xl text-[2rem] font-semibold leading-tight text-text sm:text-4xl">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{subtitle}</p> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel p-4 ${className}`}><div className="relative z-10">{children}</div></section>;
}

export function Metric({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) {
  return (
    <div className="micro-panel">
      <div className="text-[0.68rem] uppercase tracking-[0.12em] text-ghost">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-text">{value}</div>
      {detail ? <div className="mt-1 text-xs text-muted">{detail}</div> : null}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-panel/60 p-5 text-sm leading-6 text-muted">
      {children}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-red-900/70 bg-red-950/30 p-4 text-sm text-red-200" role="alert">
      {message}
    </div>
  );
}
