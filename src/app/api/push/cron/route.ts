// ============================================================
// Daily reminder cron (Vercel cron hits this once a day).
// For each subscribed device: if today is a training day in the
// user's plan and they haven't completed a session yet, nudge.
// Auth: Vercel sends `Authorization: Bearer ${CRON_SECRET}`.
// ============================================================
import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

// the app's home timezone — reminders fire relative to IST days
const TZ_OFFSET_MIN = 330; // UTC+5:30

function istToday(): { date: string; weekday: number; hour: number } {
  const now = new Date(Date.now() + TZ_OFFSET_MIN * 60_000);
  return { date: now.toISOString().slice(0, 10), weekday: now.getUTCDay(), hour: now.getUTCHours() };
}

interface PlanDayLite {
  weekday?: number;
  name?: string;
  isRest?: boolean;
  durationMin?: number;
  exercises?: unknown[];
}

/** day-part lifestyle nudges — two per day, a different voice each weekday */
const NUDGES: Record<number, { hour: number; title: string; body: string }[]> = {
  0: [
    { hour: 11, title: "Rest day, done right", body: "A walk, sunlight, water. Recovery is training — it just looks lazier." },
    { hour: 16, title: "Two minutes of prep", body: "Peek at tomorrow's workout now so morning-you just shows up and lifts." },
  ],
  1: [
    { hour: 11, title: "Hydration first", body: "Coffee counts for focus, not for water. First litre by lunch." },
    { hour: 16, title: "Beat the slump", body: "Stand up, roll the shoulders, 20 steps. Your evening session will feel lighter." },
  ],
  2: [
    { hour: 11, title: "Protein check", body: "Halfway to your protein goal by lunch keeps the evening effortless." },
    { hour: 16, title: "Ten minutes outside", body: "A short walk now buys better sleep tonight. Cheap trade." },
  ],
  3: [
    { hour: 11, title: "Midweek top-up", body: "Halfway through the week — refill the bottle before the afternoon runs away." },
    { hour: 21, title: "Wind down", body: "Lights low, screens dim. Tonight's sleep builds Friday's session." },
  ],
  4: [
    { hour: 11, title: "Move a little", body: "Been sitting long? 15 bodyweight squats. Nobody's watching. Probably." },
    { hour: 16, title: "Snack smart", body: "Reaching for something? Protein first — the gym version of you will notice." },
  ],
  5: [
    { hour: 11, title: "Finish the week strong", body: "Hydrate today and tomorrow's workout feels easy. That's the whole trick." },
    { hour: 16, title: "Streak check", body: "One more day in the books. Open the app — your streak likes being seen." },
  ],
  6: [
    { hour: 11, title: "Weekend steps", body: "No desk today — perfect day to bury the step goal before lunch." },
    { hour: 16, title: "Five-minute stretch", body: "Hips and shoulders, five minutes. Monday-you says thanks in advance." },
  ],
};

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return NextResponse.json({ error: "vapid not configured" }, { status: 503 });
  webpush.setVapidDetails("mailto:banda.s@gozeal.com", pub, priv);

  // per-user times: only devices whose preferred hour matches this run.
  // Trigger this endpoint hourly (cron-job.org free tier) for full coverage;
  // Vercel's daily cron alone covers the 18:00 IST default.
  const { date, weekday, hour } = istToday();
  let sent = 0;
  let cleaned = 0;

  const deliver = async (
    sub: { id: string; endpoint: string; p256dh: string; auth: string },
    payload: string,
  ) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        cleaned++;
      }
    }
  };

  // 1) workout reminders at each device's chosen hour
  const reminderSubs = await prisma.pushSubscription.findMany({ where: { reminderHour: hour } });
  for (const sub of reminderSubs) {
    const [profile, doneToday] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: sub.userId }, select: { plan: true } }),
      prisma.workoutSession.findFirst({
        where: { userId: sub.userId, date, completedAt: { not: null } },
        select: { id: true },
      }),
    ]);
    if (doneToday) continue;

    const plan = (profile?.plan as PlanDayLite[] | undefined) ?? [];
    const day = plan.find((d) => d?.weekday === weekday);
    if (!day || day.isRest) continue;

    await deliver(
      sub,
      JSON.stringify({
        title: `${day.name ?? "Training"} is waiting`,
        body: `${day.exercises?.length ?? 0} exercises · ~${day.durationMin ?? 60} min. Your streak is watching.`,
        url: "/workout",
      }),
    );
  }

  // 2) lifestyle nudges for this weekday+hour (skipping anyone whose
  //    workout reminder fires this same hour — one buzz at a time)
  const nudge = NUDGES[weekday]?.find((n) => n.hour === hour);
  if (nudge) {
    const nudgeSubs = await prisma.pushSubscription.findMany({
      where: { nudges: true, reminderHour: { not: hour } },
    });
    for (const sub of nudgeSubs) {
      await deliver(sub, JSON.stringify({ title: nudge.title, body: nudge.body, url: "/" }));
    }
  }

  return NextResponse.json({ sent, cleaned, hour });
}
