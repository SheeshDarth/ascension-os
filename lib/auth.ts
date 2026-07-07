"use client";

import { supabase } from "@/lib/supabase";

export function authEnabled() {
  return Boolean(supabase);
}

export async function signInWithMagicLink(email: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });
  if (error) throw new Error(error.message);
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error("Supabase is not configured.");
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo }
  });
  if (error) throw new Error(error.message);
}

export async function getAccessToken() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session?.access_token ?? null;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSessionUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
}
