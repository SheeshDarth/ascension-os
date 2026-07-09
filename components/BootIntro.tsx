"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AscensionLogo } from "@/components/AscensionVisuals";
import { hapticImpact } from "@/lib/haptics";

const BOOT_KEY = "ascensionos.boot_seen.v1";

const bootLines = [
  "Identity ledger online",
  "Memory graph synchronized",
  "Proof protocol armed",
  "AscensionOS ready"
];

export function BootIntro() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(BOOT_KEY)) return;
    setVisible(true);
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(BOOT_KEY, "true");
      setVisible(false);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, []);

  function close() {
    hapticImpact(8);
    window.localStorage.setItem(BOOT_KEY, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-void/96 px-4 backdrop-blur-xl" role="dialog" aria-modal="true">
      <div className="os-frame w-full max-w-sm p-5">
        <AscensionLogo animated />
        <div className="mt-6 grid gap-3">
          {bootLines.map((line, index) => (
            <div key={line} className="boot-line flex items-center justify-between gap-3 rounded-md border border-line bg-panel2/60 px-3 py-2 text-sm text-muted" style={{ animationDelay: `${index * 180}ms` }}>
              <span>{line}</span>
              <span className="text-cyan">OK</span>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button type="button" className="secondary-button" onClick={close}>
            Skip
          </button>
          <Link href="/dashboard" className="primary-button" onClick={close}>
            Enter now
          </Link>
        </div>
      </div>
    </div>
  );
}
