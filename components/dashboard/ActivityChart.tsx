"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { WeeklyVolume } from "@/types/app";

interface ActivityChartProps {
  data: WeeklyVolume[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold mb-4">Volume Mingguan (km)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <Tooltip
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`${v.toFixed(1)} km`]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Run" stackId="a" fill="#FC4C02" radius={[0, 0, 0, 0]} name="Lari" />
          <Bar dataKey="Ride" stackId="a" fill="#3B82F6" name="Sepeda" />
          <Bar dataKey="Other" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Lainnya" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
