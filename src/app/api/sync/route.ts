// ============================================================
// /api/sync — whole-state snapshot sync, one user's data only.
//
// Security model:
//   • identity comes exclusively from the server session (auth())
//   • every query is scoped to that userId — no client-supplied ids
//   • payload is Zod-validated before it touches the database
//   • photo images are rejected by the schema (metadata only)
//
// GET  → the caller's state (404 if they've never pushed)
// PUT  → replace the caller's state transactionally
// ============================================================
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth, authEnabled } from "@/auth";
import { prisma } from "@/lib/db";
import { SyncStateSchema, type SyncState } from "@/lib/schemas";

async function requireUserId(): Promise<string | NextResponse> {
  if (!authEnabled) {
    return NextResponse.json({ error: "Cloud sync is not configured on this server." }, { status: 503 });
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in to sync." }, { status: 401 });
  }
  return userId;
}

export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const [profile, sessions, measurements, foodLog, recovery, journal, roadmap, activities, photoMeta, unlocked] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.workoutSession.findMany({ where: { userId } }),
      prisma.measurement.findMany({ where: { userId } }),
      prisma.foodEntry.findMany({ where: { userId } }),
      prisma.recoveryEntry.findMany({ where: { userId } }),
      prisma.journalEntry.findMany({ where: { userId } }),
      prisma.roadmapGoal.findMany({ where: { userId } }),
      prisma.activityEntry.findMany({ where: { userId } }),
      prisma.photoMeta.findMany({ where: { userId } }),
      prisma.unlockedAchievement.findMany({ where: { userId } }),
    ]);

  if (!profile) return NextResponse.json({ error: "No synced state yet." }, { status: 404 });

  const state: SyncState = {
    modifiedAt: profile.stateModifiedAt.toISOString(),
    profile: {
      name: profile.name,
      heightCm: profile.heightCm,
      birthYear: profile.birthYear,
      phase: profile.phase,
      targetWeightKg: profile.targetWeightKg,
      targetBodyFatPct: profile.targetBodyFatPct,
      proteinGoalG: profile.proteinGoalG,
      waterGoalMl: profile.waterGoalMl,
      stepsGoal: profile.stepsGoal,
      sleepGoalH: profile.sleepGoalH,
      nextMilestone: profile.nextMilestone,
      training: (profile.training as SyncState["profile"]["training"] | null) ?? undefined,
    },
    plan: profile.plan as unknown[],
    sessions: sessions.map((s) => ({
      id: s.localId,
      date: s.date,
      dayId: s.dayId,
      startedAt: s.startedAt ?? undefined,
      completedAt: s.completedAt ?? undefined,
      logs: s.logs as SyncState["sessions"][number]["logs"],
    })),
    measurements: measurements.map((m) => ({
      date: m.date,
      weightKg: m.weightKg ?? undefined,
      bodyFatPct: m.bodyFatPct ?? undefined,
      waistCm: m.waistCm ?? undefined,
      chestCm: m.chestCm ?? undefined,
      armsCm: m.armsCm ?? undefined,
      shouldersCm: m.shouldersCm ?? undefined,
      thighCm: m.thighCm ?? undefined,
      calfCm: m.calfCm ?? undefined,
    })),
    foodLog: foodLog.map((f) => ({ date: f.date, foodId: f.foodId, servings: f.servings })),
    recovery: recovery.map((r) => ({
      date: r.date,
      sleepH: r.sleepH ?? undefined,
      waterMl: r.waterMl ?? undefined,
      steps: r.steps ?? undefined,
      stretched: r.stretched ?? undefined,
    })),
    journal: journal.map((j) => ({
      date: j.date,
      energy: j.energy,
      sleepH: j.sleepH,
      mood: j.mood,
      notes: j.notes,
    })),
    roadmap: roadmap.map((g) => ({ id: g.localId, month: g.month, label: g.label, done: g.done })),
    activities: activities.map((a) => ({
      id: a.localId,
      date: a.date,
      name: a.name,
      seconds: a.seconds,
      at: a.at,
    })),
    challenge: (profile.challenge as SyncState["challenge"] | null) ?? undefined,
    exerciseNotes: (profile.exerciseNotes as Record<string, string> | null) ?? {},
    photoMeta: photoMeta.map((p) => ({
      month: p.month,
      angle: p.angle as "front" | "side" | "back",
      weightKg: p.weightKg ?? undefined,
      capturedAt: p.capturedAt ?? undefined,
    })),
    unlocked: Object.fromEntries(unlocked.map((u) => [u.achievementId, u.date])),
  };

  return NextResponse.json(state);
}

export async function PUT(request: Request) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json().catch(() => null);
  const parsed = SyncStateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid sync payload", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 },
    );
  }
  const s = parsed.data;
  const { training, ...profileCols } = s.profile;
  const profileData = {
    ...profileCols,
    training: training === undefined ? Prisma.JsonNull : (training as Prisma.InputJsonValue),
    challenge: s.challenge === undefined ? Prisma.JsonNull : (s.challenge as Prisma.InputJsonValue),
    exerciseNotes: s.exerciseNotes as Prisma.InputJsonValue,
    plan: s.plan as Prisma.InputJsonValue,
    stateModifiedAt: new Date(s.modifiedAt),
  };

  await prisma.$transaction([
    prisma.profile.upsert({
      where: { userId },
      create: { userId, ...profileData },
      update: profileData,
    }),
    // snapshot semantics: replace each collection wholesale
    prisma.workoutSession.deleteMany({ where: { userId } }),
    prisma.workoutSession.createMany({
      data: s.sessions.map((x) => ({
        userId,
        localId: x.id,
        date: x.date,
        dayId: x.dayId,
        startedAt: x.startedAt ?? null,
        completedAt: x.completedAt ?? null,
        logs: x.logs as unknown as Prisma.InputJsonValue,
      })),
    }),
    prisma.measurement.deleteMany({ where: { userId } }),
    prisma.measurement.createMany({ data: s.measurements.map((x) => ({ userId, ...x })) }),
    prisma.foodEntry.deleteMany({ where: { userId } }),
    prisma.foodEntry.createMany({ data: s.foodLog.map((x) => ({ userId, ...x })) }),
    prisma.recoveryEntry.deleteMany({ where: { userId } }),
    prisma.recoveryEntry.createMany({ data: s.recovery.map((x) => ({ userId, ...x })) }),
    prisma.journalEntry.deleteMany({ where: { userId } }),
    prisma.journalEntry.createMany({ data: s.journal.map((x) => ({ userId, ...x })) }),
    prisma.roadmapGoal.deleteMany({ where: { userId } }),
    prisma.roadmapGoal.createMany({
      data: s.roadmap.map((x) => ({ userId, localId: x.id, month: x.month, label: x.label, done: x.done })),
    }),
    prisma.activityEntry.deleteMany({ where: { userId } }),
    prisma.activityEntry.createMany({
      data: s.activities.map((x) => ({
        userId,
        localId: x.id,
        date: x.date,
        name: x.name,
        seconds: x.seconds,
        at: x.at,
      })),
    }),
    prisma.photoMeta.deleteMany({ where: { userId } }),
    prisma.photoMeta.createMany({ data: s.photoMeta.map((x) => ({ userId, ...x })) }),
    prisma.unlockedAchievement.deleteMany({ where: { userId } }),
    prisma.unlockedAchievement.createMany({
      data: Object.entries(s.unlocked).map(([achievementId, date]) => ({ userId, achievementId, date })),
    }),
  ]);

  return NextResponse.json({ ok: true, modifiedAt: s.modifiedAt });
}
