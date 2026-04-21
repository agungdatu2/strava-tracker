import { after } from "next/server";
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

  // Save token from session if not in DB yet
  const tok = session.user as { accessToken?: string; refreshToken?: string; expiresAt?: number; scope?: string };
  if (tok.accessToken && tok.refreshToken && tok.expiresAt) {
    const { encrypt } = await import("@/lib/crypto");
    await db.stravaToken.upsert({
      where: { userId },
      update: {
        accessToken: encrypt(tok.accessToken),
        refreshToken: encrypt(tok.refreshToken),
        expiresAt: new Date(tok.expiresAt * 1000),
        scope: tok.scope ?? "",
      },
      create: {
        userId,
        accessToken: encrypt(tok.accessToken),
        refreshToken: encrypt(tok.refreshToken),
        expiresAt: new Date(tok.expiresAt * 1000),
        scope: tok.scope ?? "",
      },
    });
  }

  // Reset stuck RUNNING syncs older than 5 minutes
  await db.syncLog.updateMany({
    where: {
      userId,
      status: "RUNNING",
      startedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
    },
    data: { status: "FAILED", error: "Timed out" },
  });

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

  // Use after() so Vercel keeps the function alive until sync completes
  after(async () => {
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
  });

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
