import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

const STRAVA_API = "https://www.strava.com/api/v3";

// ─── Token Management ──────────────────────────────────────────────────────

export async function getValidToken(userId: string): Promise<string> {
  const record = await db.stravaToken.findUniqueOrThrow({ where: { userId } });

  // Refresh if expired (with 60s buffer)
  if (record.expiresAt.getTime() < Date.now() + 60_000) {
    const refreshToken = decrypt(record.refreshToken);
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Strava token refresh failed: ${err}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };

    await db.stravaToken.update({
      where: { userId },
      data: {
        accessToken: encrypt(data.access_token),
        refreshToken: encrypt(data.refresh_token),
        expiresAt: new Date(data.expires_at * 1000),
      },
    });

    return data.access_token;
  }

  return decrypt(record.accessToken);
}

// ─── Generic Strava fetch ──────────────────────────────────────────────────

async function stravaFetch<T>(
  userId: string,
  path: string,
  params?: Record<string, string | number>
): Promise<T> {
  const token = await getValidToken(userId);
  const url = new URL(`${STRAVA_API}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Strava API error ${res.status}: ${err}`);
  }

  return res.json() as Promise<T>;
}

// ─── Athlete ───────────────────────────────────────────────────────────────

export async function getAthlete(userId: string) {
  return stravaFetch<StravaAthlete>(userId, "/athlete");
}

// ─── Activities ────────────────────────────────────────────────────────────

export async function fetchActivitiesPage(
  userId: string,
  page: number,
  perPage = 100,
  after?: number
) {
  const params: Record<string, number> = { page, per_page: perPage };
  if (after) params.after = after;
  return stravaFetch<StravaActivity[]>(userId, "/athlete/activities", params);
}

export async function fetchActivityById(userId: string, stravaActivityId: string) {
  return stravaFetch<StravaActivity>(userId, `/activities/${stravaActivityId}`, {
    include_all_efforts: 1,
  });
}

// ─── Sync: fetch all activities since last sync ───────────────────────────

export async function syncActivities(
  userId: string,
  afterTimestamp?: number,
  onPage?: (count: number) => void
): Promise<{ synced: number; pages: number }> {
  let page = 1;
  let totalSynced = 0;
  let totalPages = 0;

  while (true) {
    const activities = await fetchActivitiesPage(userId, page, 100, afterTimestamp);
    if (!activities.length) break;

    for (const act of activities) {
      await upsertActivity(userId, act);
      totalSynced++;
    }

    totalPages++;
    onPage?.(totalSynced);

    if (activities.length < 100) break;
    page++;
  }

  return { synced: totalSynced, pages: totalPages };
}

// ─── Upsert a single Strava activity into DB ──────────────────────────────

export async function upsertActivity(userId: string, act: StravaActivity) {
  const type = mapSportType(act.sport_type ?? act.type);

  await db.activity.upsert({
    where: { stravaId: String(act.id) },
    update: {
      name: act.name,
      kudosCount: act.kudos_count ?? 0,
      commentsCount: act.comment_count ?? 0,
      achievementCount: act.achievement_count ?? 0,
      rawData: JSON.stringify(act),
      syncedAt: new Date(),
    },
    create: {
      stravaId: String(act.id),
      userId,
      name: act.name,
      type,
      sportType: act.sport_type ?? act.type,
      startDate: new Date(act.start_date),
      timezone: act.timezone ?? "UTC",
      distance: act.distance ?? 0,
      movingTime: act.moving_time ?? 0,
      elapsedTime: act.elapsed_time ?? 0,
      totalElevation: act.total_elevation_gain ?? 0,
      avgSpeed: act.average_speed ?? 0,
      maxSpeed: act.max_speed ?? 0,
      avgHeartRate: act.average_heartrate ?? null,
      maxHeartRate: act.max_heartrate ?? null,
      avgCadence: act.average_cadence ?? null,
      avgWatts: act.average_watts ?? null,
      weightedAvgWatts: act.weighted_average_watts ?? null,
      calories: act.calories ?? null,
      kudosCount: act.kudos_count ?? 0,
      commentsCount: act.comment_count ?? 0,
      achievementCount: act.achievement_count ?? 0,
      mapPolyline: act.map?.summary_polyline ?? null,
      mapPolylineDetail: act.map?.polyline ?? null,
      startLat: act.start_latlng?.[0] ?? null,
      startLng: act.start_latlng?.[1] ?? null,
      endLat: act.end_latlng?.[0] ?? null,
      endLng: act.end_latlng?.[1] ?? null,
      gearId: act.gear_id ?? null,
      gearName: act.gear?.name ?? null,
      description: act.description ?? null,
      laps: act.laps ? JSON.stringify(act.laps) : null,
      splits: act.splits_metric ? JSON.stringify(act.splits_metric) : null,
      rawData: JSON.stringify(act),
    },
  });
}

// ─── Sport type mapping ────────────────────────────────────────────────────

export type ActivityType = "Run"|"Ride"|"Swim"|"Walk"|"Hike"|"WeightTraining"|"Yoga"|"Crossfit"|"Rowing"|"Skiing"|"Snowboard"|"Soccer"|"Tennis"|"Workout"|"Other";

export function mapSportType(sport: string): ActivityType {
  const map: Record<string, ActivityType> = {
    Run: "Run", VirtualRun: "Run", TrailRun: "Run",
    Ride: "Ride", VirtualRide: "Ride", EBikeRide: "Ride", MountainBikeRide: "Ride",
    Swim: "Swim", OpenWaterSwim: "Swim",
    Walk: "Walk",
    Hike: "Hike",
    WeightTraining: "WeightTraining",
    Yoga: "Yoga",
    Crossfit: "Crossfit",
    Rowing: "Rowing", VirtualRow: "Rowing",
    AlpineSki: "Skiing", BackcountrySki: "Skiing", NordicSki: "Skiing",
    Snowboard: "Snowboard",
    Soccer: "Soccer", Football: "Soccer",
    Tennis: "Tennis",
    Workout: "Workout",
  };
  return map[sport] ?? "Other";
}

// ─── Strava Types ──────────────────────────────────────────────────────────

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  email?: string;
  city?: string;
  country?: string;
  sex?: string;
  premium?: boolean;
  created_at?: string;
  updated_at?: string;
  follower_count?: number;
  friend_count?: number;
  measurement_preference?: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  timezone?: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  calories?: number;
  kudos_count?: number;
  comment_count?: number;
  achievement_count?: number;
  map?: { summary_polyline?: string; polyline?: string };
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  gear_id?: string;
  gear?: { name?: string };
  description?: string;
  laps?: object[];
  splits_metric?: object[];
}
