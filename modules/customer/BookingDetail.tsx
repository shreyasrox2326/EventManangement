"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QrCodeCard } from "@/components/ui/QrCodeCard";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { buildTicketQrPayload } from "@/utils/ticketing";

const statusDot = (status: string) => (status === "ACTIVE" ? "var(--success)" : status === "USED" ? "var(--danger)" : "var(--text-soft)");
const statusLabel = (status: string) => (status === "ACTIVE" ? "Unused" : status === "USED" ? "Used" : "Cancelled");

export function BookingDetail({ bookingId }: { bookingId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [showQrs, setShowQrs] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { data, isLoading, error } = useAsyncResource(async () => {
    const booking = await emtsApi.getBookingById(bookingId);
    if (!booking) {
      return null;
    }

    const [event, tickets] = await Promise.all([
      emtsApi.getEventById(booking.eventId),
      emtsApi.getTicketsByBooking(booking.bookingId)
    ]);

    return { booking, event, tickets };
  }, [bookingId, refreshKey]);

  if (isLoading) {
    return <Card><div className="muted">Loading booking...</div></Card>;
  }

  if (!data) {
    return <Card><div className="muted">{error || "Booking not found."}</div></Card>;
  }

  const { booking, event, tickets } = data;
  const groupedTickets = Object.values(
    tickets.reduce<Record<string, { categoryName: string; quantity: number; usedCount: number }>>((accumulator, ticket) => {
      if (!accumulator[ticket.seatLabel]) {
        accumulator[ticket.seatLabel] = { categoryName: ticket.seatLabel, quantity: 0, usedCount: 0 };
      }
      accumulator[ticket.seatLabel].quantity += 1;
      if (ticket.ticketStatus === "USED") {
        accumulator[ticket.seatLabel].usedCount += 1;
      }
      return accumulator;
    }, {})
  );

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    setMessage("");

    try {
      await emtsApi.cancelBooking(bookingId);
      setMessage("The booking was cancelled and all tickets under it were processed together.");
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to cancel booking.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadQrs = async () => {
    setIsDownloading(true);
    setMessage("");
    try {
      const { downloadTicketQrZip } = await import("@/utils/ticketing");
      await downloadTicketQrZip(tickets);
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to download QR files.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="grid">
      <Card>
        <div className="eyebrow">Booking</div>
        <h2 className="section-title">{event?.title ?? booking.eventId}</h2>
        <div className="details-list" style={{ marginTop: 16 }}>
          <div className="details-row">
            <div className="details-key">Booking ID</div>
            <div className="details-value mono">{booking.bookingId}</div>
          </div>
          <div className="details-row">
            <div className="details-key">Booked at</div>
            <div className="details-value">{formatDateTime(booking.createdAt)}</div>
          </div>
          <div className="details-row">
            <div className="details-key">Total amount</div>
            <div className="details-value">{formatCurrency(booking.totalAmount)}</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="eyebrow">Ticket Breakdown</div>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Quantity</th>
              <th>Used</th>
            </tr>
          </thead>
          <tbody>
            {groupedTickets.map((row) => (
              <tr key={row.categoryName}>
                <td>{row.categoryName}</td>
                <td>{row.quantity}</td>
                <td>{row.usedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <div className="eyebrow">Issued Tickets</div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
            <span className="muted">Unused</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--danger)", display: "inline-block" }} />
            <span className="muted">Used</span>
          </div>
        </div>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Category</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.ticketId}>
                <td className="mono">{ticket.ticketId}</td>
                <td>{ticket.seatLabel}</td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: statusDot(ticket.ticketStatus), display: "inline-block" }} />
                    <span>{statusLabel(ticket.ticketStatus)}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button type="button" variant="secondary" onClick={() => setShowQrs((current) => !current)} disabled={tickets.length === 0}>
          {showQrs ? "Hide QRs" : "Show QRs"}
        </Button>
        <Button type="button" variant="secondary" onClick={handleDownloadQrs} disabled={isDownloading || tickets.length === 0}>
          {isDownloading ? "Preparing ZIP..." : "Download QRs"}
        </Button>
      </div>

      {showQrs && (
        <Card>
          <div className="eyebrow">Ticket QR Codes</div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 16 }}>
            {tickets.map((ticket) => (
              <QrCodeCard
                key={ticket.ticketId}
                value={buildTicketQrPayload(ticket)}
                label={[ticket.seatLabel, ticket.ticketId].join(" · ")}
                prefix={<span style={{ width: 10, height: 10, borderRadius: "50%", background: statusDot(ticket.ticketStatus), display: "inline-block" }} />}
              />
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button type="button" variant="secondary" onClick={handleCancelBooking} disabled={isCancelling || tickets.every((ticket) => ticket.ticketStatus === "CANCELLED")}>
          {isCancelling ? "Cancelling..." : "Cancel booking"}
        </Button>
        <Link href="/customer/history" className="button button-secondary">Back to history</Link>
      </div>
      {message && <div className="badge">{message}</div>}
    </div>
  );
}
