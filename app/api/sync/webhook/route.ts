import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchActivityById, upsertActivity } from "@/lib/strava";

// Strava webhook verification (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Strava webhook event (POST)
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    object_type: string;
    object_id: number;
    aspect_type: string;
    owner_id: number;
  };

  // Only handle activity create/update events
  if (body.object_type !== "activity" || body.aspect_type === "delete") {
    return NextResponse.json({ ok: true });
  }

  // Find user by stravaId
  const user = await db.user.findUnique({ where: { stravaId: String(body.owner_id) } });
  if (!user) return NextResponse.json({ ok: true });

  // Fire and forget — sync the single activity
  (async () => {
    try {
      const act = await fetchActivityById(user.id, String(body.object_id));
      await upsertActivity(user.id, act);
    } catch (err) {
      console.error("[webhook sync]", err);
    }
  })();

  return NextResponse.json({ ok: true });
}
