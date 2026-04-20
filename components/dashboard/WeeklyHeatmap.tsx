"use client";
import { eachDayOfInterval, subDays, format, isSameDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils/cn";

interface HeatmapDay { date: string; count: number; distance: number }

interface Props { data: HeatmapDay[] }

export function WeeklyHeatmap({ data }: Props) {
  const today = new Date();
  const days = eachDayOfInterval({ start: subDays(today, 83), end: today }); // 12 weeks

  const getDay = (date: Date) =>
    data.find((d) => isSameDay(new Date(d.date), date));

  const intensity = (km: number) => {
    if (km === 0) return "bg-muted";
    if (km < 5) return "bg-primary/20";
    if (km < 15) return "bg-primary/50";
    if (km < 30) return "bg-primary/80";
    return "bg-primary";
  };

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold mb-4">Aktivitas 12 Minggu Terakhir</h3>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => {
              const d = getDay(day);
              const km = (d?.distance ?? 0) / 1000;
              return (
                <div
                  key={day.toISOString()}
                  title={`${format(day, "d MMM", { locale: idLocale })}: ${km > 0 ? `${km.toFixed(1)} km` : "Tidak ada aktivitas"}`}
                  className={cn("w-3 h-3 rounded-sm cursor-default", intensity(km))}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
        <span>Kurang</span>
        {["bg-muted", "bg-primary/20", "bg-primary/50", "bg-primary/80", "bg-primary"].map((c) => (
          <div key={c} className={cn("w-3 h-3 rounded-sm", c)} />
        ))}
        <span>Banyak</span>
      </div>
    </div>
  );
}
