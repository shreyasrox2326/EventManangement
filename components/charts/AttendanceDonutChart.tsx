"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type AttendanceSlice = {
  name: string;
  value: number;
  color: string;
};

export function AttendanceDonutChart({
  capacityData,
  soldData,
  centerLabel,
  centerValue
}: {
  capacityData: AttendanceSlice[];
  soldData: AttendanceSlice[];
  centerLabel: string;
  centerValue: string;
}) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={capacityData} dataKey="value" innerRadius={82} outerRadius={112} stroke="none" isAnimationActive={false}>
            {capacityData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Pie data={soldData} dataKey="value" innerRadius={54} outerRadius={74} stroke="none" isAnimationActive={false}>
            {soldData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              color: "var(--text)"
            }}
            labelStyle={{ color: "var(--text)", fontWeight: 700 }}
            formatter={(value: number, name: string) => [`${value}`, name]}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ color: "var(--text-soft)", paddingTop: 12 }}
            payload={[...capacityData, ...soldData].map((entry) => ({
              value: entry.name,
              color: entry.color,
              type: "circle"
            }))}
          />
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-soft)" fontSize="12">
            {centerLabel}
          </text>
          <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fill="var(--text)" fontSize="22" fontWeight="700">
            {centerValue}
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
