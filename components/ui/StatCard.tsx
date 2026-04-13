import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function StatCard({
  label,
  value,
  caption,
  icon
}: {
  label: string;
  value: string;
  caption: string;
  icon?: ReactNode;
}) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow">{label}</div>
          <h3 style={{ margin: "10px 0 6px", fontSize: "2rem", letterSpacing: "-0.05em" }}>{value}</h3>
          <div className="muted">{caption}</div>
        </div>
        {icon}
      </div>
    </Card>
  );
}
