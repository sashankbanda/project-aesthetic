"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Camera,
  ChartNoAxesColumn,
  Download,
  Dumbbell,
  Flame,
  House,
  LayoutGrid,
  Map,
  Moon,
  NotebookPen,
  Ruler,
  Trophy,
  Upload,
} from "lucide-react";
import { exportState, importState } from "@/lib/store";

/** Bottom tab bar — the app's primary navigation. */
const TABS = [
  { href: "/", icon: House, label: "Home" },
  { href: "/workout", icon: Dumbbell, label: "Train" },
  { href: "/nutrition", icon: Flame, label: "Fuel" },
  { href: "/body", icon: ChartNoAxesColumn, label: "Progress" },
  { href: "/more", icon: LayoutGrid, label: "More" },
] as const;

/** Full navigation — desktop sidebar. */
const NAV = [
  { href: "/", icon: House, label: "Home" },
  { href: "/workout", icon: Dumbbell, label: "Train" },
  { href: "/nutrition", icon: Flame, label: "Fuel" },
  { href: "/body", icon: Ruler, label: "My Body" },
  { href: "/analytics", icon: ChartNoAxesColumn, label: "Analytics" },
  { href: "/photos", icon: Camera, label: "Photos" },
  { href: "/roadmap", icon: Map, label: "Roadmap" },
  { href: "/recovery", icon: Moon, label: "Recovery" },
  { href: "/journal", icon: NotebookPen, label: "Journal" },
  { href: "/achievements", icon: Trophy, label: "Achievements" },
  { href: "/library", icon: BookOpen, label: "Library" },
] as const;

/** Which tab lights up for a given route. */
function activeTab(pathname: string): string {
  if (pathname === "/") return "/";
  if (pathname.startsWith("/workout")) return "/workout";
  if (pathname.startsWith("/nutrition")) return "/nutrition";
  if (["/body", "/photos", "/analytics"].some((p) => pathname.startsWith(p))) return "/body";
  return "/more";
}

export function doExport() {
  const blob = new Blob([exportState()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `aesthetic-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function doImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (!importState(text)) alert("That file doesn't look like an Aesthetic backup.");
  };
  input.click();
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = activeTab(pathname);

  return (
    <div className="flex min-h-dvh">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 flex-col gap-1 border-r border-line/50 bg-elev/80 p-5 backdrop-blur-md md:flex">
        <div className="mb-6 flex items-center gap-3 px-2 pt-1">
          <div className="relative grid h-10 w-10 place-items-center rounded-2xl border border-line bg-card">
            <Dumbbell size={17} strokeWidth={2} className="text-ink" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
          </div>
          <div>
            <div className="text-sm font-medium tracking-tight">Aesthetic</div>
            <div className="label-mono text-[9px] text-faint">Personal coach</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto pr-1">
          {NAV.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`pressable flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-card2 font-medium text-ink"
                    : "font-light text-dim hover:bg-card hover:text-ink"
                }`}
              >
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex gap-2 border-t border-line/50 pt-4">
          <button
            onClick={doExport}
            className="pressable flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line/70 px-3 py-2 text-xs font-medium text-dim transition hover:text-ink"
          >
            <Download size={13} /> Backup
          </button>
          <button
            onClick={doImport}
            className="pressable flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line/70 px-3 py-2 text-xs font-medium text-dim transition hover:text-ink"
          >
            <Upload size={13} /> Restore
          </button>
        </div>
      </aside>

      {/* content */}
      <main
        key={pathname}
        className="view-in pt-safe mx-auto w-full max-w-5xl flex-1 px-5 pb-36 pt-5 md:px-12 md:pb-20 md:pt-12"
      >
        {children}
      </main>

      {/* bottom fade — content dissolves cleanly behind the floating nav */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-36 bg-gradient-to-t from-bg from-30% via-bg/85 via-60% to-transparent md:hidden" />

      {/* floating pill tab bar — mobile only */}
      <nav className="fixed inset-x-0 bottom-0 z-50 px-5 pb-[max(env(safe-area-inset-bottom),14px)] md:hidden">
        <div className="glass mx-auto flex max-w-sm items-stretch justify-around rounded-full border border-line/70 px-2 py-1 shadow-2xl shadow-black/70">
          {TABS.map(({ href, icon: Icon, label }) => {
            const isActive = active === href;
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="pressable relative flex min-w-14 flex-col items-center gap-1 rounded-full px-2 pb-2 pt-2.5"
              >
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  className={isActive ? "text-ink" : "text-faint"}
                />
                <span
                  className={`h-1 w-1 rounded-full transition ${
                    isActive ? "bg-accent" : "bg-transparent"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
