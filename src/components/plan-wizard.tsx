"use client";
// ============================================================
// Plan wizard — the 7 profile dimensions, one decision per
// screen, ending in a full plan preview (peak-end). Two modes:
//   onboard — first run: welcome, name, body basics, then plan
//   switch  — from More: plan dimensions only, prefilled;
//             workout history is never touched.
// ============================================================
import { useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { ArrowLeft, ArrowRight, Check, CloudUpload, Lock, ShieldAlert, X } from "lucide-react";
import DotNumber from "./dot-number";
import { DUMBBELL_FRAMES, GlyphMatrix } from "./glyph";
import { useAuthEnabled } from "./auth-provider";
import { Btn, Stepper, inputCls } from "./ui";
import { monthStr, todayStr, update, useApp } from "@/lib/store";
import { latestMeasurement } from "@/lib/stats";
import { getThemeMode, setThemeMode, type ThemeMode } from "@/lib/theme";
import { goalBadgesFor, goalOrderFor, milestoneFor, TEMPLATES } from "@/lib/templates";
import { disclaimersFor, nutritionFor, resolvePlan } from "@/lib/plan-engine";
import type {
  AgeGroup,
  Environment,
  Experience,
  FocusPreset,
  Gender,
  Goal,
  TrainingProfile,
  WorkoutDay,
} from "@/lib/types";
import { EXERCISE_MAP } from "@/lib/seed";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ageToGroup(age: number): AgeGroup {
  if (age < 18) return "13-17";
  if (age < 30) return "18-29";
  if (age < 45) return "30-44";
  if (age < 60) return "45-59";
  return "60+";
}

/** targets by nutrition stance — same spirit as the original three-goal onboarding */
function targetsFor(goal: Goal, weightKg: number) {
  const stance = TEMPLATES[goal].nutrition.stance;
  if (stance === "deficit") return { targetWeightKg: Math.round(weightKg - 5), targetBodyFatPct: 15 };
  if (stance === "surplus") return { targetWeightKg: Math.round(weightKg + 4), targetBodyFatPct: 15 };
  return { targetWeightKg: Math.round(weightKg - 2), targetBodyFatPct: 13 };
}

const GENDERS: { id: Gender; label: string; sub: string }[] = [
  { id: "male", label: "Male", sub: "" },
  { id: "female", label: "Female", sub: "" },
  { id: "unspecified", label: "Prefer not to say", sub: "Gender-neutral programming" },
];

const ENVIRONMENTS: { id: Environment; label: string; sub: string }[] = [
  { id: "gym", label: "Commercial gym", sub: "Barbells, machines, cables, dumbbells" },
  { id: "home-gym", label: "Home gym", sub: "Dumbbells, bands, a bench" },
  { id: "home-minimal", label: "Home, minimal", sub: "Bands and a pull-up bar" },
  { id: "bodyweight", label: "Bodyweight only", sub: "No equipment at all" },
];

const EXPERIENCES: { id: Experience; label: string; sub: string }[] = [
  { id: "beginner", label: "Beginner", sub: "Under 6 months of training" },
  { id: "intermediate", label: "Intermediate", sub: "6 months – 2 years" },
  { id: "advanced", label: "Advanced", sub: "2+ years, consistent" },
];

const FOCUSES: { id: FocusPreset; label: string; sub: string }[] = [
  { id: "balanced", label: "Balanced", sub: "Everything gets equal love" },
  { id: "glutes-legs", label: "Glutes & legs emphasis", sub: "Extra lower-body volume" },
  { id: "chest-arms", label: "Chest & arms emphasis", sub: "Extra upper-body volume" },
];

const THEMES: { id: ThemeMode; label: string; sub: string }[] = [
  { id: "system", label: "Match my device", sub: "Follows your phone's light/dark setting" },
  { id: "dark", label: "Dark", sub: "The signature look — dots on near-black" },
  { id: "light", label: "Light", sub: "Bright, paper-like" },
];

export default function PlanWizard({
  mode,
  onClose,
}: {
  mode: "onboard" | "switch";
  onClose?: () => void;
}) {
  const authEnabled = useAuthEnabled();
  const state = useApp();
  const existing = state.profile.training;

  // body basics (onboard collects them; switch reuses the profile)
  const [name, setName] = useState("");
  const [age, setAge] = useState(
    mode === "switch" ? Math.max(13, new Date().getFullYear() - state.profile.birthYear) : 24,
  );
  const [heightCm, setHeightCm] = useState(state.profile.heightCm || 172);
  const [weightKg, setWeightKg] = useState(
    mode === "switch" ? (latestMeasurement(state)?.weightKg ?? 70) : 70,
  );

  // the 7 dimensions — prefilled from the current plan when switching
  const [gender, setGender] = useState<Gender>(existing?.gender ?? "unspecified");
  const [goal, setGoal] = useState<Goal>(existing?.goal ?? "starter");
  const [environment, setEnvironment] = useState<Environment>(existing?.environment ?? "gym");
  const [experience, setExperience] = useState<Experience>(existing?.experience ?? "beginner");
  const [daysPerWeek, setDaysPerWeek] = useState<TrainingProfile["daysPerWeek"]>(existing?.daysPerWeek ?? 3);
  const [sessionMin, setSessionMin] = useState<TrainingProfile["sessionMin"]>(existing?.sessionMin ?? 60);
  const [focus, setFocus] = useState<FocusPreset>(existing?.focus ?? "balanced");
  const [theme, setTheme] = useState<ThemeMode>(() => getThemeMode());

  // step flow: onboard gets welcome/name/body first; switch jumps straight to the plan dimensions
  type StepId =
    | "welcome" | "theme" | "name" | "age" | "height" | "weight"
    | "gender" | "goal" | "environment" | "experience" | "schedule" | "focus" | "preview";
  const steps: StepId[] =
    mode === "onboard"
      ? ["welcome", "theme", "name", "age", "height", "weight", "gender", "goal", "environment", "experience", "schedule", "focus", "preview"]
      : ["goal", "environment", "experience", "schedule", "focus", "preview"];
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];
  const next = () => setStepIdx((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStepIdx((s) => Math.max(s - 1, 0));

  const training: TrainingProfile = useMemo(
    () => ({
      gender,
      ageGroup: ageToGroup(age),
      environment,
      goal,
      experience,
      daysPerWeek,
      sessionMin,
      focus,
      planStartedAt: todayStr(),
      deloadWeeks: TEMPLATES[goal].deloadWeeks,
    }),
    [gender, age, environment, goal, experience, daysPerWeek, sessionMin, focus],
  );

  const finish = () => {
    const plan = resolvePlan(training);
    const nutri = nutritionFor(training, weightKg);
    const targets = targetsFor(goal, weightKg);
    update((draft) => {
      draft.profile.training = training;
      draft.plan = plan;
      draft.profile.phase = TEMPLATES[goal].label;
      draft.profile.proteinGoalG = nutri.proteinG;
      draft.profile.targetWeightKg = targets.targetWeightKg;
      draft.profile.targetBodyFatPct = targets.targetBodyFatPct;
      draft.profile.nextMilestone = milestoneFor(goal, environment);
      if (mode === "onboard") {
        draft.onboarded = true;
        if (name.trim()) draft.profile.name = name.trim().slice(0, 40);
        draft.profile.birthYear = new Date().getFullYear() - age;
        draft.profile.heightCm = heightCm;
        draft.measurements = [{ date: todayStr(), weightKg }];
        // roadmap seeds that match the chosen goal (existing users keep theirs)
        const month = monthStr();
        draft.roadmap = [
          { id: "goal-milestone", month, label: milestoneFor(goal, environment), done: false },
          { id: "goal-consistency", month, label: `Train ${daysPerWeek}× every week this month`, done: false },
          { id: "goal-photos", month, label: "Take first progress photos", done: false },
        ];
      }
      // switch mode: sessions, measurements, photos, journal — all untouched
    });
    onClose?.();
  };

  const skipAll = () => {
    update((draft) => void (draft.onboarded = true));
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[95] overflow-y-auto bg-bg">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 pb-10 pt-safe">
        {/* progress + back (goal-gradient: always visible, fills toward done) */}
        <div className="flex items-center gap-3 pb-2 pt-6">
          {stepIdx > 0 && step !== "preview" && (
            <button onClick={back} aria-label="back" className="pressable -ml-2 grid h-9 w-9 place-items-center rounded-full text-dim">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex flex-1 gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition ${i <= stepIdx ? "bg-accent" : "bg-card2"}`} />
            ))}
          </div>
          {mode === "switch" && (
            <button onClick={onClose} aria-label="close" className="pressable -mr-2 grid h-9 w-9 place-items-center rounded-full text-dim">
              <X size={18} />
            </button>
          )}
        </div>

        <div key={step} className="view-in flex flex-1 flex-col">
          {step === "welcome" && (
            <StepShell
              title="Meet your coach"
              sub="Training, nutrition and progress — designed around you, living entirely on your phone."
            >
              <div className="grid flex-1 place-items-center py-10">
                <GlyphMatrix frames={DUMBBELL_FRAMES} fps={4} cell={9} />
              </div>
              <Btn variant="primary" className="w-full !py-4" onClick={next}>
                Get started <ArrowRight size={16} />
              </Btn>
              <button onClick={skipAll} className="pressable mx-auto mt-4 text-[13px] font-light text-faint">
                Just let me explore →
              </button>
            </StepShell>
          )}

          {step === "theme" && (
            <StepShell title="Pick your look" sub="It changes live as you tap — and you can switch anytime in Account & Settings.">
              <div className="mt-6 grid gap-2.5">
                {THEMES.map((th) => (
                  <ChoiceRow
                    key={th.id}
                    selected={theme === th.id}
                    label={th.label}
                    sub={th.sub}
                    badge={th.id === "system" ? "Recommended" : undefined}
                    onClick={() => {
                      setTheme(th.id);
                      setThemeMode(th.id); // applies instantly — the whole screen re-themes
                    }}
                  />
                ))}
              </div>
              <div className="flex-1" />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === "name" && (
            <StepShell title="What should we call you?" sub="This is just for your greeting — nothing leaves the device.">
              <input
                autoFocus
                className={inputCls + " mt-6 !py-4 text-center !text-xl"}
                placeholder="Your name"
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && next()}
              />
              <div className="flex-1" />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === "age" && (
            <StepShell title="How old are you?" sub="Your plan adapts — teens train technique-first, 60+ adds balance work.">
              <NumberField value={age} min={13} max={90} step={1} unit="years" onChange={setAge} />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === "height" && (
            <StepShell title="Your height?" sub="Powers BMI and FFMI.">
              <NumberField value={heightCm} min={120} max={230} step={1} unit="cm" onChange={setHeightCm} />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === "weight" && (
            <StepShell title="Current weight?" sub="You can always update this later.">
              <NumberField
                value={weightKg}
                min={30}
                max={250}
                step={0.5}
                unit="kg"
                format={(v) => v.toFixed(1)}
                onChange={setWeightKg}
              />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === "gender" && (
            <StepShell title="How do you identify?" sub="Programming is the same for everyone — this reorders goal suggestions, it never limits your options.">
              <div className="mt-6 grid gap-2.5">
                {GENDERS.map((g) => (
                  <ChoiceRow key={g.id} selected={gender === g.id} label={g.label} sub={g.sub} onClick={() => setGender(g.id)} />
                ))}
              </div>
              <div className="flex-1" />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === "goal" && (
            <StepShell title="What's the goal?" sub="This picks your entire programming style — rep ranges, rest, split, cardio.">
              <div className="mt-5 grid gap-2">
                {goalOrderFor(gender).map((id) => {
                  const t = TEMPLATES[id];
                  const badges = goalBadgesFor(gender);
                  return (
                    <ChoiceRow
                      key={id}
                      selected={goal === id}
                      label={t.label}
                      sub={t.blurb}
                      badge={mode === "switch" && id === "starter" ? undefined : badges[id]}
                      onClick={() => setGoal(id)}
                    />
                  );
                })}
              </div>
              <div className="h-6" />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === "environment" && (
            <StepShell title="Where will you train?" sub="Only exercises you can actually do will make the plan.">
              <div className="mt-6 grid gap-2.5">
                {ENVIRONMENTS.map((e) => (
                  <ChoiceRow key={e.id} selected={environment === e.id} label={e.label} sub={e.sub} onClick={() => setEnvironment(e.id)} />
                ))}
              </div>
              <div className="flex-1" />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === "experience" && (
            <StepShell title="Training experience?" sub="Sets your volume and how hard the exercises get.">
              <div className="mt-6 grid gap-2.5">
                {EXPERIENCES.map((e) => (
                  <ChoiceRow key={e.id} selected={experience === e.id} label={e.label} sub={e.sub} onClick={() => setExperience(e.id)} />
                ))}
              </div>
              <div className="flex-1" />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === "schedule" && (
            <StepShell title="Your week" sub="Days you can actually keep beat days you wish you could.">
              <div className="label-mono mt-7 mb-2.5 text-faint">Days per week</div>
              <div className="grid grid-cols-5 gap-2">
                {([2, 3, 4, 5, 6] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDaysPerWeek(d)}
                    className={`pressable h-12 rounded-2xl border text-[15px] font-bold tabular-nums ${
                      daysPerWeek === d ? "border-accent/50 bg-accent/10 text-ink" : "border-line bg-card text-dim"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="label-mono mt-7 mb-2.5 text-faint">Session length</div>
              <div className="grid grid-cols-3 gap-2">
                {([[30, "20–30 min"], [60, "45–60 min"], [90, "60–90 min"]] as const).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setSessionMin(v)}
                    className={`pressable h-12 rounded-2xl border text-[13px] font-semibold ${
                      sessionMin === v ? "border-accent/50 bg-accent/10 text-ink" : "border-line bg-card text-dim"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === "focus" && (
            <StepShell title="Any emphasis?" sub="Optional — adds extra volume where you want it. Balanced is a great default.">
              <div className="mt-6 grid gap-2.5">
                {FOCUSES.map((f) => (
                  <ChoiceRow
                    key={f.id}
                    selected={focus === f.id}
                    label={f.label}
                    sub={f.sub}
                    badge={
                      (gender === "female" && f.id === "glutes-legs") || (gender === "male" && f.id === "chest-arms")
                        ? "Popular"
                        : undefined
                    }
                    onClick={() => setFocus(f.id)}
                  />
                ))}
              </div>
              <div className="flex-1" />
              <NextBtn onClick={next} label="Build my plan" />
            </StepShell>
          )}

          {step === "preview" && (
            <PreviewStep
              training={training}
              weightKg={weightKg}
              mode={mode}
              authEnabled={authEnabled}
              onFinish={finish}
              onBack={back}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- preview (the peak-end: show the whole plan before committing) ----------

function PreviewStep({
  training,
  weightKg,
  mode,
  authEnabled,
  onFinish,
  onBack,
}: {
  training: TrainingProfile;
  weightKg: number;
  mode: "onboard" | "switch";
  authEnabled: boolean;
  onFinish: () => void;
  onBack: () => void;
}) {
  const plan = useMemo(() => resolvePlan(training), [training]);
  const template = TEMPLATES[training.goal];
  const nutri = nutritionFor(training, weightKg);
  const disclaimers = disclaimersFor(training);
  const trainDays = plan.filter((d) => !d.isRest);

  return (
    <div className="flex flex-1 flex-col pt-6">
      <button onClick={onBack} className="pressable mb-2 flex items-center gap-1 text-[13px] text-faint">
        <ArrowLeft size={14} /> adjust
      </button>
      <div className="label-mono flex items-center gap-2 text-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Your plan
      </div>
      <h1 className="mt-1 text-[28px] font-light tracking-[-0.02em]">{template.label}</h1>
      <p className="text-[13px] font-light text-dim">
        {training.daysPerWeek} days · ~{training.sessionMin} min · deload every {template.deloadWeeks} weeks
      </p>

      <div className="mt-5 grid gap-2.5">
        {trainDays.map((day) => (
          <PreviewDay key={day.id} day={day} />
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-card p-4 text-[12px] leading-relaxed text-dim">
        <div className="label-mono mb-1.5 text-faint">Progression</div>
        {template.progressionNote}
        <div className="label-mono mb-1.5 mt-3 text-faint">Cardio</div>
        {template.cardioNote}
        <div className="label-mono mb-1.5 mt-3 text-faint">Nutrition · {nutri.stance}</div>
        {nutri.note} Protein target: ~{nutri.proteinG} g/day. Not medical advice.
      </div>

      {disclaimers.length > 0 && (
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-warn/25 bg-warn/10 p-4">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-warn" />
          <ul className="grid gap-1.5 text-[12px] leading-relaxed text-dim">
            {disclaimers.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {mode === "switch" && (
        <p className="mt-3 text-center text-[11px] text-faint">
          Your workout history, measurements and photos are kept — only the weekly plan changes.
        </p>
      )}

      <div className="h-6" />
      {mode === "onboard" && authEnabled ? (
        <>
          <SignInButton onFinish={onFinish} />
          <Btn variant="ghost" className="mt-2.5 w-full !py-4" onClick={onFinish}>
            Maybe later — start this plan
          </Btn>
        </>
      ) : (
        <Btn variant="primary" className="w-full !py-4" onClick={onFinish}>
          Start this plan <ArrowRight size={16} />
        </Btn>
      )}
      {mode === "onboard" && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
          <Lock size={15} className="mt-0.5 shrink-0 text-dim" />
          <p className="text-[12px] font-light leading-relaxed text-dim">
            No account needed — everything stays on this device. Progress photos never leave it either way.
          </p>
        </div>
      )}
    </div>
  );
}

function PreviewDay({ day }: { day: WorkoutDay }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)} className="pressable rounded-2xl border border-line bg-card p-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <span className="label-mono mr-2 text-[9px] text-faint">{WEEKDAYS[day.weekday]}</span>
          <span className="text-[14px] font-semibold">{day.name}</span>
        </div>
        <span className="text-[11px] text-faint">{day.exercises.length} exercises</span>
      </div>
      {open && (
        <div className="mt-2.5 grid gap-1.5 border-t border-line/40 pt-2.5">
          {day.exercises.map((pe, i) => {
            const ex = EXERCISE_MAP[pe.exerciseId];
            return (
              <div key={i} className="flex items-baseline justify-between gap-3 text-[12px]">
                <span className="text-dim">{ex?.name ?? pe.exerciseId}</span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {pe.workingSets}×{pe.repsMin}–{pe.repsMax}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
}

// ---------- small pieces ----------

function StepShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pt-8">
      <h1 className="text-[30px] font-light tracking-[-0.02em]">{title}</h1>
      <p className="mt-1.5 text-[13px] font-light leading-relaxed text-dim">{sub}</p>
      {children}
    </div>
  );
}

function ChoiceRow({
  selected,
  label,
  sub,
  badge,
  onClick,
}: {
  selected: boolean;
  label: string;
  sub?: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`pressable flex items-center gap-3.5 rounded-2xl border px-5 py-3.5 text-left ${
        selected ? "border-accent/50 bg-accent/10" : "border-line bg-card"
      }`}
    >
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
          selected ? "border-accent bg-accent text-white" : "border-line"
        }`}
      >
        {selected && <Check size={13} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-medium">{label}</span>
          {badge && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-(--accent-soft)">
              {badge}
            </span>
          )}
        </span>
        {sub && <span className="block text-xs font-light leading-snug text-faint">{sub}</span>}
      </span>
    </button>
  );
}

/** number entry: dot-matrix readout, slider for the big jumps, hold-to-repeat stepper for fine-tuning */
function NumberField({
  value,
  min,
  max,
  step,
  unit,
  format,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
      <div className="flex items-end gap-2">
        <DotNumber value={Number.isInteger(value) ? value : value.toFixed(1)} cell={10} />
        <span className="label-mono pb-1 text-faint">{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clamp(parseFloat(e.target.value)))}
        aria-label={unit}
        className="w-full"
      />
      <Stepper value={value} min={min} step={step} format={format} wheel={false} onChange={(v) => onChange(clamp(v))} />
    </div>
  );
}

function NextBtn({ onClick, label = "Next" }: { onClick: () => void; label?: string }) {
  return (
    <Btn variant="primary" className="w-full !py-4" onClick={onClick}>
      {label} <ArrowRight size={16} />
    </Btn>
  );
}

function SignInButton({ onFinish }: { onFinish: () => void }) {
  const { status } = useSession();
  if (status === "authenticated") {
    return (
      <Btn variant="primary" className="w-full !py-4" onClick={onFinish}>
        <Check size={16} /> Signed in — start this plan
      </Btn>
    );
  }
  return (
    <Btn
      variant="primary"
      className="w-full !py-4"
      onClick={() => {
        onFinish(); // persist locally first, then hand off to Google
        void signIn("google");
      }}
    >
      <CloudUpload size={16} /> Sign in with Google to back up
    </Btn>
  );
}
