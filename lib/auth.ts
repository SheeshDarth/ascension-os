"use client";

import { supabase } from "@/lib/supabase";

export function authEnabled() {
  return Boolean(supabase);
}

function authRedirect(path = "/dashboard") {
  const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
  return typeof window !== "undefined" ? `${window.location.origin}${safePath}` : undefined;
}

export async function signInWithMagicLink(email: string, redirectPath = "/dashboard") {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: authRedirect(redirectPath) }
  });
  if (error) throw new Error(error.message);
}

export async function signInWithGoogle(redirectPath = "/dashboard") {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: authRedirect(redirectPath) }
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
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session?.user ?? null;
}
