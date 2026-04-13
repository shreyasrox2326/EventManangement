import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function PaymentFailurePage() {
  return (
    <Card>
      <div className="eyebrow">Payment</div>
      <h2 className="section-title">Payment could not be completed</h2>
      <p className="muted">Please return to the event and try again.</p>
      <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
        <Link href="/customer/events" className="button button-primary">
          Return to events
        </Link>
        <Link href="/customer/history" className="button button-secondary">
          Review past orders
        </Link>
      </div>
    </Card>
  );
}
