"use client";
// Account & sync card for the More screen.
// Three states: auth not configured · signed out · signed in.
import { useSyncExternalStore } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { CloudOff, LogIn, LogOut, RefreshCw } from "lucide-react";
import { Card } from "./ui";
import { useAuthEnabled } from "./auth-provider";
import { getSyncStatus, subscribeSyncStatus, syncNow } from "@/lib/sync";

function SyncStatusLine() {
  const status = useSyncExternalStore(subscribeSyncStatus, getSyncStatus, getSyncStatus);
  const label =
    status.state === "syncing"
      ? "Syncing…"
      : status.state === "error"
        ? `Sync issue — ${status.detail ?? "will retry"}`
        : status.state === "offline"
          ? "Offline — will sync when back"
          : status.lastSyncedAt
            ? `Synced ${new Date(status.lastSyncedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
            : "Not synced yet";
  return (
    <span className={`text-xs ${status.state === "error" ? "text-warn" : "text-faint"}`}>{label}</span>
  );
}

function SignedIn() {
  const { data } = useSession();
  const user = data?.user;
  return (
    <Card className="flex items-center gap-3.5 !p-4">
      {user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt="" className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <div className="grid h-10 w-10 place-items-center rounded-full bg-card2 text-sm font-bold">
          {user?.name?.[0] ?? "U"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{user?.name ?? "Signed in"}</div>
        <SyncStatusLine />
      </div>
      <button
        onClick={() => void syncNow()}
        aria-label="Sync now"
        className="pressable grid h-9 w-9 place-items-center rounded-full border border-line text-dim"
      >
        <RefreshCw size={15} />
      </button>
      <button
        onClick={() => void signOut()}
        aria-label="Sign out"
        className="pressable grid h-9 w-9 place-items-center rounded-full border border-line text-dim"
      >
        <LogOut size={15} />
      </button>
    </Card>
  );
}

function SignedOut() {
  return (
    <Card className="flex items-center gap-3.5 !p-4">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold">Cloud sync</div>
        <div className="text-xs text-faint">Sign in to back up and sync across devices</div>
      </div>
      <button
        onClick={() => void signIn("google")}
        className="bg-grad pressable flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/25"
      >
        <LogIn size={15} /> Sign in with Google
      </button>
    </Card>
  );
}

function AccountInner() {
  const { status } = useSession();
  if (status === "loading") return null;
  return status === "authenticated" ? <SignedIn /> : <SignedOut />;
}

export default function AccountCard() {
  const enabled = useAuthEnabled();
  if (!enabled) {
    return (
      <Card className="flex items-center gap-3.5 !p-4 opacity-70">
        <CloudOff size={17} className="shrink-0 text-faint" />
        <div className="text-xs leading-relaxed text-faint">
          Cloud sync isn&apos;t set up yet — your data lives safely on this device.
          See SETUP.md to enable Google sign-in and cross-device sync.
        </div>
      </Card>
    );
  }
  return <AccountInner />;
}
