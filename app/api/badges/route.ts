import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [badges, earned] = await Promise.all([
    db.badge.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    db.userBadge.findMany({ where: { userId: user.id } }),
  ]);

  const earnedSet = new Set(earned.map((e) => e.badgeId));
  return NextResponse.json(badges.map((b) => ({ ...b, earned: earnedSet.has(b.id) })));
}
