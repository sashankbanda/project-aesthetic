"use client";
import Link from "next/link";
import { ChevronRight, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import DotNumber from "./dot-number";

export type TileTone = "dark" | "light" | "accent";
const TILE_CLS: Record<TileTone, string> = {
  dark: "tile-dark",
  light: "tile-light",
  accent: "tile-accent",
};
const TILE_DOT: Record<TileTone, string> = {
  dark: "var(--color-ink)",
  light: "var(--ti-ink)",
  accent: "#ffffff",
};

/**
 * Metric tile with a dot-matrix hero value.
 * Monochrome by default — `accent` is the one loud tile per screen.
 */
export function Tile({
  tone = "dark",
  label,
  value,
  unit,
  sub,
  cell = 7,
  texture = true,
  children,
  className = "",
}: {
  tone?: TileTone;
  label: string;
  /** rendered as dot-matrix — digits, dot, colon, %, dash only */
  value: string | number;
  unit?: string;
  sub?: ReactNode;
  cell?: number;
  texture?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const muted =
    tone === "light" ? "text-(--ti-dim)" : tone === "accent" ? "text-white/60" : "text-dim";
  return (
    <div className={`${TILE_CLS[tone]} p-5 ${className}`}>
      {texture && <div className="dot-texture" />}
      <div className="relative">
        <div className={`label-mono ${muted}`}>{label}</div>
        <div className="mt-3.5 flex items-end gap-2">
          <DotNumber value={value} cell={cell} color={TILE_DOT[tone]} />
          {unit && <span className={`pb-0.5 text-xs font-medium ${muted}`}>{unit}</span>}
        </div>
        {sub && <div className={`mt-2.5 text-[11px] leading-snug ${muted}`}>{sub}</div>}
        {children}
      </div>
    </div>
  );
}

/** Large editorial header — thin type, mono eyebrow with accent tick. */
export function PageHead({ title, sub, eyebrow }: { title: ReactNode; sub?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <div className="label-mono mb-1.5 flex items-center gap-2 text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {eyebrow}
        </div>
      )}
      <h1 className="text-[32px] font-light tracking-[-0.02em] md:text-[38px]">{title}</h1>
      {sub && <p className="mt-1.5 max-w-md text-[13px] font-light leading-relaxed text-dim">{sub}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function Stat({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Card className={`!p-4 ${accent ? "border-accent/40" : ""}`}>
      <div className="label-mono flex items-center gap-1.5 text-faint">
        {icon}
        {label}
      </div>
      <div className={`mt-2 text-2xl font-light leading-none tracking-tight ${accent ? "text-accent" : ""}`}>
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[11px] font-light leading-snug text-dim">{sub}</div>}
    </Card>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3.5 mt-9 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-[16px] font-medium tracking-tight">{children}</h2>
      {right}
    </div>
  );
}

/** Meter: filled ratio bar — track is a darker step of the same hue. */
export function Meter({
  ratio,
  color = "var(--color-viz1)",
  className = "",
}: {
  ratio: number;
  color?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div
      className={`h-2 overflow-hidden rounded-full ${className}`}
      style={{ background: `color-mix(in srgb, ${color} 16%, var(--color-elev))` }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <div className="mb-1.5 text-xs font-semibold text-dim">{label}</div>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-elev px-3.5 py-3 text-[15px] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25";

export function Btn({
  children,
  onClick,
  variant = "default",
  className = "",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles = {
    default: "border border-line bg-card2 text-ink",
    primary: "bg-grad text-white shadow-lg shadow-accent/25",
    ghost: "border border-line/70 text-dim",
    danger: "border border-bad/30 text-bad",
  } as const;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`pressable inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-medium disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  tone = "default",
  onClick,
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "good";
  onClick?: () => void;
}) {
  const styles = {
    default: "border-line bg-card2 text-dim",
    accent: "border-accent/35 bg-accent/12 text-(--accent-soft)",
    good: "border-good/25 bg-good/10 text-good",
  } as const;
  const cls = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${styles[tone]}`;
  if (onClick)
    return (
      <button onClick={onClick} className={`pressable ${cls}`}>
        {children}
      </button>
    );
  return <span className={cls}>{children}</span>;
}

export function Empty({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="py-10 text-center text-sm text-faint">
      <div className="mb-3 flex justify-center opacity-60">{icon}</div>
      {children}
    </div>
  );
}

/** iOS segmented control. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full border border-line/70 bg-elev p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`pressable flex-1 rounded-full py-2 text-[13px] font-medium transition ${
            value === o.value ? "bg-card2 text-ink shadow-sm" : "text-faint"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Keyboard-free number stepper — the gym-glove-friendly way to
 * adjust values. Hold-to-repeat not needed; steps are chunky.
 */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  format = (v: number) => String(v),
  suffix = "",
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  format?: (v: number) => string;
  suffix?: string;
}) {
  const dec = () => onChange(Math.max(min, +(value - step).toFixed(2)));
  const inc = () => onChange(+(value + step).toFixed(2));
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={dec}
        className="pressable grid h-9 w-9 place-items-center rounded-xl border border-line bg-elev text-dim"
        aria-label="decrease"
      >
        <Minus size={15} />
      </button>
      <div className="min-w-[64px] text-center text-[15px] font-bold tabular-nums">
        {format(value)}
        {suffix && <span className="ml-0.5 text-[11px] font-medium text-faint">{suffix}</span>}
      </div>
      <button
        onClick={inc}
        className="pressable grid h-9 w-9 place-items-center rounded-xl border border-line bg-elev text-dim"
        aria-label="increase"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}

/** iOS settings-style list row. */
export function ListRow({
  icon,
  title,
  sub,
  right,
  href,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  right?: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-card2 text-accent2">{icon}</div>
      <div className="min-w-0 flex-1 text-left">
        <div className="text-[15px] font-semibold">{title}</div>
        {sub && <div className="truncate text-xs text-faint">{sub}</div>}
      </div>
      {right ?? <ChevronRight size={17} className="text-faint" />}
    </>
  );
  const cls = "pressable flex w-full items-center gap-3.5 px-4 py-3.5";
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
