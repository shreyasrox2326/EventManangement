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
            contentStyle={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              color: "var(--text)"
            }}
            labelStyle={{ color: "var(--text)", fontWeight: 700 }}
            formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? _}
          />
          <Area type="monotone" dataKey={dataKey} stroke="var(--accent)" fill="url(#revenueFill)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
