"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ActivityBreakdown } from "@/types/app";
import { formatDistanceShort } from "@/lib/utils/format";

interface Props { data: ActivityBreakdown[] }

export function ActivityBreakdownChart({ data }: Props) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold mb-4">Tipe Aktivitas</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="count"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number, name: string, props) => [
              `${v} aktivitas · ${formatDistanceShort(props.payload.distance)}`,
              props.payload.type,
            ]}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Legend
            formatter={(value, entry) => (
              <span className="text-xs">{(entry as { payload?: { type?: string } }).payload?.type ?? value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
