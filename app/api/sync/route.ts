import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncActivities } from "@/lib/strava";
import { evaluateBadges } from "@/lib/badges/engine";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stravaId = (session.user as { stravaId?: string }).stravaId;
  if (!stravaId) return NextResponse.json({ error: "No stravaId in session" }, { status: 400 });

  const dbUser = await db.user.findUnique({ where: { stravaId } });
  if (!dbUser) return NextResponse.json({ error: "User not found in DB — please re-login" }, { status: 404 });

  const userId = dbUser.id;

  const running = await db.syncLog.findFirst({
    where: { userId, status: "RUNNING" },
  });
  if (running) {
    return NextResponse.json({ message: "Sync sedang berjalan" }, { status: 409 });
  }

  const lastSync = await db.syncLog.findFirst({
    where: { userId, status: "SUCCESS" },
    orderBy: { completedAt: "desc" },
  });

  const type = lastSync ? "INCREMENTAL" : "FULL";
  const afterTimestamp = lastSync?.completedAt
    ? Math.floor(lastSync.completedAt.getTime() / 1000)
    : undefined;

  const syncLog = await db.syncLog.create({
    data: { userId, type, status: "RUNNING" },
  });

  // Run sync in background (don't await — return immediately)
  (async () => {
    try {
      const result = await syncActivities(userId, afterTimestamp);
      await evaluateBadges(userId);
      await db.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "SUCCESS",
          activitiesSynced: result.synced,
          pagesProcessed: result.pages,
          completedAt: new Date(),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db.syncLog.update({
        where: { id: syncLog.id },
        data: { status: "FAILED", error: message, completedAt: new Date() },
      });
    }
  })();

  return NextResponse.json({ message: type === "FULL" ? "Full sync dimulai" : "Incremental sync dimulai" });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stravaId = (session.user as { stravaId?: string }).stravaId;
  const dbUser = stravaId ? await db.user.findUnique({ where: { stravaId } }) : null;

  const latest = dbUser ? await db.syncLog.findFirst({
    where: { userId: dbUser.id },
    orderBy: { startedAt: "desc" },
  }) : null;

  return NextResponse.json(latest ?? { status: "NEVER" });
}
