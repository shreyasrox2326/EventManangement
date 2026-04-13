import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function ReportsPage() {
  return (
    <Card>
      <div className="eyebrow">Generate System Reports</div>
      <h2 className="section-title">Operational and compliance exports</h2>
      <p className="muted">Download report UI with CSV and PDF actions for interviews and demo walkthroughs.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
        <Button>Download CSV</Button>
        <Button variant="secondary">Download PDF</Button>
      </div>
    </Card>
  );
}
