"use client";
import { useState, useSyncExternalStore } from "react";
import Mounted from "@/components/mounted";
import AccountCard from "@/components/account-card";
import RemindersCard from "@/components/reminders-card";
import PlanWizard from "@/components/plan-wizard";
import { TEMPLATES } from "@/lib/templates";
import { Card, PageHead, Segmented } from "@/components/ui";
import { ListRow } from "@/components/ui";
import { doExport, doImport } from "@/components/shell";
import { useApp } from "@/lib/store";
import { ACHIEVEMENTS } from "@/lib/seed";
import { getThemeMode, setThemeMode, subscribeTheme, type ThemeMode } from "@/lib/theme";
import {
  BookOpen,
  Download,
  Dumbbell,
  Heart,
  Map,
  Moon,
  NotebookPen,
  Sparkles,
  SunMoon,
  Trophy,
  Upload,
} from "lucide-react";

export default function MorePage() {
  return (
    <Mounted>
      <MoreInner />
    </Mounted>
  );
}

function MoreInner() {
  const state = useApp();
  const [planWizard, setPlanWizard] = useState(false);
  const unlocked = Object.keys(state.unlocked).length;
  const journalCount = state.journal.length;
  const training = state.profile.training;

  return (
    <>
      {planWizard && <PlanWizard mode="switch" onClose={() => setPlanWizard(false)} />}
      <PageHead title="More" sub="Everything else — journals, badges, plans and backups." />

      <div className="mb-4">
        <AccountCard />
      </div>

      <RemindersCard />
      <ThemeCard />

      <Card className="!p-0 divide-y divide-line/40 overflow-hidden">
        <ListRow
          onClick={() => setPlanWizard(true)}
          icon={<Dumbbell size={17} />}
          title="Training Plan"
          sub={
            training
              ? `${TEMPLATES[training.goal].label} · ${training.daysPerWeek} days · history is kept when you switch`
              : "Rebuild your weekly plan around a new goal"
          }
        />
        <ListRow
          href="/coach"
          icon={<Sparkles size={17} />}
          title="AI Coach"
          sub="Weekly check-ins from your own training data"
        />
        <ListRow
          href="/roadmap"
          icon={<Map size={17} />}
          title="Monthly Roadmap"
          sub="Your goals, month by month"
        />
        <ListRow
          href="/recovery"
          icon={<Moon size={17} />}
          title="Recovery"
          sub="Sleep · water · steps · stretching"
        />
        <ListRow
          href="/journal"
          icon={<NotebookPen size={17} />}
          title="Journal"
          sub={journalCount > 0 ? `${journalCount} entries` : "Energy, mood and notes"}
        />
        <ListRow
          href="/achievements"
          icon={<Trophy size={17} />}
          title="Achievements"
          sub={`${unlocked} of ${ACHIEVEMENTS.length} unlocked`}
        />
        <ListRow
          href="/library"
          icon={<BookOpen size={17} />}
          title="Exercise Library"
          sub="Form guides, mistakes, alternatives"
        />
      </Card>

      <Card className="!p-0 divide-y divide-line/40 mt-4 overflow-hidden">
        <ListRow
          onClick={doExport}
          icon={<Download size={17} />}
          title="Back up data"
          sub="Download everything as a file"
          right={<span />}
        />
        <ListRow
          onClick={doImport}
          icon={<Upload size={17} />}
          title="Restore backup"
          sub="Import a previously saved file"
          right={<span />}
        />
      </Card>

      <p className="mt-6 text-center text-[11px] text-faint">
        Project Aesthetic · your data never leaves this device
      </p>
      <p className="label-mono mt-3 flex items-center justify-center gap-1.5 text-[9px] text-faint">
        Made with <Heart size={10} className="fill-accent text-accent" /> sashankbanda
      </p>
    </>
  );
}

/** Dark / light / follow-system — remembered on this device. */
function ThemeCard() {
  const mode = useSyncExternalStore(subscribeTheme, getThemeMode, () => "system" as ThemeMode);
  return (
    <Card className="mb-4 !p-4">
      <div className="label-mono mb-3 flex items-center gap-1.5 text-faint">
        <SunMoon size={13} />
        Appearance
      </div>
      <Segmented<ThemeMode>
        options={[
          { value: "system", label: "System" },
          { value: "dark", label: "Dark" },
          { value: "light", label: "Light" },
        ]}
        value={mode}
        onChange={setThemeMode}
      />
    </Card>
  );
}
