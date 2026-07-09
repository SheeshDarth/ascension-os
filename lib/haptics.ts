"use client";

export function hapticImpact(duration = 10) {
  if (typeof window === "undefined") return;
  if ("vibrate" in window.navigator) {
    try {
      window.navigator.vibrate(duration);
    } catch {
      // Haptics are optional and unsupported on many browsers.
    }
  }
}
