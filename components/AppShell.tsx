"use client";

import Link from "next/link";
import { BarChart3, CalendarCheck2, History, Home, LogIn, LogOut, Settings, Sparkles, Target } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { SyncStatus } from "@/components/SyncStatus";
import { authEnabled, getSessionUser, signOut } from "@/lib/auth";
import { hapticImpact } from "@/lib/haptics";

const nav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/checkin", label: "Proof", icon: CalendarCheck2 },
  { href: "/memory-graph", label: "Graph", icon: BarChart3 },
  { href: "/weekly-review", label: "Review", icon: Sparkles },
  { href: "/history", label: "Ledger", icon: History }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!authEnabled());

  useEffect(() => {
    if (!authEnabled()) {
      setAuthReady(true);
      return;
    }
    getSessionUser()
      .then((user) => {
        if (user) {
          setEmail(user.email ?? null);
          setAuthReady(true);
          return;
        }
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      })
      .catch(() => router.replace(`/login?next=${encodeURIComponent(pathname)}`));
  }, [pathname, router]);

  async function handleSignOut() {
    hapticImpact(8);
    await signOut();
    window.location.href = "/login";
  }

  if (!authReady) {
    return (
      <main className="grid min-h-dvh place-items-center bg-void px-4 text-text">
        <div className="grid max-w-sm gap-3 text-center" aria-live="polite" aria-busy="true">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-md border border-cyan/35 bg-cyan/10 shadow-signal" />
          <p className="text-sm font-semibold">Verifying private access</p>
          <p className="text-sm text-muted">Your cockpit stays locked until the active session is confirmed.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh pb-28 text-text md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-void/86 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="flex min-h-12 items-center gap-3 py-1" aria-label="AscensionOS dashboard">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan/35 bg-cyan/10 text-cyan shadow-signal">
              <Sparkles size={19} aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-text">AscensionOS</div>
              <div className="text-xs text-ghost">Private growth cockpit</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {authEnabled() ? (
              email ? (
                <button type="button" className="secondary-button px-3" onClick={handleSignOut} aria-label="Sign out">
                  <LogOut size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              ) : (
                <Link href="/login" className="secondary-button px-3" onClick={() => hapticImpact(8)}>
                  <LogIn size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              )
            ) : null}
            <Link href="/settings" className="secondary-button px-3" aria-label="Open settings" onClick={() => hapticImpact(8)}>
              <Settings size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>
        <SyncStatus />
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-3 py-4 sm:px-4 md:grid-cols-[13rem_1fr] md:py-8">
        <aside className="hidden md:block">
          <nav className="sticky top-24 grid gap-2">
            {[...nav, { href: "/goals", label: "Goals", icon: Target }, { href: "/settings", label: "Settings", icon: Settings }].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => hapticImpact(6)}
                  className={`flex min-h-12 items-center gap-3 rounded-md border px-3 py-2 text-sm font-medium transition ${
                    pathname === item.href
                      ? "border-cyan/40 bg-cyan/10 text-cyan shadow-signal"
                      : "border-transparent text-muted hover:border-line hover:bg-panel2"
                  }`}
                >
                  <Icon size={17} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-void/94 px-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => hapticImpact(6)}
                className={`flex min-h-14 flex-col items-center justify-center rounded-md px-1 text-center text-[0.68rem] font-semibold transition ${
                  pathname === item.href ? "border border-cyan/30 bg-cyan/12 text-cyan" : "text-ghost active:bg-panel2"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
