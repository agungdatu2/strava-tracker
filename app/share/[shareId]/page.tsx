import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ShareCard } from "@/components/share/ShareCard";
import { formatDistance, formatDurationHuman, formatElevation } from "@/lib/utils/format";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const activity = await db.activity.findUnique({
    where: { shareId },
    include: { user: { select: { name: true } } },
  });
  if (!activity) return { title: "Aktivitas tidak ditemukan" };

  return {
    title: `${activity.name} · ${activity.user.name ?? "Athlete"}`,
    description: `${formatDistance(activity.distance)} · ${formatDurationHuman(activity.movingTime)} · ${formatElevation(activity.totalElevation)} elevasi`,
    openGraph: {
      title: activity.name,
      description: `${formatDistance(activity.distance)} dalam ${formatDurationHuman(activity.movingTime)}`,
      type: "website",
    },
  };
}

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  const activity = await db.activity.findUnique({
    where: { shareId },
    include: { user: { select: { name: true, image: true } } },
  });
  if (!activity) notFound();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 gap-6">
      {/* Card */}
      <ShareCard
        activity={activity}
        athleteName={activity.user.name ?? undefined}
        theme={{ id: "sport", label: "Sport", from: "#FC4C02", to: "#E64A19" }}
      />

      {/* Stats detail */}
      <div className="w-full max-w-[480px] rounded-2xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          {activity.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activity.user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
          )}
          <div>
            <p className="font-semibold">{activity.user.name}</p>
            <p className="text-xs text-muted-foreground">{activity.type} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(activity.startDate))}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Jarak" value={formatDistance(activity.distance)} />
          <Stat label="Durasi" value={formatDurationHuman(activity.movingTime)} />
          <Stat label="Elevasi" value={formatElevation(activity.totalElevation)} />
          {activity.avgHeartRate && <Stat label="Avg HR" value={`${Math.round(activity.avgHeartRate)} bpm`} />}
          {activity.calories && <Stat label="Kalori" value={`${Math.round(activity.calories)} kcal`} />}
        </div>

        {activity.description && (
          <p className="text-sm text-muted-foreground border-t pt-3 whitespace-pre-line">
            {activity.description}
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">Lacak aktivitasmu sendiri</p>
        <Link
          href="/login"
          className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Mulai dengan Strava
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-base font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
