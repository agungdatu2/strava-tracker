import { getDbUser } from "@/lib/get-db-user";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { activityIcon, formatDistance, formatDurationHuman, formatDateTime, formatPace, formatElevation } from "@/lib/utils/format";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { Heart, TrendingUp } from "lucide-react";
import type { ActivityType } from "@/lib/strava";

const PAGE_SIZE = 20;

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ type?: string; page?: string; q?: string }> }) {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const type = sp.type as ActivityType | undefined;
  const q = sp.q;

  const where = {
    userId: dbUser.id,
    ...(type ? { type } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [activities, total] = await Promise.all([
    db.activity.findMany({
      where,
      orderBy: { startDate: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.activity.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const TYPES = ["Run", "Ride", "Swim", "Walk", "Hike", "WeightTraining", "Other"];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aktivitas</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} aktivitas</p>
        </div>
        <ExportMenu />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/activities"
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${!type ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}
        >
          Semua
        </Link>
        {TYPES.map((t) => (
          <Link
            key={t}
            href={`/dashboard/activities?type=${t}`}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${type === t ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}
          >
            {activityIcon(t)} {t}
          </Link>
        ))}
      </div>

      {/* Activity list */}
      <div className="space-y-2">
        {activities.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🏃</p>
            <p className="font-medium">Belum ada aktivitas</p>
            <p className="text-sm">Klik Sync untuk memuat dari Strava</p>
          </div>
        )}
        {activities.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/activities/${a.id}`}
            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent transition-colors"
          >
            <span className="text-3xl">{activityIcon(a.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{a.name}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(a.startDate)}</p>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-sm shrink-0">
              <div className="text-center">
                <p className="font-semibold">{formatDistance(a.distance)}</p>
                <p className="text-xs text-muted-foreground">Jarak</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{formatDurationHuman(a.movingTime)}</p>
                <p className="text-xs text-muted-foreground">Durasi</p>
              </div>
              {(a.type === "Run" || a.type === "Ride") && a.avgSpeed > 0 && (
                <div className="text-center">
                  <p className="font-semibold">
                    {a.type === "Run" ? formatPace(a.avgSpeed) : `${((a.avgSpeed * 3600) / 1000).toFixed(1)} km/h`}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.type === "Run" ? "Pace" : "Kecepatan"}</p>
                </div>
              )}
              <div className="text-center">
                <p className="font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />{formatElevation(a.totalElevation)}
                </p>
                <p className="text-xs text-muted-foreground">Elevasi</p>
              </div>
              {a.avgHeartRate && (
                <div className="text-center">
                  <p className="font-semibold flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-500" />{Math.round(a.avgHeartRate)}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg BPM</p>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <Link href={`/dashboard/activities?page=${page - 1}${type ? `&type=${type}` : ""}`}
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-accent">← Sebelumnya</Link>
          )}
          <span className="text-sm text-muted-foreground">Halaman {page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`/dashboard/activities?page=${page + 1}${type ? `&type=${type}` : ""}`}
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-accent">Berikutnya →</Link>
          )}
        </div>
      )}
    </div>
  );
}
