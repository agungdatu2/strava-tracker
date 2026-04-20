import { auth } from "@/lib/auth";
import { getDbUser } from "@/lib/get-db-user";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { ActivityBreakdownChart } from "@/components/dashboard/ActivityBreakdownChart";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { WeeklyHeatmap } from "@/components/dashboard/WeeklyHeatmap";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { formatDistance, formatDurationHuman, formatPace } from "@/lib/utils/format";
import { Route, Timer, TrendingUp, Flame, Zap, Trophy } from "lucide-react";
import { subDays, startOfWeek, startOfMonth, format, eachWeekOfInterval, subWeeks } from "date-fns";
import type { WeeklyVolume, ActivityBreakdown } from "@/types/app";

const SPORT_COLORS: Record<string, string> = {
  Run: "#FC4C02", Ride: "#3B82F6", Swim: "#06B6D4",
  Walk: "#22C55E", Hike: "#84CC16", WeightTraining: "#F59E0B",
  Other: "#8B5CF6",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/login");
  const userId = dbUser.id;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const [allActivities, recentActivities, weekActivities, monthActivities] = await Promise.all([
    db.activity.findMany({ where: { userId }, select: { distance: true, movingTime: true, totalElevation: true, type: true, avgSpeed: true, startDate: true } }),
    db.activity.findMany({ where: { userId }, orderBy: { startDate: "desc" }, take: 8 }),
    db.activity.findMany({ where: { userId, startDate: { gte: weekStart } }, select: { distance: true } }),
    db.activity.findMany({ where: { userId, startDate: { gte: monthStart } }, select: { distance: true } }),
  ]);

  const totalDistance = allActivities.reduce((s, a) => s + a.distance, 0);
  const totalDuration = allActivities.reduce((s, a) => s + a.movingTime, 0);
  const totalElevation = allActivities.reduce((s, a) => s + a.totalElevation, 0);
  const weekDistance = weekActivities.reduce((s, a) => s + a.distance, 0);
  const monthDistance = monthActivities.reduce((s, a) => s + a.distance, 0);

  const runs = allActivities.filter((a) => a.type === "Run" && a.avgSpeed > 0);
  const avgPace = runs.length ? runs.reduce((s, a) => s + 1000 / a.avgSpeed, 0) / runs.length : null;

  // Streak calculation
  const activityDates = new Set(allActivities.map((a) => format(new Date(a.startDate), "yyyy-MM-dd")));
  let streak = 0;
  let check = now;
  while (activityDates.has(format(check, "yyyy-MM-dd"))) {
    streak++;
    check = subDays(check, 1);
  }

  // Weekly volume chart (last 12 weeks)
  const weeks = eachWeekOfInterval({ start: subWeeks(now, 11), end: now }, { weekStartsOn: 1 });
  const weeklyVolume: WeeklyVolume[] = weeks.map((wk) => {
    const wkEnd = new Date(wk); wkEnd.setDate(wk.getDate() + 6);
    const inRange = allActivities.filter((a) => {
      const d = new Date(a.startDate);
      return d >= wk && d <= wkEnd;
    });
    return {
      week: format(wk, "d/M"),
      Run: parseFloat((inRange.filter((a) => a.type === "Run").reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1)),
      Ride: parseFloat((inRange.filter((a) => a.type === "Ride").reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1)),
      Other: parseFloat((inRange.filter((a) => a.type !== "Run" && a.type !== "Ride").reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1)),
    };
  });

  // Activity breakdown
  const typeMap = new Map<string, { count: number; distance: number }>();
  allActivities.forEach((a) => {
    const e = typeMap.get(a.type) ?? { count: 0, distance: 0 };
    typeMap.set(a.type, { count: e.count + 1, distance: e.distance + a.distance });
  });
  const breakdown: ActivityBreakdown[] = Array.from(typeMap.entries()).map(([type, v]) => ({
    type, count: v.count, distance: v.distance, color: SPORT_COLORS[type] ?? "#8B5CF6",
  }));

  // Heatmap data
  const heatmapData = Array.from(activityDates).map((date) => {
    const dist = allActivities.filter((a) => format(new Date(a.startDate), "yyyy-MM-dd") === date).reduce((s, a) => s + a.distance, 0);
    return { date, count: 1, distance: dist };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Selamat datang, {session.user.name?.split(" ")[0]}</p>
        </div>
        <ExportMenu />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard title="Total Aktivitas" value={String(allActivities.length)} icon={Trophy} className="col-span-1" />
        <StatsCard title="Total Jarak" value={formatDistance(totalDistance)} sub="semua waktu" icon={Route} className="col-span-1" />
        <StatsCard title="Total Durasi" value={formatDurationHuman(totalDuration)} icon={Timer} className="col-span-1" />
        <StatsCard title="Total Elevasi" value={`${Math.round(totalElevation).toLocaleString()} m`} icon={TrendingUp} className="col-span-1" />
        <StatsCard title="Minggu Ini" value={formatDistance(weekDistance)} sub={`Bulan ini: ${formatDistance(monthDistance)}`} icon={Flame} className="col-span-1" />
        <StatsCard
          title="Avg Pace (Lari)"
          value={avgPace ? formatPace(1000 / avgPace) : "--"}
          sub={`Streak: ${streak} hari`}
          icon={Zap}
          className="col-span-1"
        />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <ActivityChart data={weeklyVolume} />
        </div>
        <ActivityBreakdownChart data={breakdown} />
      </div>

      {/* Heatmap + Recent */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <WeeklyHeatmap data={heatmapData} />
        </div>
        <div className="md:col-span-3">
          <RecentActivities activities={recentActivities} />
        </div>
      </div>
    </div>
  );
}
