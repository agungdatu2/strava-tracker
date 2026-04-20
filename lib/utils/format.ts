// ─── Distance ──────────────────────────────────────────────────────────────

export function formatDistance(meters: number, unit: "km" | "mi" = "km"): string {
  if (unit === "mi") return `${(meters / 1609.34).toFixed(2)} mi`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatDistanceShort(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// ─── Duration ──────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDurationHuman(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// ─── Pace ──────────────────────────────────────────────────────────────────

export function formatPace(avgSpeedMs: number): string {
  if (avgSpeedMs <= 0) return "--";
  const secPerKm = 1000 / avgSpeedMs;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

// ─── Speed ─────────────────────────────────────────────────────────────────

export function formatSpeed(avgSpeedMs: number): string {
  return `${((avgSpeedMs * 3600) / 1000).toFixed(1)} km/h`;
}

// ─── Elevation ─────────────────────────────────────────────────────────────

export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}

// ─── Calories ──────────────────────────────────────────────────────────────

export function formatCalories(cal: number): string {
  return `${Math.round(cal)} kcal`;
}

// ─── Heart Rate ────────────────────────────────────────────────────────────

export function formatHeartRate(bpm: number): string {
  return `${Math.round(bpm)} bpm`;
}

// ─── Activity type display ─────────────────────────────────────────────────

export const ACTIVITY_ICONS: Record<string, string> = {
  Run: "🏃",
  Ride: "🚴",
  Swim: "🏊",
  Walk: "🚶",
  Hike: "🥾",
  WeightTraining: "🏋️",
  Yoga: "🧘",
  Crossfit: "💪",
  Rowing: "🚣",
  Skiing: "⛷️",
  Snowboard: "🏂",
  Soccer: "⚽",
  Tennis: "🎾",
  Workout: "🏃",
  Other: "🏅",
};

export function activityIcon(type: string): string {
  return ACTIVITY_ICONS[type] ?? "🏅";
}

// ─── Date formatting ───────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
