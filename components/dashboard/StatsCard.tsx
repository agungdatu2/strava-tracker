import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatsCard({ title, value, sub, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {trend && (
        <p className={cn("text-xs font-medium", trend.positive ? "text-green-500" : "text-red-500")}>
          {trend.positive ? "↑" : "↓"} {trend.value} vs bulan lalu
        </p>
      )}
    </div>
  );
}
