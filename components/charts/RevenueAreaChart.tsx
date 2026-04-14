"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function RevenueAreaChart({
  data,
  dataKey = "value"
}: {
  data: Array<{ label: string; fullLabel?: string; value: number }>;
  dataKey?: string;
}) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--text-soft)" />
          <YAxis stroke="var(--text-soft)" />
          <Tooltip
            cursor={{ stroke: "rgba(148, 163, 184, 0.25)", strokeWidth: 1.5 }}
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
                  <div style={{ marginTop: 4, color: "var(--text-soft)" }}>₹{value.toLocaleString("en-IN")}</div>
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey={dataKey} stroke="var(--accent)" fill="url(#revenueFill)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
