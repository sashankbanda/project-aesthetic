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
const HOUR_KEY = "aesthetic-reminder-hour";
const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22];

const fmtHour = (h: number) =>
  h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`;

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
  const [hour, setHour] = useState(() => {
    if (typeof window === "undefined") return 18;
    const h = parseInt(window.localStorage.getItem(HOUR_KEY) ?? "18", 10);
    return Number.isFinite(h) && h >= 0 && h <= 23 ? h : 18;
  });

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
        body: JSON.stringify({ ...sub.toJSON(), reminderHour: hour }),
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

  const pickHour = async (h: number) => {
    setHour(h);
    window.localStorage.setItem(HOUR_KEY, String(h));
    if (!enabled) return;
    // already subscribed — update the stored preference server-side
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...sub.toJSON(), reminderHour: h }),
        });
      }
    } catch {
      setError("Couldn't save the new time — try again.");
    }
  };

  return (
    <Card className="mb-4 !p-4">
      <div className="flex items-center gap-3.5">
        <BellRing size={17} className="shrink-0 text-dim" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium">Workout reminders</div>
          <div className="text-[11px] font-light text-faint">
            {error ?? `One nudge at ${fmtHour(hour)} on training days you haven't logged.`}
          </div>
        </div>
        <Switch
          checked={!!enabled}
          disabled={busy || enabled === null}
          label="workout reminders"
          onChange={(v) => (v ? enable() : disable())}
        />
      </div>
      {enabled && (
        <div className="mt-3 border-t border-line/40 pt-3">
          <div className="label-mono mb-2 text-[9px] text-faint">Remind me at</div>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {HOURS.map((h) => (
              <button
                key={h}
                onClick={() => void pickHour(h)}
                className={`pressable h-9 shrink-0 rounded-xl border px-3 text-xs font-bold tabular-nums ${
                  hour === h ? "border-accent/40 bg-accent/15 text-ink" : "border-line bg-elev text-faint"
                }`}
              >
                {fmtHour(h)}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function RemindersCard() {
  const authEnabled = useAuthEnabled();
  if (!authEnabled) return null;
  return <RemindersInner />;
}
