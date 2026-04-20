import type { Activity, Goal, Badge, UserBadge, SyncLog } from "@prisma/client";

export type ActivityWithUser = Activity & { user?: { name: string | null; image: string | null } };

export type GoalWithProgress = Goal & { progress: number; current: number };

export type BadgeWithEarned = Badge & { earned: boolean; earnedAt?: Date | null };

export type SyncStatus = SyncLog["status"];

export interface DashboardStats {
  totalActivities: number;
  totalDistance: number;       // meters
  totalDuration: number;       // seconds
  totalElevation: number;      // meters
  thisWeekDistance: number;
  thisMonthDistance: number;
  avgPace: number | null;      // sec/km (runs only)
  longestRun: number;          // meters
  currentStreak: number;       // days
}

export interface InsightData {
  period: string;
  bestPace: number | null;
  longestActivity: number;
  mostActiveDay: string;
  mostActiveHour: number;
  avgWeeklyDistance: number;
  hrZones: HRZone[];
  weeklyVolume: WeeklyVolume[];
  activityBreakdown: ActivityBreakdown[];
  paceProgression: PacePoint[];
}

export interface HRZone {
  zone: string;
  label: string;
  minutes: number;
  color: string;
}

export interface WeeklyVolume {
  week: string;
  Run: number;
  Ride: number;
  Other: number;
}

export interface ActivityBreakdown {
  type: string;
  count: number;
  distance: number;
  color: string;
}

export interface PacePoint {
  date: string;
  pace: number; // sec/km
}

export interface CalendarDay {
  date: string;
  activities: { type: string; distance: number; name: string }[];
}
