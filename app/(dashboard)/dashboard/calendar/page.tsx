import { getDbUser } from "@/lib/get-db-user";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { WorkoutCalendar } from "@/components/calendar/WorkoutCalendar";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/login");

  const sp = await searchParams;
  const monthStr = sp.month ?? format(new Date(), "yyyy-MM");
  const [year, mon] = monthStr.split("-").map(Number);
  const start = startOfMonth(new Date(year, mon - 1));
  const end = endOfMonth(start);

  const activities = await db.activity.findMany({
    where: { userId: dbUser.id, startDate: { gte: start, lte: end } },
    select: { id: true, name: true, type: true, distance: true, startDate: true, movingTime: true },
    orderBy: { startDate: "asc" },
  });

  const calendarData = activities.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    distance: a.distance,
    movingTime: a.movingTime,
    date: format(new Date(a.startDate), "yyyy-MM-dd"),
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Kalender Aktivitas</h1>
        <p className="text-sm text-muted-foreground">{activities.length} aktivitas bulan ini</p>
      </div>
      <WorkoutCalendar activities={calendarData} month={monthStr} />
    </div>
  );
}
