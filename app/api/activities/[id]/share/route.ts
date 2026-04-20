import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const activity = await db.activity.findFirst({
    where: { id, userId: user.id },
    select: { id: true, shareId: true },
  });
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Return existing shareId or generate a new one
  if (activity.shareId) {
    return NextResponse.json({ shareId: activity.shareId });
  }

  const shareId = nanoid(12);
  await db.activity.update({ where: { id }, data: { shareId } });

  return NextResponse.json({ shareId });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.activity.updateMany({
    where: { id, userId: user.id },
    data: { shareId: null },
  });

  return NextResponse.json({ ok: true });
}
