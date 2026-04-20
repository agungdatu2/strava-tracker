"use client";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { activityIcon, formatDistance, formatDurationHuman } from "@/lib/utils/format";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CalActivity { id: string; name: string; type: string; distance: number; movingTime: number; date: string }
interface Props { activities: CalActivity[]; month: string }

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function WorkoutCalendar({ activities, month }: Props) {
  const router = useRouter();
  const [year, mon] = month.split("-").map(Number);
  const monthDate = new Date(year, mon - 1);
  const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });

  const startPad = (getDay(days[0]) + 6) % 7; // Mon = 0

  const byDate = new Map<string, CalActivity[]>();
  activities.forEach((a) => {
    const list = byDate.get(a.date) ?? [];
    list.push(a);
    byDate.set(a.date, list);
  });

  const prev = format(subMonths(monthDate, 1), "yyyy-MM");
  const next = format(addMonths(monthDate, 1), "yyyy-MM");
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/dashboard/calendar?month=${prev}`)} className="p-1.5 rounded-lg hover:bg-accent">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="font-semibold capitalize">
          {format(monthDate, "MMMM yyyy", { locale: idLocale })}
        </h2>
        <button onClick={() => router.push(`/dashboard/calendar?month=${next}`)} className="p-1.5 rounded-lg hover:bg-accent">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const acts = byDate.get(dateStr) ?? [];
          const isToday = dateStr === today;

          return (
            <div
              key={dateStr}
              className={`min-h-[72px] rounded-lg p-1.5 border text-xs ${isToday ? "border-primary/50 bg-primary/5" : "border-transparent hover:border-border"}`}
            >
              <p className={`text-right font-medium mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </p>
              <div className="space-y-0.5">
                {acts.slice(0, 2).map((a) => (
                  <Link
                    key={a.id}
                    href={`/dashboard/activities/${a.id}`}
                    className="block truncate rounded px-1 py-0.5 bg-primary/10 hover:bg-primary/20 transition-colors"
                    title={`${a.name} · ${formatDistance(a.distance)}`}
                  >
                    {activityIcon(a.type)} {formatDistance(a.distance)}
                  </Link>
                ))}
                {acts.length > 2 && (
                  <p className="text-muted-foreground px-1">+{acts.length - 2} lagi</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
        <span>Total bulan ini:</span>
        <span className="font-medium text-foreground">
          {activities.length} aktivitas ·{" "}
          {formatDistance(activities.reduce((s, a) => s + a.distance, 0))} ·{" "}
          {formatDurationHuman(activities.reduce((s, a) => s + a.movingTime, 0))}
        </span>
      </div>
    </div>
  );
}
