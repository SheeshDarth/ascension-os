"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Card, ErrorBanner, PageTitle } from "@/components/ui";
import { authEnabled, signInWithGoogle, signInWithMagicLink } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8 text-text">
      <PageTitle
        eyebrow="Private access"
        title="Login"
        subtitle="Use a Supabase magic link to sync AscensionOS across phone and laptop."
      />
      {error ? <ErrorBanner message={error} /> : null}
      <Card>
        {authEnabled() ? (
          <div className="grid gap-4">
            <button className="primary-button w-full" type="button" onClick={googleLogin} disabled={loading}>
              Continue with Google
            </button>
            <div className="h-px bg-line" />
            <form onSubmit={submit} className="grid gap-4">
              <label className="grid gap-2">
                <span className="label">Email magic link fallback</span>
                <input
                  className="field"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <button className="secondary-button w-full" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Magic Link"}
              </button>
              {message ? <p className="text-sm text-emerald" aria-live="polite">{message}</p> : null}
            </form>
          </div>
        ) : (
          <div className="grid gap-3 text-sm text-muted">
            <p>Supabase env vars are missing, so AscensionOS is running in local-only development mode.</p>
            <Link href="/dashboard" className="primary-button">
              Continue Locally
            </Link>
          </div>
        )}
      </Card>
    </main>
  );
}
