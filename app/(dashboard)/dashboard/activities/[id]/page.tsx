import { getDbUser } from "@/lib/get-db-user";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  activityIcon, formatDistance, formatDurationHuman, formatDateTime,
  formatPace, formatSpeed, formatElevation, formatHeartRate, formatCalories
} from "@/lib/utils/format";
import { ActivityMap } from "@/components/activities/ActivityMap";
import { ShareButton } from "@/components/share/ShareButton";
import { auth } from "@/lib/auth";
import { ArrowLeft, Heart, TrendingUp, Zap, Flame, Timer, Route, Award } from "lucide-react";

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [dbUser, session] = await Promise.all([getDbUser(), auth()]);
  if (!dbUser) redirect("/login");
  const { id } = await params;

  const activity = await db.activity.findFirst({
    where: { id, userId: dbUser.id },
  });
  if (!activity) notFound();

  const stats = [
    { label: "Jarak", value: formatDistance(activity.distance), icon: Route },
    { label: "Durasi", value: formatDurationHuman(activity.movingTime), icon: Timer },
    { label: "Elevasi", value: formatElevation(activity.totalElevation), icon: TrendingUp },
    ...(activity.type === "Run" && activity.avgSpeed > 0
      ? [{ label: "Pace", value: formatPace(activity.avgSpeed), icon: Zap }]
      : [{ label: "Kecepatan", value: formatSpeed(activity.avgSpeed), icon: Zap }]),
    ...(activity.avgHeartRate ? [{ label: "Avg HR", value: formatHeartRate(activity.avgHeartRate), icon: Heart }] : []),
    ...(activity.maxHeartRate ? [{ label: "Max HR", value: formatHeartRate(activity.maxHeartRate), icon: Heart }] : []),
    ...(activity.calories ? [{ label: "Kalori", value: formatCalories(activity.calories), icon: Flame }] : []),
    { label: "Kudos", value: String(activity.kudosCount), icon: Award },
  ];

  const laps: { index: number; distance: number; moving_time: number; average_speed: number }[] =
    activity.laps ? JSON.parse(activity.laps as string) : [];

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* Back */}
      <Link href="/dashboard/activities" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Aktivitas
      </Link>

      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{activityIcon(activity.type)}</span>
          <div>
            <h1 className="text-2xl font-bold">{activity.name}</h1>
            <p className="text-sm text-muted-foreground">{formatDateTime(activity.startDate)} · {activity.type}</p>
          </div>
        </div>
        <ShareButton activity={activity} athleteName={session?.user?.name ?? undefined} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4 text-center">
            <Icon className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Map */}
      {activity.mapPolyline && (
        <ActivityMap polyline={activity.mapPolyline} className="h-64 md:h-80 rounded-xl overflow-hidden border" />
      )}

      {/* Description */}
      {activity.description && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">Deskripsi</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{activity.description}</p>
        </div>
      )}

      {/* Laps */}
      {laps.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Lap</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-2 font-medium">Lap</th>
                  <th className="pb-2 font-medium">Jarak</th>
                  <th className="pb-2 font-medium">Waktu</th>
                  <th className="pb-2 font-medium">Pace</th>
                </tr>
              </thead>
              <tbody>
                {laps.map((lap) => (
                  <tr key={lap.index} className="border-b last:border-0">
                    <td className="py-2">{lap.index}</td>
                    <td className="py-2">{formatDistance(lap.distance)}</td>
                    <td className="py-2">{formatDurationHuman(lap.moving_time)}</td>
                    <td className="py-2">{formatPace(lap.average_speed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strava link */}
      <a
        href={`https://www.strava.com/activities/${activity.stravaId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        Lihat di Strava →
      </a>
    </div>
  );
}
