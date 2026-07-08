"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { SyncStatus } from "@/components/SyncStatus";
import { authEnabled, getSessionUser, signOut } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/checkin", label: "Check-in" },
  { href: "/memory-graph", label: "Graph" },
  { href: "/weekly-review", label: "Review" },
  { href: "/history", label: "History" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!authEnabled()) return;
    getSessionUser()
      .then((user) => setEmail(user?.email ?? null))
      .catch(() => setEmail(null));
  }, []);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-dvh pb-24 text-text md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-void/86 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="min-h-11 py-1" aria-label="AscensionOS dashboard">
            <div className="text-sm font-semibold uppercase text-text">AscensionOS</div>
            <div className="text-xs text-ghost">Proof over potential.</div>
          </Link>
          <div className="flex items-center gap-2">
            {authEnabled() ? (
              email ? (
                <button type="button" className="secondary-button px-3" onClick={handleSignOut}>
                  Sign out
                </button>
              ) : (
                <Link href="/login" className="secondary-button px-3">
                  Login
                </Link>
              )
            ) : null}
            <Link href="/settings" className="secondary-button px-3" aria-label="Open settings">
              Settings
            </Link>
          </div>
        </div>
        <SyncStatus />
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-5 md:grid-cols-[13rem_1fr] md:py-8">
        <aside className="hidden md:block">
          <nav className="sticky top-24 grid gap-2">
            {[...nav, { href: "/goals", label: "Goals" }, { href: "/settings", label: "Settings" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-11 rounded-md border px-3 py-2 text-sm transition ${
                  pathname === item.href
                    ? "border-cyan/40 bg-cyan/10 text-cyan"
                    : "border-transparent text-muted hover:border-line hover:bg-panel"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-void/92 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 items-center justify-center rounded-md px-1 text-center text-[0.72rem] font-medium transition ${
                pathname === item.href ? "bg-cyan/12 text-cyan" : "text-ghost active:bg-panel2"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
