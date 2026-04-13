import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function PaymentSuccessPage() {
  return (
    <Card>
      <div className="eyebrow">Payment</div>
      <h2 className="section-title">Purchase complete</h2>
      <p className="muted">Your tickets are available in your bookings and live tickets.</p>
      <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
        <Link href="/customer/history" className="button button-primary">
          View purchase history
        </Link>
        <Link href="/customer/events" className="button button-secondary">
          Back to events
        </Link>
      </div>
    </Card>
  );
}
