"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const chartColors = ["var(--accent)", "var(--success)", "var(--warning)"];

export function AttendanceDonutChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} innerRadius={64} outerRadius={94} dataKey="value" paddingAngle={4}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
