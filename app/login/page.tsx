"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Cloud, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { AscensionLogo } from "@/components/AscensionVisuals";
import { ModuleShell, StatusCell, SurfaceHeader } from "@/components/SurfaceModules";
import { ErrorBanner } from "@/components/ui";
import { authEnabled, signInWithGoogle, signInWithMagicLink } from "@/lib/auth";
import { hapticImpact } from "@/lib/haptics";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    hapticImpact(8);
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await signInWithMagicLink(email);
      setMessage("Magic link sent. Open your email and return to AscensionOS.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send magic link.");
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin() {
    hapticImpact(10);
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start Google login.");
      setLoading(false);
    }
  }

  return (
    <main className="relative mx-auto grid min-h-dvh w-full max-w-5xl content-center gap-6 px-4 py-[max(2rem,env(safe-area-inset-top))] text-text sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
      <section className="grid gap-5">
        <AscensionLogo />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan">Private access</p>
          <h1 className="mt-3 text-[2.45rem] font-semibold leading-[0.98] text-text sm:text-6xl">Enter the cockpit.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted">
            Google is the primary gate. Magic link stays available as the backup path for cross-device sync.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:max-w-xl">
          <StatusCell label="Sync" value="Phone + laptop" detail="Supabase-owned rows" tone="good" />
          <StatusCell label="Mode" value="Private" detail="No public sharing" />
          <StatusCell label="Fallback" value="Local" detail="Works without cloud env" tone="warn" />
        </div>
      </section>

      <ModuleShell>
        <SurfaceHeader
          icon={LockKeyhole}
          eyebrow="Access protocol"
          title="Identity verification"
          detail="Unlock cloud sync and AI analysis history with your private account."
        />
        {error ? <div className="mt-4"><ErrorBanner message={error} /></div> : null}
        {authEnabled() ? (
          <div className="mt-5 grid gap-4">
            <button className="primary-button w-full" type="button" onClick={googleLogin} disabled={loading}>
              <ShieldCheck size={17} aria-hidden="true" />
              {loading ? "Opening Google..." : "Continue with Google"}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs uppercase tracking-[0.14em] text-ghost">
              <div className="h-px bg-line" />
              <span>fallback</span>
              <div className="h-px bg-line" />
            </div>
            <form onSubmit={submit} className="grid gap-4">
              <label className="grid gap-2">
                <span className="label">Email magic link</span>
                <input
                  className="field"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <button className="secondary-button w-full" type="submit" disabled={loading}>
                <Mail size={17} aria-hidden="true" />
                {loading ? "Sending..." : "Send Magic Link"}
              </button>
              {message ? <p className="rounded-md border border-emerald/25 bg-emerald/5 p-3 text-sm text-emerald" aria-live="polite">{message}</p> : null}
            </form>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 text-sm text-muted">
            <div className="rounded-md border border-amber/25 bg-amber/5 p-3">
              Supabase env vars are missing, so AscensionOS is running in local-only development mode.
            </div>
            <Link href="/dashboard" className="primary-button" onClick={() => hapticImpact(10)}>
              <Cloud size={17} aria-hidden="true" />
              Continue Locally
            </Link>
          </div>
        )}
      </ModuleShell>
    </main>
  );
}
