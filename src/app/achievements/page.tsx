"use client";
import { useEffect } from "react";
import Mounted from "@/components/mounted";
import { GlyphMatrix, TROPHY_FRAMES } from "@/components/glyph";
import { Card, Meter, PageHead } from "@/components/ui";
import { todayStr, update, useApp } from "@/lib/store";
import { ACHIEVEMENTS } from "@/lib/seed";
import { evaluateAchievements } from "@/lib/stats";
import {
  Award,
  Camera,
  Clapperboard,
  Crown,
  Drumstick,
  Dumbbell,
  Flame,
  Gem,
  Medal,
  Mountain,
  Sparkles,
  Target,
  TrendingDown,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** badge artwork — premium line icons per achievement */
const BADGE_ICONS: Record<string, LucideIcon> = {
  "first-workout": Clapperboard,
  "first-pullup": Medal,
  "workouts-10": Award,
  "workouts-50": Zap,
  "workouts-100": Sparkles,
  "streak-7": Flame,
  "streak-30": Mountain,
  "streak-180": Crown,
  "bench-40": Dumbbell,
  "bench-60": Dumbbell,
  "pulldown-45": Target,
  "bf-15": TrendingDown,
  "bf-12": Target,
  "bf-10": Gem,
  "protein-week": Drumstick,
  "photo-3": Camera,
};

export default function AchievementsPage() {
  return (
    <Mounted>
      <AchievementsInner />
    </Mounted>
  );
}

function AchievementsInner() {
  const state = useApp();

  // sync any conditions that became true outside a workout finish
  useEffect(() => {
    const earned = evaluateAchievements(state);
    const missing = earned.filter((id) => !state.unlocked[id]);
    if (missing.length > 0) {
      update((draft) => {
        for (const id of missing) draft.unlocked[id] = todayStr();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlockedCount = Object.keys(state.unlocked).length;

  return (
    <>
      <PageHead
        eyebrow="Trophies"
        title="Achievements"
        sub={`${unlockedCount} of ${ACHIEVEMENTS.length} unlocked — every badge is earned, never given.`}
      />
      <Card className="mb-5 !p-4">
        <div className="flex items-center gap-4">
          <GlyphMatrix frames={TROPHY_FRAMES} fps={2.5} cell={3} color="#d9a13b" className="shrink-0" />
          <Meter ratio={unlockedCount / ACHIEVEMENTS.length} color="var(--color-viz1)" className="flex-1" />
          <span className="text-xs font-bold tabular-nums text-dim">
            {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const date = state.unlocked[a.id];
          const Icon = BADGE_ICONS[a.id] ?? Trophy;
          return (
            <div
              key={a.id}
              className={`card p-5 text-center ${date ? "" : "opacity-35"}`}
            >
              <div
                className={`relative mx-auto grid h-14 w-14 place-items-center rounded-2xl ${
                  date ? "bg-ink text-bg" : "bg-card2 text-faint"
                }`}
              >
                <Icon size={25} strokeWidth={1.6} />
                {date && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-accent" />}
              </div>
              <div className="mt-3 text-sm font-medium">{a.name}</div>
              <div className="mt-1 text-[11px] font-light leading-snug text-faint">{a.desc}</div>
              {date && <div className="label-mono mt-2 text-[9px] text-dim">{date}</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}
