"use client";

import Link from "next/link";
import { useAuth } from "@/app/providers";
import { Card } from "@/components/ui/Card";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency, formatDateTime } from "@/utils/format";

export function CorporateBookingsPage() {
  const { session } = useAuth();
  const corporateUserId = session?.user.userId ?? "";
  const { data, isLoading, error } = useAsyncResource(async () => {
    const [requests, events] = await Promise.all([
      emtsApi.getCorporateRequestsForCorporate(corporateUserId),
      emtsApi.getEvents()
    ]);

    return requests
      .filter((request) => request.bookingId)
      .map((request) => ({
        request,
        event: events.find((event) => event.eventId === request.eventId) ?? null
      }));
  }, [corporateUserId]);

  const rows = data ?? [];

  return (
    <Card>
      <div className="eyebrow">Corporate Bookings</div>
      <h2 className="section-title">Paid bookings and issued ticket batches</h2>
      {error && <div className="badge">{error}</div>}
      {isLoading && <div className="muted">Loading corporate bookings...</div>}
      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Event</th>
            <th>Total Tickets</th>
            <th>Total Paid</th>
            <th>Paid At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ request, event }) => (
            <tr key={request.requestId}>
              <td>{request.bookingId}</td>
              <td>{event?.title ?? request.eventId}</td>
              <td>{request.items.reduce((sum, item) => sum + (item.approvedQty ?? 0), 0)}</td>
              <td>{formatCurrency(request.offeredTotalAmount ?? 0)}</td>
              <td>{request.paidAt ? formatDateTime(request.paidAt) : "Unknown"}</td>
              <td><Link href={`/corporate/bookings/${request.bookingId}`}>Open booking</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && !isLoading && <div className="muted" style={{ marginTop: 12 }}>No paid corporate bookings yet.</div>}
    </Card>
  );
}
