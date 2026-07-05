"use client";
// ============================================================
// First-run onboarding — welcome → name → age → height →
// weight → goal → optional backup sign-in. Every step is
// skippable; the app is fully usable without an account.
// Shown once: state.onboarded gates it.
// ============================================================
import { useState, useSyncExternalStore } from "react";
import { useSession, signIn } from "next-auth/react";
import { ArrowLeft, ArrowRight, Check, CloudUpload, Lock } from "lucide-react";
import DotNumber from "./dot-number";
import { DUMBBELL_FRAMES, GlyphMatrix } from "./glyph";
import { useAuthEnabled } from "./auth-provider";
import { Btn, Stepper, inputCls } from "./ui";
import { todayStr, update, useApp } from "@/lib/store";

type Goal = "lose" | "recomp" | "build";

const GOALS: { id: Goal; label: string; sub: string }[] = [
  { id: "lose", label: "Lose fat", sub: "Drop weight, keep muscle" },
  { id: "recomp", label: "Body recomposition", sub: "Leaner and stronger at once" },
  { id: "build", label: "Build muscle", sub: "Add size with minimal fat" },
];

/** goal → phase name, target weight/body-fat, protein goal */
function deriveTargets(goal: Goal, weightKg: number) {
  const protein = Math.round((weightKg * 1.8) / 5) * 5;
  switch (goal) {
    case "lose":
      return { phase: "Fat Loss", targetWeightKg: Math.round(weightKg - 5), targetBodyFatPct: 14, proteinGoalG: protein };
    case "build":
      return { phase: "Lean Muscle Gain", targetWeightKg: Math.round(weightKg + 4), targetBodyFatPct: 15, proteinGoalG: protein };
    default:
      return { phase: "Body Recomposition", targetWeightKg: Math.round(weightKg - 3), targetBodyFatPct: 12, proteinGoalG: protein };
  }
}

const emptySubscribe = () => () => {};

export default function OnboardingGate() {
  const ready = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const state = useApp();
  if (!ready) return null;
  // only brand-new installs: never logged a session and never finished/skipped
  if (state.onboarded || state.sessions.length > 0) return null;
  return <Onboarding />;
}

const TOTAL_STEPS = 7;

function Onboarding() {
  const authEnabled = useAuthEnabled();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState(24);
  const [heightCm, setHeightCm] = useState(172);
  const [weightKg, setWeightKg] = useState(70);
  const [goal, setGoal] = useState<Goal>("recomp");

  const finish = () => {
    const targets = deriveTargets(goal, weightKg);
    update((draft) => {
      draft.onboarded = true;
      if (name.trim()) draft.profile.name = name.trim().slice(0, 40);
      draft.profile.birthYear = new Date().getFullYear() - age;
      draft.profile.heightCm = heightCm;
      draft.profile.phase = targets.phase;
      draft.profile.targetWeightKg = targets.targetWeightKg;
      draft.profile.targetBodyFatPct = targets.targetBodyFatPct;
      draft.profile.proteinGoalG = targets.proteinGoalG;
      draft.measurements = [{ date: todayStr(), weightKg }];
    });
  };

  const skipAll = () => update((draft) => void (draft.onboarded = true));

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 z-[95] overflow-y-auto bg-bg">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 pb-10 pt-safe">
        {/* progress */}
        <div className="flex items-center gap-3 pb-2 pt-6">
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <button onClick={back} aria-label="back" className="pressable -ml-2 grid h-9 w-9 place-items-center rounded-full text-dim">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition ${i <= step ? "bg-accent" : "bg-card2"}`}
              />
            ))}
          </div>
        </div>

        <div key={step} className="view-in flex flex-1 flex-col">
          {step === 0 && (
            <StepShell
              title="Meet your coach"
              sub="Training, nutrition and progress — designed around your weak points, living entirely on your phone."
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

          {step === 1 && (
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

          {step === 2 && (
            <StepShell title="How old are you?" sub="Used only for your stats — change anytime.">
              <BigNumber value={age} unit="years" />
              <Stepper value={age} min={13} step={1} onChange={(v) => setAge(Math.min(90, v))} />
              <div className="flex-1" />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="Your height?" sub="Powers BMI and FFMI.">
              <BigNumber value={heightCm} unit="cm" />
              <Stepper value={heightCm} min={120} step={1} onChange={(v) => setHeightCm(Math.min(230, v))} />
              <div className="flex-1" />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === 4 && (
            <StepShell title="Current weight?" sub="You can always update this later.">
              <BigNumber value={weightKg} unit="kg" />
              <Stepper
                value={weightKg}
                min={30}
                step={0.5}
                onChange={(v) => setWeightKg(Math.min(250, v))}
                format={(v) => v.toFixed(1)}
              />
              <div className="flex-1" />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === 5 && (
            <StepShell title="What's your goal?" sub="Sets your phase, targets and protein goal — all editable later.">
              <div className="mt-6 grid gap-2.5">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`pressable flex items-center gap-3.5 rounded-2xl border px-5 py-4 text-left ${
                      goal === g.id ? "border-accent/50 bg-accent/10" : "border-line bg-card"
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
                        goal === g.id ? "border-accent bg-accent text-white" : "border-line"
                      }`}
                    >
                      {goal === g.id && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block text-[15px] font-medium">{g.label}</span>
                      <span className="block text-xs font-light text-faint">{g.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <NextBtn onClick={next} />
            </StepShell>
          )}

          {step === 6 && (
            <FinalStep authEnabled={authEnabled} onFinish={finish} />
          )}
        </div>
      </div>
    </div>
  );
}

function StepShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pt-8">
      <h1 className="text-[30px] font-light tracking-[-0.02em]">{title}</h1>
      <p className="mt-1.5 text-[13px] font-light leading-relaxed text-dim">{sub}</p>
      {children}
    </div>
  );
}

function BigNumber({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
      <div className="flex items-end gap-2">
        <DotNumber value={Number.isInteger(value) ? value : value.toFixed(1)} cell={10} />
        <span className="label-mono pb-1 text-faint">{unit}</span>
      </div>
    </div>
  );
}

function NextBtn({ onClick }: { onClick: () => void }) {
  return (
    <Btn variant="primary" className="w-full !py-4" onClick={onClick}>
      Next <ArrowRight size={16} />
    </Btn>
  );
}

/** last step — finish locally, with optional Google backup when configured */
function FinalStep({ authEnabled, onFinish }: { authEnabled: boolean; onFinish: () => void }) {
  return (
    <StepShell
      title="You're set"
      sub="Everything you log stays on this device. Sign in only if you want automatic backup and sync across devices."
    >
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
        <Lock size={15} className="mt-0.5 shrink-0 text-dim" />
        <p className="text-[12px] font-light leading-relaxed text-dim">
          No account needed — explore and train freely. Your progress photos never leave your
          device either way.
        </p>
      </div>
      <div className="flex-1" />
      {authEnabled ? (
        <>
          <SignInButton onFinish={onFinish} />
          <Btn variant="ghost" className="mt-2.5 w-full !py-4" onClick={onFinish}>
            Maybe later — start training
          </Btn>
        </>
      ) : (
        <Btn variant="primary" className="w-full !py-4" onClick={onFinish}>
          Start training <ArrowRight size={16} />
        </Btn>
      )}
    </StepShell>
  );
}

function SignInButton({ onFinish }: { onFinish: () => void }) {
  const { status } = useSession();
  if (status === "authenticated") {
    return (
      <Btn variant="primary" className="w-full !py-4" onClick={onFinish}>
        <Check size={16} /> Signed in — start training
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
