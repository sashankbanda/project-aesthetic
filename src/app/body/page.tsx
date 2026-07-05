"use client";
import { useState } from "react";
import Mounted from "@/components/mounted";
import ProgressNav from "@/components/progress-nav";
import { Btn, Card, Field, PageHead, SectionTitle, Stat, Tile, inputCls } from "@/components/ui";
import { LineChart } from "@/components/charts";
import { TrendingUp } from "lucide-react";
import { todayStr, update, useApp } from "@/lib/store";
import { bmi, ffmi, latestMeasurement } from "@/lib/stats";
import type { Measurement } from "@/lib/types";

const METRICS: { key: keyof Measurement; label: string; unit: string }[] = [
  { key: "weightKg", label: "Weight", unit: " kg" },
  { key: "bodyFatPct", label: "Body Fat", unit: "%" },
  { key: "waistCm", label: "Waist", unit: " cm" },
  { key: "chestCm", label: "Chest", unit: " cm" },
  { key: "armsCm", label: "Arms", unit: " cm" },
  { key: "shouldersCm", label: "Shoulders", unit: " cm" },
  { key: "thighCm", label: "Thigh", unit: " cm" },
  { key: "calfCm", label: "Calf", unit: " cm" },
];

export default function BodyPage() {
  return (
    <Mounted>
      <BodyInner />
    </Mounted>
  );
}

