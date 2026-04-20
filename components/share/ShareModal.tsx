"use client";
import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { ShareCard, SHARE_LAYOUTS, type ShareTheme, type ShareLayoutId } from "./ShareCard";
import { X, Download, Link2, Twitter, MessageCircle, Instagram, Share2, Check, Loader2 } from "lucide-react";
import { formatDistance, formatDurationHuman } from "@/lib/utils/format";

type Activity = {
  id: string;
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

type ShareModalProps = {
  activity: Activity;
  athleteName?: string;
  onClose: () => void;
};

const THEMES: ShareTheme[] = [
  { id: "sport",  label: "Sport",  from: "#FC4C02", to: "#E64A19" },
  { id: "dark",   label: "Dark",   from: "#6366f1", to: "#8b5cf6" },
  { id: "ocean",  label: "Ocean",  from: "#0ea5e9", to: "#06b6d4" },
  { id: "forest", label: "Forest", from: "#22c55e", to: "#16a34a" },
  { id: "sunset", label: "Sunset", from: "#f59e0b", to: "#ec4899" },
];

export function ShareModal({ activity, athleteName, onClose }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<ShareTheme>(THEMES[0]);
  const [layout, setLayout] = useState<ShareLayoutId>("classic");
  const [tab, setTab] = useState<"layout" | "theme">("layout");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [loadingLink, setLoadingLink] = useState(false);

  const getPublicUrl = useCallback(async () => {
    if (shareId) return `${window.location.origin}/share/${shareId}`;
    setLoadingLink(true);
    try {
      const res = await fetch(`/api/activities/${activity.id}/share`, { method: "POST" });
      const data = await res.json();
      setShareId(data.shareId);
      return `${window.location.origin}/share/${data.shareId}`;
    } finally {
      setLoadingLink(false);
    }
  }, [activity.id, shareId]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const png = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = png;
      a.download = `${activity.name.replace(/\s+/g, "-")}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  }, [activity.name]);

  const handleCopyLink = useCallback(async () => {
    const url = await getPublicUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getPublicUrl]);

  const handleNativeShare = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const png = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const blob = await (await fetch(png)).blob();
      const file = new File([blob], `${activity.name}.png`, { type: "image/png" });
      const url = await getPublicUrl();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: activity.name, url, files: [file] });
      } else {
        await navigator.share({ title: activity.name, url });
      }
    } catch { /* cancelled */ }
  }, [activity.name, getPublicUrl]);

  const handleTwitter = useCallback(async () => {
    const url = await getPublicUrl();
    const text = `${activity.name} — ${formatDistance(activity.distance)} dalam ${formatDurationHuman(activity.movingTime)} 🔥`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  }, [activity, getPublicUrl]);

  const handleWhatsApp = useCallback(async () => {
    const url = await getPublicUrl();
    const text = `${activity.name}\n${formatDistance(activity.distance)} · ${formatDurationHuman(activity.movingTime)}\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }, [activity, getPublicUrl]);

  const handleInstagram = useCallback(async () => {
    await handleDownload();
    alert("Gambar berhasil diunduh! Buka Instagram dan upload dari galeri kamu 📸");
  }, [handleDownload]);

  const shareOptions = [
    { icon: Twitter,      label: "Twitter / X",  onClick: handleTwitter,  bg: "#000" },
    { icon: MessageCircle,label: "WhatsApp",      onClick: handleWhatsApp, bg: "#22c55e" },
    { icon: Instagram,    label: "Instagram",     onClick: handleInstagram,bg: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)" },
    { icon: copied ? Check : Link2, label: copied ? "Tersalin!" : loadingLink ? "Memuat..." : "Salin Link", onClick: handleCopyLink, bg: copied ? "#16a34a" : "#3f3f46" },
    { icon: downloading ? Loader2 : Download, label: downloading ? "Mengunduh..." : "Unduh PNG", onClick: handleDownload, bg: "#2563eb" },
    ...(typeof navigator !== "undefined" && "share" in navigator
      ? [{ icon: Share2, label: "Bagikan...", onClick: handleNativeShare, bg: "#4f46e5" }]
      : []),
  ];

  return (
    <div
      className="fixed inset-0 flex items-start justify-center overflow-y-auto py-4 px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", zIndex: 9999 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-lg">Bagikan Aktivitas</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card preview */}
        <div className="bg-zinc-950 flex items-center justify-center py-5 overflow-x-auto">
          <div style={{ transform: "scale(0.72)", transformOrigin: "top center", minHeight: 200 }}>
            <ShareCard
              activity={activity}
              athleteName={athleteName}
              theme={theme}
              layout={layout}
              cardRef={cardRef}
            />
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Tab switcher */}
          <div className="flex rounded-xl border overflow-hidden">
            {(["layout", "theme"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              >
                {t === "layout" ? "Layout" : "Tema Warna"}
              </button>
            ))}
          </div>

          {/* Layout picker */}
          {tab === "layout" && (
            <div className="grid grid-cols-5 gap-2">
              {SHARE_LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLayout(l.id)}
                  title={l.description}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                    layout === l.id ? "border-primary ring-1 ring-primary bg-primary/5" : "hover:border-border border-transparent"
                  }`}
                >
                  <LayoutThumbnail id={l.id} active={layout === l.id} color={theme.from} />
                  <span className="text-xs text-center leading-tight">{l.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Theme picker */}
          {tab === "theme" && (
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t)}
                  title={t.label}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all flex-1 ${
                    theme.id === t.id ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-border"
                  }`}
                >
                  <span className="w-full h-8 rounded-lg block" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }} />
                  <span className="text-xs text-muted-foreground">{t.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Share buttons */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium tracking-wide">BAGIKAN KE</p>
            <div className="grid grid-cols-3 gap-2">
              {shareOptions.map(({ icon: Icon, label, onClick, bg }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl text-white text-xs font-medium transition-all hover:opacity-90 active:scale-95"
                  style={{ background: bg }}
                >
                  <Icon className={`w-5 h-5 ${downloading && label.includes("Unduh") ? "animate-spin" : ""}`} />
                  <span className="text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple SVG thumbnail for each layout
function LayoutThumbnail({ id, active, color }: { id: ShareLayoutId; active: boolean; color: string }) {
  const c = active ? color : "#555";
  const bg = active ? `${color}18` : "#1f1f1f";
  const w = 52, h = 40;
  const thumbs: Record<ShareLayoutId, React.ReactNode> = {
    classic: <><rect x={0} y={0} width={w} height={h*0.6} fill="#2a2a2a" rx={3}/><rect x={4} y={h*0.65} width={w*0.6} height={3} fill={c} rx={1}/><rect x={4} y={h*0.78} width={w*0.4} height={2} fill={c} opacity={0.4} rx={1}/><rect x={4} y={h*0.88} width={w*0.5} height={2} fill={c} opacity={0.3} rx={1}/></>,
    overlay: <><rect x={0} y={0} width={w} height={h} fill="#2a2a2a" rx={3}/><rect x={0} y={h*0.55} width={w} height={h*0.45} fill="rgba(0,0,0,0.6)" rx={0}/><rect x={4} y={h*0.62} width={w*0.55} height={3} fill={c} rx={1}/><rect x={4} y={h*0.78} width={w*0.75} height={2} fill={c} opacity={0.5} rx={1}/></>,
    split:   <><rect x={0} y={0} width={w*0.52} height={h} fill="#2a2a2a" rx={3}/><rect x={w*0.54} y={4} width={w*0.35} height={2.5} fill={c} rx={1}/><rect x={w*0.54} y={9} width={w*0.42} height={2} fill={c} opacity={0.4} rx={1}/><rect x={w*0.54} y={16} width={w*0.3} height={2} fill={c} opacity={0.6} rx={1}/><rect x={w*0.54} y={21} width={w*0.3} height={2} fill={c} opacity={0.4} rx={1}/></>,
    hero:    <><rect x={4} y={4} width={w*0.55} height={5} fill={c} opacity={0.8} rx={1}/><text x={4} y={23} fontSize={14} fill={c} fontWeight="bold">KM</text><rect x={w*0.65} y={4} width={w*0.3} height={h*0.6} fill="#2a2a2a" rx={3}/></>,
    minimal: <><rect x={4} y={8} width={w*0.7} height={4} fill={c} rx={1}/><rect x={4} y={16} width={w*0.4} height={3} fill={c} opacity={0.5} rx={1}/><rect x={4} y={23} width={w*0.5} height={3} fill={c} opacity={0.5} rx={1}/><rect x={4} y={30} width={w*0.35} height={3} fill={c} opacity={0.5} rx={1}/></>,
    neon:    <><rect x={0} y={0} width={w} height={h} fill="#050510" rx={3}/><rect x={0} y={0} width={w} height={h*0.55} fill="#070718" rx={3}/><polyline points="4,28 15,20 25,24 38,14 48,18" fill="none" stroke={c} strokeWidth={1.5} filter={`drop-shadow(0 0 2px ${c})`}/><rect x={4} y={h*0.65} width={w*0.55} height={2} fill={c} rx={1} opacity={0.8}/></>,
    retro:   <><rect x={0} y={0} width={w} height={h} fill={c} rx={3}/><rect x={0} y={0} width={w} height={7} fill="rgba(0,0,0,0.2)" rx={3}/><rect x={4} y={12} width={w*0.6} height={4} fill="#fff" opacity={0.8} rx={1}/><rect x={4} y={20} width={w*0.3} height={2.5} fill="#fff" opacity={0.5} rx={1}/><rect x={4} y={26} width={w*0.35} height={2.5} fill="#fff" opacity={0.5} rx={1}/></>,
    podium:  <><rect x={0} y={0} width={w} height={10} fill={c} opacity={0.7} rx={3}/><rect x={4} y={13} width={w*0.28} height={8} fill={c} opacity={0.5} rx={1}/><rect x={w*0.36} y={13} width={w*0.28} height={8} fill={c} opacity={0.5} rx={1}/><rect x={w*0.68} y={13} width={w*0.28} height={8} fill={c} opacity={0.5} rx={1}/><rect x={0} y={25} width={w*0.45} height={h*0.4} fill="#2a2a2a" rx={0}/></>,
    story:   <><rect x={4} y={4} width={w*0.6} height={3} fill={c} rx={1}/><rect x={4} y={10} width={w*0.8} height={2} fill={c} opacity={0.4} rx={1}/><rect x={0} y={16} width={w} height={h*0.5} fill="#2a2a2a"/><rect x={0} y={h*0.7} width={w} height={h*0.3} fill={c} opacity={0.15} rx={0}/><rect x={4} y={h*0.73} width={w*0.4} height={2.5} fill={c} rx={1}/></>,
    clean:   <><rect x={0} y={0} width={w} height={h} fill="#f8f8f8" rx={3}/><rect x={0} y={0} width={w} height={4} fill={c}/><rect x={4} y={9} width={w*0.6} height={3} fill="#222" opacity={0.7} rx={1}/><rect x={4} y={15} width={w*0.8} height={2} fill="#ccc" rx={1}/><rect x={4} y={20} width={w*0.35} height={3} fill={c} rx={1}/><rect x={w*0.42} y={20} width={w*0.35} height={3} fill={c} opacity={0.5} rx={1}/></>,
  };

  return (
    <svg width={w} height={h} style={{ borderRadius: 6, overflow: "hidden", background: bg }}>
      {thumbs[id]}
    </svg>
  );
}
