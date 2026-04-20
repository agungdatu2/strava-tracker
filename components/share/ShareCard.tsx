"use client";
import { formatDistance, formatDurationHuman, formatPace, formatSpeed, formatElevation } from "@/lib/utils/format";

export type ShareTheme = {
  id: string;
  label: string;
  from: string;
  to: string;
};

export type ShareLayoutId =
  | "classic" | "overlay" | "split" | "hero"
  | "minimal" | "neon" | "retro" | "podium"
  | "story" | "clean";

export type ShareLayout = {
  id: ShareLayoutId;
  label: string;
  description: string;
};

export const SHARE_LAYOUTS: ShareLayout[] = [
  { id: "classic",  label: "Classic",  description: "Peta atas, stats bawah" },
  { id: "overlay",  label: "Overlay",  description: "Stats melayang di atas peta" },
  { id: "split",    label: "Split",    description: "Peta kiri, stats kanan" },
  { id: "hero",     label: "Hero",     description: "Jarak besar + peta kecil" },
  { id: "minimal",  label: "Minimal",  description: "Bersih tanpa peta, fokus data" },
  { id: "neon",     label: "Neon",     description: "Dark mode + glow neon" },
  { id: "retro",    label: "Retro",    description: "Gaya vintage bold" },
  { id: "podium",   label: "Podium",   description: "Tiga stat utama besar" },
  { id: "story",    label: "Story",    description: "Format portrait untuk Instagram" },
  { id: "clean",    label: "Clean",    description: "Putih bersih modern" },
];

export type ShareCardActivity = {
  name: string;
  type: string;
  startDate: Date | string;
  distance: number;
  movingTime: number;
  totalElevation: number;
  avgSpeed: number;
  avgHeartRate?: number | null;
  calories?: number | null;
  mapPolyline?: string | null;
};

type ShareCardProps = {
  activity: ShareCardActivity;
  athleteName?: string;
  theme: ShareTheme;
  layout?: ShareLayoutId;
  cardRef?: React.RefObject<HTMLDivElement | null>;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const SPORT_EMOJIS: Record<string, string> = {
  Run: "🏃", Ride: "🚴", Swim: "🏊", Walk: "🚶",
  Hike: "🥾", WeightTraining: "🏋️", VirtualRide: "🚴",
  AlpineSki: "⛷️", Yoga: "🧘", Other: "⚡",
};

function fmtDate(d: Date | string, short = false) {
  return new Intl.DateTimeFormat("id-ID", short
    ? { day: "numeric", month: "short" }
    : { day: "numeric", month: "long", year: "numeric" }
  ).format(new Date(d));
}

function decodePolyline(encoded: string): [number, number][] {
  const result: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, res = 0;
    do { b = encoded.charCodeAt(index++) - 63; res |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += res & 1 ? ~(res >> 1) : res >> 1;
    shift = 0; res = 0;
    do { b = encoded.charCodeAt(index++) - 63; res |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += res & 1 ? ~(res >> 1) : res >> 1;
    result.push([lat / 1e5, lng / 1e5]);
  }
  return result;
}

type RoutePoints = {
  path: string;
  start: [number, number];
  end: [number, number];
};

function buildRoute(coords: [number, number][], W: number, H: number, pad = 18): RoutePoints | null {
  if (coords.length < 2) return null;
  const lats = coords.map(c => c[0]), lngs = coords.map(c => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const sx = (W - pad * 2) / (maxLng - minLng || 1);
  const sy = (H - pad * 2) / (maxLat - minLat || 1);
  const s = Math.min(sx, sy);
  const ox = pad + ((W - pad * 2) - (maxLng - minLng) * s) / 2;
  const oy = pad + ((H - pad * 2) - (maxLat - minLat) * s) / 2;
  const px = (ln: number) => ox + (ln - minLng) * s;
  const py = (la: number) => oy + (maxLat - la) * s;
  const path = coords.map(([la, ln], i) => `${i === 0 ? "M" : "L"}${px(ln).toFixed(1)},${py(la).toFixed(1)}`).join(" ");
  return {
    path,
    start: [px(coords[0][1]), py(coords[0][0])],
    end: [px(coords[coords.length - 1][1]), py(coords[coords.length - 1][0])],
  };
}

function MapArea({ coords, color, W, H, bg = "#1a1a1a", strokeWidth = 3, glowOpacity = 0.25, emoji }: {
  coords: [number, number][]; color: string; W: number; H: number;
  bg?: string; strokeWidth?: number; glowOpacity?: number; emoji: string;
}) {
  // Build route fresh for THIS exact W×H so path is never clipped
  const route = buildRoute(coords, W, H);
  return (
    <div style={{ position: "relative", width: W, height: H, backgroundColor: bg, overflow: "hidden", flexShrink: 0 }}>
      {/* grid */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.05 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <g key={i}>
            <line x1={i * 20} y1={0} x2={i * 20} y2={H} stroke="#fff" strokeWidth={0.5} />
            <line x1={0} y1={i * 20} x2={W} y2={i * 20} stroke="#fff" strokeWidth={0.5} />
          </g>
        ))}
      </svg>
      {route ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d={route.path} fill="none" stroke={color} strokeWidth={strokeWidth + 5} strokeOpacity={glowOpacity} strokeLinecap="round" strokeLinejoin="round" />
          <path d={route.path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeOpacity={0.95} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={route.start[0]} cy={route.start[1]} r={5} fill="#22C55E" stroke="#fff" strokeWidth={2} />
          <circle cx={route.end[0]} cy={route.end[1]} r={5} fill="#EF4444" stroke="#fff" strokeWidth={2} />
        </svg>
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, opacity: 0.2 }}>
          {emoji}
        </div>
      )}
    </div>
  );
}

