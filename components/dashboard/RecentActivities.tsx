import Link from "next/link";
import type { Activity } from "@prisma/client";
import { activityIcon, formatDistance, formatDurationHuman, formatDateShort, formatPace } from "@/lib/utils/format";
import { ArrowRight } from "lucide-react";

interface Props { activities: Activity[] }

export function RecentActivities({ activities }: Props) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Aktivitas Terkini</h3>
        <Link href="/dashboard/activities" className="text-xs text-primary flex items-center gap-1 hover:underline">
          Lihat semua <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {activities.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Belum ada aktivitas. Klik Sync untuk memuat dari Strava.
          </p>
        )}
        {activities.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/activities/${a.id}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
          >
            <span className="text-2xl">{activityIcon(a.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{a.name}</p>
              <p className="text-xs text-muted-foreground">{formatDateShort(a.startDate)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold">{formatDistance(a.distance)}</p>
              <p className="text-xs text-muted-foreground">
                {formatDurationHuman(a.movingTime)}
                {a.type === "Run" && a.avgSpeed > 0 && ` · ${formatPace(a.avgSpeed)}`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
