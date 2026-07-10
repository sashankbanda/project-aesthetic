"use client";
// Workout reminders — one toggle. Registers the push service worker
// and stores this device's endpoint server-side (signed-in only:
// the daily cron needs your synced plan to know training days).
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BellRing } from "lucide-react";
import { useAuthEnabled } from "./auth-provider";
import { Card, Switch } from "./ui";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function RemindersInner() {
  const { status } = useSession();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker
      .getRegistration("/sw.js")
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => setEnabled(false));
  }, [supported]);

  if (status !== "authenticated" || !supported || !VAPID) return null;

  const enable = async () => {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications are blocked for this site.");
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Couldn't save the subscription — try again.");
      setEnabled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't enable reminders.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
    } catch {
      setError("Couldn't disable — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-4 flex items-center gap-3.5 !p-4">
      <BellRing size={17} className="shrink-0 text-dim" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">Workout reminders</div>
        <div className="text-[11px] font-light text-faint">
          {error ?? "One evening nudge on training days you haven't logged."}
        </div>
      </div>
      <Switch
        checked={!!enabled}
        disabled={busy || enabled === null}
        label="workout reminders"
        onChange={(v) => (v ? enable() : disable())}
      />
    </Card>
  );
}

export default function RemindersCard() {
  const authEnabled = useAuthEnabled();
  if (!authEnabled) return null;
  return <RemindersInner />;
}
