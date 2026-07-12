"use client";

import { Download, ShieldCheck, WifiOff, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { APP_BUILD_VERSION } from "@/lib/deployment";
import { hapticImpact } from "@/lib/haptics";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const installDismissedKey = "ascensionos.install_dismissed.v1";

function isStandalone() {
  if (typeof window === "undefined") return false;
  const iosNavigator = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(iosNavigator.standalone);
}

export function PwaRuntime() {
  const pathname = usePathname();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [online, setOnline] = useState(true);
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    setOnline(window.navigator.onLine);
    setInstalled(isStandalone());
    setDismissed(window.localStorage.getItem(installDismissedKey) === "true");

    const syncOnline = () => setOnline(window.navigator.onLine);
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setDismissed(window.localStorage.getItem(installDismissedKey) === "true");
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      window.localStorage.setItem(installDismissedKey, "true");
      hapticImpact(14);
    };

    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator && (window.location.protocol === "https:" || window.location.hostname === "localhost")) {
      navigator.serviceWorker
        .register(`/sw.js?v=${encodeURIComponent(APP_BUILD_VERSION)}`)
        .then(() => setSwReady(true))
        .catch(() => setSwReady(false));
    }

    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const showInstall = Boolean(installPrompt && !dismissed && !installed);
  const bottomClass = useMemo(() => {
    const inAppShell = pathname !== "/";
    return inAppShell ? "bottom-[5.85rem] md:bottom-4" : "bottom-4";
  }, [pathname]);

  async function installApp() {
    if (!installPrompt) return;
    hapticImpact(12);
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      window.localStorage.setItem(installDismissedKey, "true");
      setInstalled(true);
    }
    setInstallPrompt(null);
  }

  function dismissInstall() {
    hapticImpact(6);
    window.localStorage.setItem(installDismissedKey, "true");
    setDismissed(true);
  }

  return (
    <>
      {!online ? (
        <div className="fixed left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-md border border-amber/35 bg-[#161105]/95 px-3 py-2 text-sm text-amber shadow-signal backdrop-blur-xl" role="status">
          <WifiOff size={17} aria-hidden="true" />
          <span className="min-w-0">Offline shell active. Local proof stays available.</span>
        </div>
      ) : null}

      {showInstall ? (
        <aside
          className={`fixed left-3 right-3 ${bottomClass} z-50 mx-auto max-w-md rounded-lg border border-cyan/35 bg-void/96 p-3 text-text shadow-signal backdrop-blur-xl`}
          aria-label="Install AscensionOS"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-cyan/30 bg-cyan/10 text-cyan">
              <Download size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-text">Install cockpit mode</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Standalone launch, phone shortcuts, and an offline fallback shell.
                  </p>
                </div>
                <button type="button" className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-ghost transition hover:bg-panel2 hover:text-text" onClick={dismissInstall} aria-label="Dismiss install prompt">
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <button type="button" className="primary-button min-h-11 px-3" onClick={installApp}>
                  Install
                </button>
                <span className="signal-chip min-h-11">
                  <ShieldCheck size={15} aria-hidden="true" />
                  {swReady ? "PWA ready" : "Preparing"}
                </span>
              </div>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}
