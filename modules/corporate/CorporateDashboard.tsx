"use client";

import Link from "next/link";
import { Building2, CreditCard, Ticket, TimerReset } from "lucide-react";
import { useAuth } from "@/app/providers";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency, formatDateTime } from "@/utils/format";

export function CorporateDashboard() {
  const { session } = useAuth();
  const corporateUserId = session?.user.userId ?? "";
  const { data } = useAsyncResource(() => emtsApi.getCorporateRequestsForCorporate(corporateUserId), [corporateUserId]);
  const requests = data ?? [];

  const activeRequests = requests.filter((request) => request.status === "submitted" || request.status === "approved_pending_payment");
  const pendingPaymentRequests = requests.filter((request) => request.status === "approved_pending_payment");
  const paidRequests = requests.filter((request) => request.status === "paid");
  const totalReservedTickets = paidRequests.reduce(
    (sum, request) => sum + request.items.reduce((itemSum, item) => itemSum + (item.approvedQty ?? item.requestedQty), 0),
    0
  );

  return (
    <div className="grid">
      <SectionHeader
        eyebrow="Corporate Client Portal"
        title="Bulk booking desk"
        description="Submit bulk ticket requests, review organizer offers, complete payment, and track fulfilled reservations."
        action={
          <Link href="/corporate/request" className="button button-primary">
            Browse events
          </Link>
        }
      />

      <div className="metrics-grid">
        <StatCard label="Active Requests" value={`${activeRequests.length}`} caption="Submitted or awaiting payment" icon={<Building2 size={20} />} />
        <StatCard label="Pending Payment" value={`${pendingPaymentRequests.length}`} caption="Approved offers awaiting payment" icon={<TimerReset size={20} />} />
        <StatCard label="Paid Requests" value={`${paidRequests.length}`} caption="Completed corporate purchases" icon={<CreditCard size={20} />} />
        <StatCard label="Tickets Secured" value={`${totalReservedTickets}`} caption="Tickets issued from paid requests" icon={<Ticket size={20} />} />
      </div>

      <Card>
        <div className="eyebrow">Request history</div>
        <h2 className="section-title">Corporate booking requests</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Request</th>
              <th>Status</th>
              <th>Quantity</th>
              <th>Offer</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.requestId}>
                <td>{request.requestId}</td>
                <td>{request.status.replaceAll("_", " ")}</td>
                <td>{request.requestedTotalQty}</td>
                <td>{request.offeredTotalAmount ? formatCurrency(request.offeredTotalAmount) : "Pending"}</td>
                <td>{formatDateTime(request.updatedAt)}</td>
                <td>
                  <Link href={`/corporate/bookings/${request.bookingId ?? request.requestId}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && <div className="muted" style={{ marginTop: 12 }}>No corporate requests have been submitted yet.</div>}
      </Card>
    </div>
  );
}
