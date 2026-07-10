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
  const subs = await prisma.pushSubscription.findMany({ where: { reminderHour: hour } });
  let sent = 0;
  let cleaned = 0;

  for (const sub of subs) {
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

    const payload = JSON.stringify({
      title: `${day.name ?? "Training"} is waiting`,
      body: `${day.exercises?.length ?? 0} exercises · ~${day.durationMin ?? 60} min. Your streak is watching.`,
      url: "/workout",
    });

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
  }

  return NextResponse.json({ sent, cleaned, of: subs.length });
}
