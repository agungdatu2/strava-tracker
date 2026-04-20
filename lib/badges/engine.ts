import { db } from "@/lib/db";
import type { ActivityType } from "@/lib/strava";

interface BadgeCriteria {
  type: string;
  min?: number;
  sport?: string;
  maxSecPerKm?: number;
  maxHour?: number;
  minHour?: number;
  streak_days?: number;
}

export async function evaluateBadges(userId: string): Promise<string[]> {
  const badges = await db.badge.findMany();
  const earned = await db.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const earnedIds = new Set(earned.map((e) => e.badgeId));
  const activities = await db.activity.findMany({
    where: { userId },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      type: true,
      distance: true,
      movingTime: true,
      totalElevation: true,
      avgSpeed: true,
      startDate: true,
    },
  });

  const newBadges: string[] = [];

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;

    const criteria = (typeof badge.criteria === "string"
      ? JSON.parse(badge.criteria)
      : badge.criteria) as BadgeCriteria;
    const earned = await checkCriteria(criteria, activities);

    if (earned) {
      await db.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
      newBadges.push(badge.slug);
    }
  }

  return newBadges;
}

type ActivitySummary = {
  id: string;
  type: string;
  distance: number;
  movingTime: number;
  totalElevation: number;
  avgSpeed: number;
  startDate: Date;
};

async function checkCriteria(
  criteria: BadgeCriteria,
  activities: ActivitySummary[]
): Promise<boolean> {
  switch (criteria.type) {
    case "total_count":
      return activities.length >= (criteria.min ?? 0);

    case "single_distance": {
      const sport = criteria.sport as ActivityType | undefined;
      const filtered = sport ? activities.filter((a) => a.type === sport) : activities;
      return filtered.some((a) => a.distance >= (criteria.min ?? 0));
    }

    case "cumulative_distance": {
      const sport = criteria.sport as ActivityType | undefined;
      const filtered = sport ? activities.filter((a) => a.type === sport) : activities;
      const total = filtered.reduce((sum, a) => sum + a.distance, 0);
      return total >= (criteria.min ?? 0);
    }

    case "cumulative_elevation": {
      const total = activities.reduce((sum, a) => sum + a.totalElevation, 0);
      return total >= (criteria.min ?? 0);
    }

    case "single_elevation":
      return activities.some((a) => a.totalElevation >= (criteria.min ?? 0));

    case "pace": {
      const sport = criteria.sport as ActivityType | undefined;
      const filtered = sport ? activities.filter((a) => a.type === sport) : activities;
      return filtered.some((a) => {
        if (a.avgSpeed <= 0 || a.distance < 1000) return false;
        const secPerKm = 1000 / a.avgSpeed;
        return secPerKm <= (criteria.maxSecPerKm ?? Infinity);
      });
    }

    case "streak_days": {
      const minStreak = criteria.min ?? criteria.streak_days ?? 0;
      return calculateMaxStreak(activities) >= minStreak;
    }

    case "start_hour": {
      return activities.some((a) => {
        const hour = a.startDate.getHours();
        if (criteria.maxHour !== undefined) return hour < criteria.maxHour;
        if (criteria.minHour !== undefined) return hour >= criteria.minHour;
        return false;
      });
    }

    case "unique_sports": {
      const sports = new Set(activities.map((a) => a.type));
      return sports.size >= (criteria.min ?? 0);
    }

    default:
      return false;
  }
}

function calculateMaxStreak(activities: ActivitySummary[]): number {
  if (!activities.length) return 0;

  const days = new Set(
    activities.map((a) => {
      const d = new Date(a.startDate);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const sorted = Array.from(days).sort();
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
    if (diff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diff > 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
}
