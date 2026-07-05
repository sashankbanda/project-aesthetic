// ============================================================
// 🤖 AI Coach endpoint — stub for the future Claude integration.
//
// When ready to go live:
//   1. npm install @anthropic-ai/sdk
//   2. add ANTHROPIC_API_KEY=... to .env.local  (server-side only —
//      never NEXT_PUBLIC_)
//   3. POST the user's app state summary here; build the prompt from
//      their workout history, measurements and weak-point priorities;
//      call claude-sonnet-5 and return the coaching advice.
//
// The client will send a compact summary (not raw localStorage) so
// the prompt stays small and no photos ever leave the device.
// ============================================================
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;

  if (!hasKey) {
    return NextResponse.json(
      {
        available: false,
        message:
          "AI Coach isn't connected yet. Add ANTHROPIC_API_KEY to .env.local to enable personalized coaching.",
      },
      { status: 200 },
    );
  }

  // Placeholder until the SDK call is wired up.
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    available: true,
    message: "AI Coach is configured but not yet implemented.",
    echo: body,
  });
}