function BodyInner() {
  const state = useApp();
  const { profile } = state;
  const m = latestMeasurement(state);
  const [metric, setMetric] = useState<(typeof METRICS)[number]>(METRICS[0]);
  const [showForm, setShowForm] = useState(false);
  const [editProfile, setEditProfile] = useState(false);

  const age = new Date().getFullYear() - profile.birthYear;
  const theBmi = m?.weightKg ? bmi(m.weightKg, profile.heightCm) : undefined;
  const theFfmi =
    m?.weightKg && m?.bodyFatPct !== undefined
      ? ffmi(m.weightKg, profile.heightCm, m.bodyFatPct)
      : undefined;

  const series = [...state.measurements]
    .filter((x) => x[metric.key] !== undefined)
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((x) => ({
      label: new Date(x.date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      value: x[metric.key] as number,
    }));

  const target =
    metric.key === "weightKg"
      ? profile.targetWeightKg
      : metric.key === "bodyFatPct"
        ? profile.targetBodyFatPct
        : undefined;

  return (
    <>
      <PageHead eyebrow="Progress" title="My Body" sub="Measure every 1–2 weeks, same time of day, before food." />
      <ProgressNav />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Height" value={`${profile.heightCm} cm`} />
        <Stat label="Age" value={age} />
        <Stat label="BMI" value={theBmi ?? "—"} sub="reference only" />
        <Tile tone="light" label="FFMI" value={theFfmi ?? "-"} cell={6} sub="fat-free mass index" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {METRICS.map((mt) => (
          <Stat
            key={mt.key}
            label={mt.label}
            value={m?.[mt.key] !== undefined ? `${m[mt.key]}${mt.unit}` : "—"}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Btn variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "+ Log measurements"}
        </Btn>
        <Btn variant="ghost" onClick={() => setEditProfile(!editProfile)}>
          {editProfile ? "Close profile" : "Edit profile & goals"}
        </Btn>
      </div>

      {showForm && <MeasurementForm onDone={() => setShowForm(false)} />}
      {editProfile && <ProfileForm onDone={() => setEditProfile(false)} />}

      <SectionTitle
        right={
          <select
            className="rounded-lg border border-line bg-elev px-3 py-1.5 text-xs font-semibold text-ink outline-none"
            value={metric.key}
            onChange={(e) => setMetric(METRICS.find((x) => x.key === e.target.value) ?? METRICS[0])}
          >
            {METRICS.map((mt) => (
              <option key={mt.key} value={mt.key}>
                {mt.label}
              </option>
            ))}
          </select>
        }
      >
        <TrendingUp size={17} className="text-accent2" /> {metric.label} over time
      </SectionTitle>
      <Card>
        {series.length >= 2 ? (
          <LineChart points={series} unit={metric.unit.trim()} targetValue={target} />
        ) : (
          <div className="py-8 text-center text-sm text-faint">
            Log at least two entries to see the trend.
          </div>
        )}
      </Card>
    </>
  );
}

function MeasurementForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const save = () => {
    const entry: Measurement = { date: todayStr() };
    for (const { key } of METRICS) {
      const v = parseFloat(form[key]);
      if (!isNaN(v) && v > 0) (entry[key] as number | undefined) = v;
    }
    if (Object.keys(entry).length === 1) return onDone();
    update((draft) => {
      // one entry per day — replace if same date
      draft.measurements = draft.measurements.filter((x) => x.date !== entry.date);
      draft.measurements.push(entry);
    });
    onDone();
  };
  return (
    <Card className="mt-4">
      <div className="mb-3 text-sm font-semibold">New measurements — {todayStr()}</div>
      <div className="grid grid-cols-2 gap-x-4 md:grid-cols-4">
        {METRICS.map(({ key, label, unit }) => (
          <Field key={key} label={`${label}${unit ? ` (${unit.trim()})` : ""}`}>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className={inputCls}
              value={form[key] ?? ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder="—"
            />
          </Field>
        ))}
      </div>
      <div className="text-xs text-faint">Leave blank anything you didn&apos;t measure — partial entries are fine.</div>
      <div className="mt-4 flex gap-3">
        <Btn variant="primary" onClick={save}>
          Save
        </Btn>
        <Btn variant="ghost" onClick={onDone}>
          Cancel
        </Btn>
      </div>
    </Card>
  );
}

function ProfileForm({ onDone }: { onDone: () => void }) {
  const state = useApp();
  const p = state.profile;
  const [form, setForm] = useState({
    name: p.name,
    heightCm: String(p.heightCm),
    birthYear: String(p.birthYear),
    phase: p.phase,
    targetWeightKg: String(p.targetWeightKg),
    targetBodyFatPct: String(p.targetBodyFatPct),
    proteinGoalG: String(p.proteinGoalG),
    nextMilestone: p.nextMilestone,
  });
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const save = () => {
    update((draft) => {
      draft.profile.name = form.name || draft.profile.name;
      draft.profile.heightCm = parseFloat(form.heightCm) || draft.profile.heightCm;
      draft.profile.birthYear = parseInt(form.birthYear) || draft.profile.birthYear;
      draft.profile.phase = form.phase || draft.profile.phase;
      draft.profile.targetWeightKg = parseFloat(form.targetWeightKg) || draft.profile.targetWeightKg;
      draft.profile.targetBodyFatPct = parseFloat(form.targetBodyFatPct) || draft.profile.targetBodyFatPct;
      draft.profile.proteinGoalG = parseFloat(form.proteinGoalG) || draft.profile.proteinGoalG;
      draft.profile.nextMilestone = form.nextMilestone || draft.profile.nextMilestone;
    });
    onDone();
  };
  const F = (label: string, key: keyof typeof form, type = "text") => (
    <Field label={label}>
      <input
        type={type}
        className={inputCls}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
      />
    </Field>
  );
  return (
    <Card className="mt-4">
      <div className="mb-3 text-sm font-semibold">Profile & goals</div>
      <div className="grid grid-cols-2 gap-x-4 md:grid-cols-4">
        {F("Name", "name")}
        {F("Height (cm)", "heightCm", "number")}
        {F("Birth year", "birthYear", "number")}
        {F("Phase", "phase")}
        {F("Target weight (kg)", "targetWeightKg", "number")}
        {F("Target body fat (%)", "targetBodyFatPct", "number")}
        {F("Protein goal (g)", "proteinGoalG", "number")}
        {F("Next milestone", "nextMilestone")}
      </div>
      <div className="mt-2 flex gap-3">
        <Btn variant="primary" onClick={save}>
          Save profile
        </Btn>
        <Btn variant="ghost" onClick={onDone}>
          Cancel
        </Btn>
      </div>
    </Card>
  );
}
