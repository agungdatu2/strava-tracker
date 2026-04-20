"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { PacePoint } from "@/types/app";
import { formatPace } from "@/lib/utils/format";

interface Props { data: PacePoint[] }

const formatYAxis = (secPerKm: number) => {
  const m = Math.floor(secPerKm / 60), s = secPerKm % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

export function PaceProgressionChart({ data }: Props) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold mb-4">Tren Pace Lari (12 Minggu)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis
            reversed
            tick={{ fontSize: 11 }}
            tickFormatter={formatYAxis}
            domain={["dataMin - 10", "dataMax + 10"]}
          />
          <Tooltip
            formatter={(v: number) => [formatPace(1000 / v), "Avg Pace"]}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Line type="monotone" dataKey="pace" stroke="#FC4C02" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground mt-2">Sumbu Y terbalik — semakin rendah = semakin cepat</p>
    </div>
  );
}
