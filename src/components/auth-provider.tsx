"use client";
// Wraps the app in SessionProvider only when auth is configured,
// and runs the sync agent for signed-in users. With no env vars
// the app is pure local-first and none of this mounts.
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { onStateChange } from "@/lib/store";
import { schedulePush, syncNow } from "@/lib/sync";

const AuthEnabledContext = createContext(false);
export const useAuthEnabled = () => useContext(AuthEnabledContext);

/** Signed-in: initial sync, then debounced push after every local edit. */
function SyncAgent() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    void syncNow();
    const unsubscribe = onStateChange(() => schedulePush());
    const onOnline = () => void syncNow();
    window.addEventListener("online", onOnline);
    return () => {
      unsubscribe();
      window.removeEventListener("online", onOnline);
    };
  }, [status]);

  return null;
}

export default function AuthProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  if (!enabled) {
    return <AuthEnabledContext.Provider value={false}>{children}</AuthEnabledContext.Provider>;
  }
  return (
    <AuthEnabledContext.Provider value={true}>
      <SessionProvider>
        <SyncAgent />
        {children}
      </SessionProvider>
    </AuthEnabledContext.Provider>
  );
}
