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
            content={({ active, payload }) => {
              if (!active || !payload?.length) {
                return null;
              }

              const entry = payload[0];
              const label = String(entry.payload?.fullLabel ?? entry.payload?.label ?? "");
              const value = Number(entry.value ?? 0);

              return (
                <div
                  style={{
                    backgroundColor: "var(--surface-elevated)",
                    color: "var(--text)",
                    border: "1px solid var(--line)",
                    borderRadius: 14,
                    padding: "10px 12px",
                    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.25)"
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--text)" }}>{label}</div>
                  <div style={{ marginTop: 4, color: "var(--text-soft)" }}>{value}% occupancy</div>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="var(--accent)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
