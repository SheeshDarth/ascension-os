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
      {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase text-cyan">{eyebrow}</p> : null}
      <h1 className="text-2xl font-semibold text-text sm:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{subtitle}</p> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel p-4 ${className}`}>{children}</section>;
}

export function Metric({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel2 p-3">
      <div className="text-xs uppercase text-ghost">{label}</div>
      <div className="mt-1 text-xl font-semibold text-text">{value}</div>
      {detail ? <div className="mt-1 text-xs text-muted">{detail}</div> : null}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-panel/60 p-5 text-sm text-muted">
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
