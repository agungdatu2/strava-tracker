import { getDbUser } from "@/lib/get-db-user";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatDistance, formatPace, formatDurationHuman } from "@/lib/utils/format";
import { PaceProgressionChart } from "@/components/dashboard/PaceProgressionChart";
import { subDays, format, eachWeekOfInterval, subWeeks } from "date-fns";
import type { PacePoint } from "@/types/app";

const DAYS_OF_WEEK = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default async function InsightsPage() {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/login");
  const userId = dbUser.id;

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const ninetyDaysAgo = subDays(now, 90);

  const [allActivities, recentActivities] = await Promise.all([
    db.activity.findMany({
      where: { userId },
      select: { type: true, distance: true, movingTime: true, avgSpeed: true, avgHeartRate: true, startDate: true, totalElevation: true },
      orderBy: { startDate: "asc" },
    }),
    db.activity.findMany({
      where: { userId, startDate: { gte: ninetyDaysAgo } },
      select: { type: true, distance: true, movingTime: true, avgSpeed: true, startDate: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const runs = allActivities.filter((a) => a.type === "Run" && a.avgSpeed > 0 && a.distance >= 1000);

  // Best pace
  const bestPace = runs.length ? Math.min(...runs.map((a) => 1000 / a.avgSpeed)) : null;

  // Longest activity
  const longest = allActivities.reduce((max, a) => a.distance > max ? a.distance : max, 0);

  // Most active day of week
  const dayCount = new Array(7).fill(0);
  allActivities.forEach((a) => dayCount[new Date(a.startDate).getDay()]++);
  const mostActiveDay = DAYS_OF_WEEK[dayCount.indexOf(Math.max(...dayCount))];

  // Most active hour
  const hourCount = new Array(24).fill(0);
  allActivities.forEach((a) => hourCount[new Date(a.startDate).getHours()]++);
  const mostActiveHour = hourCount.indexOf(Math.max(...hourCount));

  // 30-day stats
  const recent30 = allActivities.filter((a) => new Date(a.startDate) >= thirtyDaysAgo);
  const recent30Dist = recent30.reduce((s, a) => s + a.distance, 0);
  const recent30Time = recent30.reduce((s, a) => s + a.movingTime, 0);

  // Streak
  const activityDates = new Set(allActivities.map((a) => format(new Date(a.startDate), "yyyy-MM-dd")));
  let streak = 0;
  let check = now;
  while (activityDates.has(format(check, "yyyy-MM-dd"))) { streak++; check = subDays(check, 1); }

  // Pace progression (last 12 weeks, runs only)
  const weeks = eachWeekOfInterval({ start: subWeeks(now, 11), end: now }, { weekStartsOn: 1 });
  const paceProgression: PacePoint[] = weeks
    .map((wk) => {
      const wkEnd = new Date(wk); wkEnd.setDate(wk.getDate() + 6);
      const wkRuns = recentActivities.filter((a) => {
        const d = new Date(a.startDate);
        return a.type === "Run" && a.avgSpeed > 0 && a.distance >= 1000 && d >= wk && d <= wkEnd;
      });
      if (!wkRuns.length) return null;
      const avgSecPerKm = wkRuns.reduce((s, a) => s + 1000 / a.avgSpeed, 0) / wkRuns.length;
      return { date: format(wk, "d/M"), pace: Math.round(avgSecPerKm) };
    })
    .filter(Boolean) as PacePoint[];

  // HR zones (approximate, needs max HR)
  const maxHR = allActivities.reduce((m, a) => (a.avgHeartRate ?? 0) > m ? (a.avgHeartRate ?? 0) : m, 0);
  const hrZones = maxHR > 0 ? [
    { zone: "Z1", label: "Recovery", pct: [0.5, 0.6], color: "#22C55E" },
    { zone: "Z2", label: "Aerobik", pct: [0.6, 0.7], color: "#3B82F6" },
    { zone: "Z3", label: "Tempo", pct: [0.7, 0.8], color: "#F59E0B" },
    { zone: "Z4", label: "Threshold", pct: [0.8, 0.9], color: "#EF4444" },
    { zone: "Z5", label: "VO2 Max", pct: [0.9, 1.0], color: "#8B5CF6" },
  ].map((z) => {
    const lo = z.pct[0] * maxHR, hi = z.pct[1] * maxHR;
    const mins = allActivities.filter((a) => (a.avgHeartRate ?? 0) >= lo && (a.avgHeartRate ?? 0) < hi)
      .reduce((s, a) => s + a.movingTime, 0) / 60;
    return { ...z, minutes: Math.round(mins) };
  }) : [];

  const insightCards = [
    { label: "Best Pace", value: bestPace ? formatPace(1000 / bestPace) : "--", icon: "⚡" },
    { label: "Aktivitas Terpanjang", value: formatDistance(longest), icon: "📏" },
    { label: "Hari Paling Aktif", value: mostActiveDay, icon: "📅" },
    { label: "Jam Favorit", value: `${mostActiveHour}:00`, icon: "🕐" },
    { label: "Streak Saat Ini", value: `${streak} hari`, icon: "🔥" },
    { label: "30 Hari Terakhir", value: formatDistance(recent30Dist), icon: "📍", sub: formatDurationHuman(recent30Time) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Insight</h1>
        <p className="text-sm text-muted-foreground">Analisis performa kamu</p>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {insightCards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-4 space-y-1">
            <p className="text-2xl">{c.icon}</p>
            <p className="text-xl font-bold">{c.value}</p>
            {c.sub && <p className="text-xs text-muted-foreground">{c.sub}</p>}
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Pace progression */}
      {paceProgression.length > 0 && <PaceProgressionChart data={paceProgression} />}

      {/* HR zones */}
      {hrZones.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold">Distribusi HR Zone</h3>
          {hrZones.map((z) => (
            <div key={z.zone} className="flex items-center gap-3">
              <span className="w-6 text-xs font-mono text-muted-foreground">{z.zone}</span>
              <span className="w-20 text-xs text-muted-foreground">{z.label}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (z.minutes / Math.max(...hrZones.map((x) => x.minutes), 1)) * 100)}%`,
                    backgroundColor: z.color,
                  }}
                />
              </div>
              <span className="w-16 text-xs text-right text-muted-foreground">{z.minutes} mnt</span>
            </div>
          ))}
        </div>
      )}

      {/* Day of week heatmap */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4">Aktivitas per Hari</h3>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day, i) => (
            <div key={day} className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{day}</p>
              <div className="rounded-lg py-3 text-sm font-bold" style={{
                backgroundColor: `rgba(252, 76, 2, ${Math.min(1, dayCount[i] / Math.max(...dayCount, 1))})`,
                color: dayCount[i] > 0 ? "white" : undefined,
              }}>
                {dayCount[i]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
