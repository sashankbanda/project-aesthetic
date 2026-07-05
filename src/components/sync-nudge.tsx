"use client";
// Quiet "back up your progress" nudge for signed-out explorers.
// Renders nothing when auth isn't configured, when signed in,
// or after the user dismisses it (remembered on this device).
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { CloudUpload, X } from "lucide-react";
import { useAuthEnabled } from "./auth-provider";
import { Card } from "./ui";

const DISMISS_KEY = "aesthetic-sync-nudge-dismissed";

function NudgeInner() {
  const { status } = useSession();
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(DISMISS_KEY) === "1",
  );
  if (status !== "unauthenticated" || dismissed) return null;

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <Card className="mt-4 flex items-center gap-3.5 !p-4">
      <CloudUpload size={17} className="shrink-0 text-dim" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">Tracking progress? Back it up.</div>
        <div className="text-[11px] font-light text-faint">
          Your data lives only on this device — sign in to sync it.
        </div>
      </div>
      <button
        onClick={() => void signIn("google")}
        className="bg-grad pressable shrink-0 rounded-full px-4 py-2 text-xs font-medium text-white"
      >
        Sign in
      </button>
      <button onClick={dismiss} aria-label="dismiss" className="pressable shrink-0 p-1 text-faint">
        <X size={15} />
      </button>
    </Card>
  );
}

export default function SyncNudge() {
  const enabled = useAuthEnabled();
  if (!enabled) return null;
  return <NudgeInner />;
}
