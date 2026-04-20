"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareModal } from "./ShareModal";

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

export function ShareButton({ activity, athleteName }: { activity: Activity; athleteName?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-card hover:bg-accent transition-colors text-sm font-medium"
      >
        <Share2 className="w-4 h-4" />
        Bagikan
      </button>
      {open && (
        <ShareModal activity={activity} athleteName={athleteName} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
