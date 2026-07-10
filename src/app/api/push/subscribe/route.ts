// Register / remove this device's web-push endpoint (signed-in only).
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, authEnabled } from "@/auth";
import { prisma } from "@/lib/db";

const SubscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().max(300), auth: z.string().max(300) }),
  /** preferred reminder hour in IST (0–23) — defaults to 18:00 */
  reminderHour: z.number().int().min(0).max(23).optional(),
});

async function requireUserId(): Promise<string | NextResponse> {
  if (!authEnabled) return NextResponse.json({ error: "sync not configured" }, { status: 503 });
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return userId;
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const parsed = SubscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad subscription" }, { status: 400 });

  const { endpoint, keys, reminderHour } = parsed.data;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, reminderHour: reminderHour ?? 18 },
    update: { userId, p256dh: keys.p256dh, auth: keys.auth, ...(reminderHour !== undefined ? { reminderHour } : {}) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const endpoint = (await request.json().catch(() => ({})))?.endpoint;
  if (typeof endpoint !== "string") return NextResponse.json({ error: "bad endpoint" }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  return NextResponse.json({ ok: true });
}
