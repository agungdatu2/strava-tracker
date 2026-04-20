import { getDbUser } from "@/lib/get-db-user";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils/format";
type BadgeCategory = "MILESTONE"|"STREAK"|"DISTANCE"|"SPEED"|"ELEVATION"|"SPECIAL";

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  MILESTONE: "Pencapaian",
  STREAK: "Streak",
  DISTANCE: "Jarak",
  SPEED: "Kecepatan",
  ELEVATION: "Elevasi",
  SPECIAL: "Spesial",
};

export default async function BadgesPage() {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/login");

  const [allBadges, earnedBadges] = await Promise.all([
    db.badge.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    db.userBadge.findMany({ where: { userId: dbUser.id }, include: { badge: true } }),
  ]);

  const earnedMap = new Map(earnedBadges.map((ub) => [ub.badgeId, ub.earnedAt]));
  const earnedCount = earnedBadges.length;

  const categories = Array.from(new Set(allBadges.map((b) => b.category)));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Badge & Pencapaian</h1>
        <p className="text-sm text-muted-foreground">{earnedCount} / {allBadges.length} badge diraih</p>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress keseluruhan</span>
          <span className="font-semibold">{earnedCount}/{allBadges.length}</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(earnedCount / allBadges.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Badges by category */}
      {categories.map((category) => {
        const badges = allBadges.filter((b) => b.category === category);
        return (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {CATEGORY_LABELS[category as BadgeCategory] ?? category}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {badges.map((badge) => {
                const earnedAt = earnedMap.get(badge.id);
                const earned = !!earnedAt;
                return (
                  <div
                    key={badge.id}
                    className={`rounded-xl border p-4 text-center space-y-2 transition-all ${
                      earned
                        ? "bg-card border-primary/30 shadow-sm"
                        : "bg-muted/30 opacity-50 grayscale"
                    }`}
                  >
                    <p className="text-3xl">{badge.icon}</p>
                    <p className="text-sm font-semibold leading-tight">{badge.name}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{badge.description}</p>
                    {earned && earnedAt && (
                      <p className="text-xs text-primary font-medium">{formatDate(earnedAt)}</p>
                    )}
                    {!earned && <p className="text-xs text-muted-foreground">Belum diraih</p>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
