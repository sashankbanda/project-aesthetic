"use client";
import Mounted from "@/components/mounted";
import { Card, PageHead } from "@/components/ui";
import { ListRow } from "@/components/ui";
import { doExport, doImport } from "@/components/shell";
import { useApp } from "@/lib/store";
import { ACHIEVEMENTS } from "@/lib/seed";
import {
  BookOpen,
  Download,
  Map,
  Moon,
  NotebookPen,
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
  const unlocked = Object.keys(state.unlocked).length;
  const journalCount = state.journal.length;

  return (
    <>
      <PageHead title="More" sub="Everything else — journals, badges, plans and backups." />

      <Card className="!p-0 divide-y divide-line/40 overflow-hidden">
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
    </>
  );
}
