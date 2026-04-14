"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const outerColors = {
  sold: "var(--accent)",
  unsold: "rgba(148, 163, 184, 0.24)"
} as const;

const innerColors = {
  attended: "var(--success)",
  notAttended: "rgba(245, 158, 11, 0.28)"
} as const;

export function AttendanceDonutChart({
  capacity,
  sold,
  attended,
  centerLabel,
  centerValue
}: {
  capacity: number;
  sold: number;
  attended: number;
  centerLabel: string;
  centerValue: string;
}) {
  const safeCapacity = Math.max(capacity, 0);
  const safeSold = Math.max(Math.min(sold, safeCapacity), 0);
  const safeAttended = Math.max(Math.min(attended, safeSold), 0);
  const soldArcAngle = safeCapacity > 0 ? (safeSold / safeCapacity) * 360 : 0;
  const soldArcEndAngle = 90 - soldArcAngle;

  const outerData = [
    { name: "Sold seats", value: safeSold, color: outerColors.sold },
    { name: "Unsold seats", value: Math.max(safeCapacity - safeSold, 0), color: outerColors.unsold }
  ].filter((entry) => entry.value > 0);

  const innerData = [
    { name: "Attended", value: safeAttended, color: innerColors.attended },
    { name: "Sold, not attended", value: Math.max(safeSold - safeAttended, 0), color: innerColors.notAttended }
  ].filter((entry) => entry.value > 0);

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={outerData}
            dataKey="value"
            innerRadius={86}
            outerRadius={116}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            {outerData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          {safeSold > 0 && (
            <Pie
              data={innerData}
              dataKey="value"
              innerRadius={58}
              outerRadius={78}
              startAngle={90}
              endAngle={soldArcEndAngle}
              stroke="none"
              isAnimationActive={false}
            >
              {innerData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) {
                return null;
              }

              const entry = payload[0];
              const name = String(entry.name ?? "");
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
                  <div style={{ fontWeight: 700, color: "var(--text)" }}>{name}</div>
                  <div style={{ marginTop: 4, color: "var(--text-soft)" }}>{value}</div>
                </div>
              );
            }}
          />
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-soft)" fontSize="12">
            {centerLabel}
          </text>
          <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fill="var(--text)" fontSize="22" fontWeight="700">
            {centerValue}
          </text>
          <g transform="translate(360, 84)">
            <circle cx="0" cy="0" r="5" fill={outerColors.sold} />
            <text x="14" y="4" fill="var(--text-soft)" fontSize="12">Sold seats</text>
            <circle cx="0" cy="26" r="5" fill={outerColors.unsold} />
            <text x="14" y="30" fill="var(--text-soft)" fontSize="12">Unsold seats</text>
            <circle cx="0" cy="52" r="5" fill={innerColors.attended} />
            <text x="14" y="56" fill="var(--text-soft)" fontSize="12">Attended</text>
            <circle cx="0" cy="78" r="5" fill={innerColors.notAttended} />
            <text x="14" y="82" fill="var(--text-soft)" fontSize="12">Sold, not attended</text>
          </g>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
