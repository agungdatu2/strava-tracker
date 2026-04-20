import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["DISTANCE", "DURATION", "COUNT", "ELEVATION"]),
  activityType: z.string().optional(),
  target: z.number().positive(),
  period: z.enum(["WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]),
  startDate: z.string(),
  endDate: z.string(),
});

export async function GET() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const goals = await db.goal.findMany({ where: { userId: user.id, isActive: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { title, type, activityType, target, period, startDate, endDate } = parsed.data;
  const unitMap: Record<string, string> = { DISTANCE: "km", DURATION: "hours", COUNT: "count", ELEVATION: "m" };

  const goal = await db.goal.create({
    data: {
      userId: user.id,
      title,
      type,
      activityType: activityType || null,
      target,
      unit: unitMap[type],
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
