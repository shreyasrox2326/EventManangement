"use client";

import Link from "next/link";
import { useAuth } from "@/app/providers";
import { Card } from "@/components/ui/Card";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency, formatDateTime } from "@/utils/format";

export function PurchaseHistory() {
  const { session } = useAuth();
  const customerId = session?.user.userId ?? "u1";
  const { data, isLoading } = useAsyncResource(async () => {
    const [bookings, events] = await Promise.all([
      emtsApi.getUserBookings(customerId),
      emtsApi.getEvents()
    ]);
    return bookings.map((booking) => ({
      booking,
      event: events.find((event) => event.eventId === booking.eventId) ?? null
    }));
  }, [customerId]);

  const rows = data ?? [];

  return (
    <Card>
      <div className="eyebrow">Purchase History</div>
      <h2 className="section-title">Bookings and ticket activity</h2>
      {isLoading && <p className="muted">Loading booking history...</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Status</th>
            <th>Tickets</th>
            <th>Amount</th>
            <th>Created At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ booking, event }) => (
            <tr key={booking.bookingId}>
              <td>{event?.title ?? booking.eventId}</td>
              <td>{booking.bookingStatus}</td>
              <td>{booking.ticketIds.length}</td>
              <td>{formatCurrency(booking.totalAmount)}</td>
              <td>{formatDateTime(booking.createdAt)}</td>
              <td>
                <Link href={`/customer/bookings/${booking.bookingId}`}>Open booking</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
