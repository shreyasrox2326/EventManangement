import { Card } from "@/components/ui/Card";

export function SecurityPage() {
  return (
    <Card>
      <div className="eyebrow">Security / Audit</div>
      <h2 className="section-title">Audit visibility and privileged access review</h2>
      <div className="grid">
        <div className="pill">Admin login with two-step verification recorded at 06:41</div>
        <div className="pill">Organizer privileged access verified with OTP challenge</div>
        <div className="pill">System logs retained for operational audit review</div>
      </div>
    </Card>
  );
}