// ─── Layouts ────────────────────────────────────────────────────────────────

const W = 480;

function LayoutClassic({ activity, athleteName, theme, coords, stats, emoji }: LayoutProps) {
  return (
    <div style={{ width: W, background: "#111", borderRadius: 20, overflow: "hidden", fontFamily: "system-ui,-apple-system,sans-serif", color: "#fff" }}>
      <MapArea coords={coords} color={theme.from} W={W} H={220} emoji={emoji} />
      <div style={{ padding: "16px 20px 14px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{activity.name}</div>
        <div style={{ fontSize: 11, opacity: 0.45, marginBottom: 14 }}>{emoji} {activity.type} · {fmtDate(activity.startDate)}{athleteName ? ` · ${athleteName}` : ""}</div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`, gap: "0 8px", paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 16, fontWeight: 700, color: theme.from }}>{s.value}</div>
              <div style={{ fontSize: 10, opacity: 0.4, marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 10, opacity: 0.3, display: "flex", justifyContent: "space-between" }}>
          <span>Strava Tracker</span><span>via Strava</span>
        </div>
      </div>
    </div>
  );
}

function LayoutOverlay({ activity, athleteName, theme, coords, stats, emoji }: LayoutProps) {
  return (
    <div style={{ width: W, borderRadius: 20, overflow: "hidden", fontFamily: "system-ui,-apple-system,sans-serif", color: "#fff", position: "relative" }}>
      <MapArea coords={coords} color={theme.from} W={W} H={300} emoji={emoji} glowOpacity={0.35} strokeWidth={4} />
      {/* gradient overlay */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 60%, transparent)", padding: "48px 20px 16px" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{activity.name}</div>
        <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 14 }}>{emoji} {activity.type} · {fmtDate(activity.startDate)}{athleteName ? ` · ${athleteName}` : ""}</div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`, gap: "0 8px" }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 18, fontWeight: 700, color: theme.from }}>{s.value}</div>
              <div style={{ fontSize: 10, opacity: 0.45 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LayoutSplit({ activity, athleteName, theme, coords, stats, emoji }: LayoutProps) {
  const leftW = Math.round(W * 0.52), rightW = W - leftW;
  return (
    <div style={{ width: W, borderRadius: 20, overflow: "hidden", fontFamily: "system-ui,-apple-system,sans-serif", color: "#fff", display: "flex", background: "#111" }}>
      <MapArea coords={coords} color={theme.from} W={leftW} H={260} emoji={emoji} strokeWidth={3.5} />
      <div style={{ width: rightW, padding: "18px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: `linear-gradient(160deg, ${theme.from}22, #111)` }}>
        <div>
          <div style={{ fontSize: 10, opacity: 0.45, marginBottom: 4 }}>{emoji} {activity.type}</div>
          <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>{activity.name}</div>
          <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 16 }}>{fmtDate(activity.startDate, true)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 8px" }}>
            {stats.slice(0, 6).map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.from }}>{s.value}</div>
                <div style={{ fontSize: 10, opacity: 0.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        {athleteName && <div style={{ fontSize: 10, opacity: 0.35, marginTop: 8 }}>{athleteName}</div>}
        <div style={{ fontSize: 9, opacity: 0.25, marginTop: 6 }}>Strava Tracker</div>
      </div>
    </div>
  );
}

function LayoutHero({ activity, athleteName, theme, coords, stats, emoji }: LayoutProps) {
  const mapW = 160;
  return (
    <div style={{ width: W, background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, borderRadius: 20, padding: "22px 20px", fontFamily: "system-ui,-apple-system,sans-serif", color: "#fff", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{emoji} {activity.type} · {fmtDate(activity.startDate, true)}</div>
          <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>{activity.name}</div>
          <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>{(activity.distance / 1000).toFixed(2)}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>km</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
            {stats.slice(1, 5).map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        {coords.length >= 2 && (
          <div style={{ borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
            <MapArea coords={coords} color="#fff" W={mapW} H={mapW} bg="rgba(0,0,0,0.25)" strokeWidth={2.5} glowOpacity={0.2} emoji={emoji} />
          </div>
        )}
      </div>
      {athleteName && <div style={{ marginTop: 14, fontSize: 10, opacity: 0.5, borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 10 }}>{athleteName} · Strava Tracker</div>}
    </div>
  );
}

function LayoutMinimal({ activity, athleteName, theme, stats, emoji }: LayoutProps) {
  return (
    <div style={{ width: W, background: "#0f0f0f", borderRadius: 20, padding: "28px 28px 22px", fontFamily: "'system-ui',-apple-system,sans-serif", color: "#fff", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.35, marginBottom: 6, letterSpacing: 2, textTransform: "uppercase" }}>{activity.type} · {fmtDate(activity.startDate, true)}</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{activity.name}</div>
        </div>
        <div style={{ fontSize: 44, opacity: 0.15 }}>{emoji}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)`, gap: 20, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
        {stats.map(s => (
          <div key={s.label}>
            <div style={{ fontSize: 22, fontWeight: 800, color: theme.from }}>{s.value}</div>
            <div style={{ fontSize: 11, opacity: 0.35, marginTop: 3, letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, fontSize: 10, opacity: 0.2, display: "flex", justifyContent: "space-between" }}>
        {athleteName && <span>{athleteName}</span>}
        <span>Strava Tracker</span>
      </div>
    </div>
  );
}

function LayoutNeon({ activity, athleteName, theme, coords, stats, emoji }: LayoutProps) {
  return (
    <div style={{ width: W, background: "#050510", borderRadius: 20, overflow: "hidden", fontFamily: "system-ui,-apple-system,sans-serif", color: "#fff" }}>
      <div style={{ position: "relative" }}>
        <MapArea coords={coords} color={theme.from} W={W} H={200} bg="#070718" emoji={emoji} strokeWidth={3} glowOpacity={0.5} />
        {/* neon border bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent, ${theme.from}, transparent)`, opacity: 0.8 }} />
      </div>
      <div style={{ padding: "16px 20px 14px", background: "linear-gradient(to bottom, #0a0a1a, #050510)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 1, textShadow: `0 0 20px ${theme.from}88` }}>{activity.name}</div>
        <div style={{ fontSize: 10, marginBottom: 14, color: theme.from, opacity: 0.7 }}>{emoji} {activity.type} · {fmtDate(activity.startDate)}</div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`, gap: "0 8px", borderTop: `1px solid ${theme.from}33`, paddingTop: 12 }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 16, fontWeight: 700, color: theme.from, textShadow: `0 0 12px ${theme.from}` }}>{s.value}</div>
              <div style={{ fontSize: 10, opacity: 0.35 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {athleteName && <div style={{ marginTop: 10, fontSize: 9, opacity: 0.25 }}>{athleteName}</div>}
      </div>
    </div>
  );
}

function LayoutRetro({ activity, athleteName, theme, coords, stats, emoji }: LayoutProps) {
  return (
    <div style={{ width: W, background: theme.from, borderRadius: 20, fontFamily: "'Georgia',serif", color: "#fff", overflow: "hidden", boxSizing: "border-box" }}>
      {/* Top strip */}
      <div style={{ background: "rgba(0,0,0,0.25)", padding: "12px 20px", display: "flex", justifyContent: "space-between", fontSize: 11, opacity: 0.8, letterSpacing: 2, textTransform: "uppercase" }}>
        <span>{activity.type}</span>
        <span>{fmtDate(activity.startDate, true)}</span>
      </div>
      <div style={{ padding: "20px 20px 0", display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1, textShadow: "2px 2px 0 rgba(0,0,0,0.2)", marginBottom: 4 }}>{activity.name}</div>
          {athleteName && <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>by {athleteName}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
            {stats.slice(0, 4).map(s => (
              <div key={s.label} style={{ borderLeft: "3px solid rgba(255,255,255,0.5)", paddingLeft: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        {coords.length >= 2 && (
          <div style={{ borderRadius: 12, overflow: "hidden", border: "3px solid rgba(255,255,255,0.3)", flexShrink: 0 }}>
            <MapArea coords={coords} color="#fff" W={150} H={150} bg="rgba(0,0,0,0.2)" strokeWidth={2.5} glowOpacity={0.1} emoji={emoji} />
          </div>
        )}
      </div>
      <div style={{ margin: "16px 20px 0", borderTop: "2px solid rgba(255,255,255,0.2)", paddingTop: 10, paddingBottom: 14, fontSize: 10, opacity: 0.5, letterSpacing: 1 }}>
        STRAVA TRACKER · {new Date(activity.startDate).getFullYear()}
      </div>
    </div>
  );
}

function LayoutPodium({ activity, athleteName, theme, coords, stats, emoji }: LayoutProps) {
  const top3 = stats.slice(0, 3);
  const rest = stats.slice(3);
  return (
    <div style={{ width: W, background: "#111", borderRadius: 20, overflow: "hidden", fontFamily: "system-ui,-apple-system,sans-serif", color: "#fff" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, padding: "18px 20px 16px" }}>
        <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 3 }}>{emoji} {activity.type} · {fmtDate(activity.startDate, true)}</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{activity.name}</div>
      </div>
      {/* Podium stats */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {top3.map((s, i) => (
          <div key={s.label} style={{ flex: 1, padding: "20px 0", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: theme.from }}>{s.value}</div>
            <div style={{ fontSize: 10, opacity: 0.4, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* Map + rest stats */}
      <div style={{ display: "flex" }}>
        {coords.length >= 2 && <MapArea coords={coords} color={theme.from} W={180} H={140} emoji={emoji} strokeWidth={3} />}
        <div style={{ flex: 1, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 8px", alignContent: "start" }}>
          {rest.slice(0, 4).map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.from }}>{s.value}</div>
              <div style={{ fontSize: 10, opacity: 0.35 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "8px 16px 12px", fontSize: 9, opacity: 0.2, display: "flex", justifyContent: "space-between" }}>
        {athleteName && <span>{athleteName}</span>}
        <span>Strava Tracker</span>
      </div>
    </div>
  );
}

function LayoutStory({ activity, athleteName, theme, coords, stats, emoji }: LayoutProps) {
  const H = 300;
  return (
    <div style={{ width: W, background: "#0d0d0d", borderRadius: 20, overflow: "hidden", fontFamily: "system-ui,-apple-system,sans-serif", color: "#fff" }}>
      {/* Top info */}
      <div style={{ padding: "18px 20px 14px", background: `linear-gradient(135deg, ${theme.from}33, transparent)` }}>
        <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4, letterSpacing: 1.5, textTransform: "uppercase" }}>{activity.type}</div>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{activity.name}</div>
        {athleteName && <div style={{ fontSize: 11, opacity: 0.45, marginTop: 3 }}>{athleteName}</div>}
      </div>
      {/* Full-width map */}
      <MapArea coords={coords} color={theme.from} W={W} H={H} bg="#111" emoji={emoji} strokeWidth={4} glowOpacity={0.4} />
      {/* Stats strip */}
      <div style={{ display: "flex", background: `linear-gradient(135deg, ${theme.from}22, #111)`, borderTop: `2px solid ${theme.from}44` }}>
        {stats.slice(0, 4).map((s, i) => (
          <div key={s.label} style={{ flex: 1, padding: "14px 0", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.from }}>{s.value}</div>
            <div style={{ fontSize: 9, opacity: 0.4, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "6px 16px 10px", fontSize: 9, opacity: 0.2, textAlign: "right" }}>Strava Tracker · {fmtDate(activity.startDate, true)}</div>
    </div>
  );
}

function LayoutClean({ activity, athleteName, theme, coords, stats, emoji }: LayoutProps) {
  return (
    <div style={{ width: W, background: "#ffffff", borderRadius: 20, overflow: "hidden", fontFamily: "system-ui,-apple-system,sans-serif", color: "#111" }}>
      {/* Colored top bar */}
      <div style={{ height: 6, background: `linear-gradient(to right, ${theme.from}, ${theme.to})` }} />
      <div style={{ padding: "18px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: theme.from, fontWeight: 600, marginBottom: 3, letterSpacing: 0.5 }}>{emoji} {activity.type} · {fmtDate(activity.startDate, true)}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#111" }}>{activity.name}</div>
            {athleteName && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{athleteName}</div>}
          </div>
        </div>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`, gap: "0 8px", borderTop: "1px solid #f0f0f0", paddingTop: 14, paddingBottom: 14 }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 17, fontWeight: 800, color: theme.from }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Map on bottom */}
      {coords.length >= 2 && (
        <div style={{ borderTop: "1px solid #f0f0f0" }}>
          <MapArea coords={coords} color={theme.from} W={W} H={160} bg="#f8f9fa" emoji={emoji} strokeWidth={3} glowOpacity={0.15} />
        </div>
      )}
      <div style={{ padding: "8px 20px 12px", fontSize: 10, color: "#ccc", display: "flex", justifyContent: "space-between" }}>
        <span>Strava Tracker</span><span>via Strava</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

type LayoutProps = {
  activity: ShareCardActivity;
  athleteName?: string;
  theme: ShareTheme;
  coords: [number, number][];
  stats: { label: string; value: string }[];
  emoji: string;
};

export function ShareCard({ activity, athleteName, theme, layout = "classic", cardRef }: ShareCardProps) {
  const emoji = SPORT_EMOJIS[activity.type] ?? "⚡";
  const isPace = ["Run", "Walk", "Hike"].includes(activity.type);
  const coords = activity.mapPolyline ? decodePolyline(activity.mapPolyline) : [];

  const stats = [
    { label: "Jarak",    value: formatDistance(activity.distance) },
    { label: "Waktu",    value: formatDurationHuman(activity.movingTime) },
    { label: "Elevasi",  value: formatElevation(activity.totalElevation) },
    { label: isPace ? "Pace" : "Kecepatan", value: activity.avgSpeed > 0 ? (isPace ? formatPace(activity.avgSpeed) : formatSpeed(activity.avgSpeed)) : "--" },
    ...(activity.avgHeartRate ? [{ label: "Avg HR", value: `${Math.round(activity.avgHeartRate)} bpm` }] : []),
    ...(activity.calories    ? [{ label: "Kalori", value: `${Math.round(activity.calories)} kcal` }] : []),
  ];

  const props: LayoutProps = { activity, athleteName, theme, coords, stats, emoji };

  const RENDERERS: Record<ShareLayoutId, (p: LayoutProps) => React.ReactNode> = {
    classic: p => <LayoutClassic {...p} />,
    overlay: p => <LayoutOverlay {...p} />,
    split:   p => <LayoutSplit {...p} />,
    hero:    p => <LayoutHero {...p} />,
    minimal: p => <LayoutMinimal {...p} />,
    neon:    p => <LayoutNeon {...p} />,
    retro:   p => <LayoutRetro {...p} />,
    podium:  p => <LayoutPodium {...p} />,
    story:   p => <LayoutStory {...p} />,
    clean:   p => <LayoutClean {...p} />,
  };

  return (
    <div ref={cardRef} style={{ display: "inline-block" }}>
      {RENDERERS[layout](props)}
    </div>
  );
}
