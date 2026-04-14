"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function OccupancyBarChart({
  data
}: {
  data: Array<{ label: string; fullLabel?: string; value: number }>;
}) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--text-soft)" />
          <YAxis stroke="var(--text-soft)" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={36} />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            contentStyle={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              color: "var(--text)"
            }}
            labelStyle={{ color: "var(--text)", fontWeight: 700 }}
            formatter={(value: number) => [`${value}%`, "Occupancy"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? _}
          />
          <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="var(--accent)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
