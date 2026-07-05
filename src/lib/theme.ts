// ============================================================
// Theme — dark (default) / light / follow-system.
// No "use client" here on purpose: the layout (a server
// component) imports THEME_INIT_SCRIPT; browser APIs are only
// touched inside functions that run on the client.
// The chosen mode lives in localStorage on this device only;
// THEME_INIT_SCRIPT applies it before first paint so there is
// never a wrong-theme flash. Everything renders off CSS tokens,
// so switching is just flipping <html data-theme>.
// ============================================================

export type ThemeMode = "system" | "dark" | "light";

const KEY = "aesthetic-theme";
const META_COLOR: Record<"dark" | "light", string> = {
  dark: "#0a0a09",
  light: "#f1f1ed",
};

/** Inline <script> for the root layout — runs before hydration. */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem("${KEY}");var t=m==="light"||m==="dark"?m:(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=t;var el=document.querySelector('meta[name="theme-color"]');if(el)el.setAttribute("content",t==="light"?"${META_COLOR.light}":"${META_COLOR.dark}");}catch(e){}})();`;

const listeners = new Set<() => void>();

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(KEY);
  return v === "light" || v === "dark" ? v : "system";
}

function resolve(mode: ThemeMode): "dark" | "light" {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(mode: ThemeMode) {
  const theme = resolve(mode);
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", META_COLOR[theme]);
}

export function setThemeMode(mode: ThemeMode) {
  if (mode === "system") window.localStorage.removeItem(KEY);
  else window.localStorage.setItem(KEY, mode);
  apply(mode);
  listeners.forEach((l) => l());
}

/** For useSyncExternalStore — re-applies when the OS theme changes too. */
export function subscribeTheme(cb: () => void): () => void {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const onSystem = () => {
    if (getThemeMode() === "system") apply("system");
    cb();
  };
  mq.addEventListener("change", onSystem);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", onSystem);
  };
}
