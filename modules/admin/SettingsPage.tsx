import { Card } from "@/components/ui/Card";

export function SettingsPage() {
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
      <Card>
        <div className="eyebrow">System Settings</div>
        <h2 className="section-title">Default refund policy</h2>
        <div className="grid">
          <div className="pill">Full refund before 7 days</div>
          <div className="pill">50 percent refund before 48 hours</div>
          <div className="pill">No refund within 48 hours</div>
        </div>
      </Card>
      <Card>
        <div className="eyebrow">Configuration</div>
        <h3 style={{ marginBottom: 16 }}>Platform controls</h3>
        <div className="grid">
          <div className="pill">2FA enforced for Admin and Organizer</div>
          <div className="pill">Ticket QR validation active</div>
          <div className="pill">Report generation enabled</div>
        </div>
      </Card>
    </div>
  );
}
