"use client";
// Install nudge — push notifications on iPhone only work AFTER the app
// is added to the Home Screen, and browsers never say so. One dismissible
// banner: iOS gets the Share → Add to Home Screen steps, Chromium gets a
// real install button via beforeinstallprompt. Hidden when already
// installed (standalone) or previously dismissed.
import { useEffect, useRef, useState } from "react";
import { Share, SquarePlus, X } from "lucide-react";

const DISMISS_KEY = "aesthetic-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export default function InstallNudge() {
  const [mode, setMode] = useState<"ios" | "prompt" | null>(null);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone);
    if (standalone || localStorage.getItem(DISMISS_KEY)) return;

    const decide = () => {
      // iPadOS 13+ reports as Mac — the touch check catches it
      const ios =
        /iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (navigator.userAgent.includes("Mac") && navigator.maxTouchPoints > 1);
      if (ios) setMode("ios");
    };
    decide();

    const onPrompt = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setMode("prompt");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!mode) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setMode(null);
  };

  return (
    <div className="card relative mt-4 flex items-start gap-3 !p-4">
      <SquarePlus size={16} className="mt-0.5 shrink-0 text-accent2" />
      <div className="min-w-0 flex-1 text-[12px] font-light leading-relaxed text-dim">
        {mode === "ios" ? (
          <>
            <span className="font-semibold text-ink">Install the app</span> to unlock reminders and
            full-screen: tap <Share size={12} className="inline text-ink" /> Share, then{" "}
            <span className="text-ink">Add to Home Screen</span>.
          </>
        ) : (
          <>
            <span className="font-semibold text-ink">Install the app</span> — full-screen, its own
            icon, and it works offline in the gym.
            <button
              onClick={() => {
                promptRef.current?.prompt();
                dismiss();
              }}
              className="pressable mt-2 block rounded-full bg-grad px-4 py-1.5 text-xs font-bold text-white"
            >
              Install
            </button>
          </>
        )}
      </div>
      <button
        aria-label="dismiss install hint"
        onClick={dismiss}
        className="pressable shrink-0 p-1 text-faint"
      >
        <X size={14} />
      </button>
    </div>
  );
}
