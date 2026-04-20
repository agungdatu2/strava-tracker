import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDbUser } from "@/lib/get-db-user";
import { db } from "@/lib/db";
import { activitiesToCSV, generatePDFReport } from "@/lib/utils/export";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fmt = req.nextUrl.searchParams.get("format") ?? "csv";
  const activities = await db.activity.findMany({
    where: { userId: user.id },
    orderBy: { startDate: "desc" },
  });

  const dateStr = format(new Date(), "yyyy-MM-dd");

  if (fmt === "pdf") {
    const blob = await generatePDFReport(activities, session.user.name ?? "Athlete", `s/d ${dateStr}`);
    const buffer = await blob.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="strava-report-${dateStr}.pdf"`,
      },
    });
  }

  const csv = activitiesToCSV(activities);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="strava-activities-${dateStr}.csv"`,
    },
  });
}
