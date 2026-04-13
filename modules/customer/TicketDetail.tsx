"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QrCodeCard } from "@/components/ui/QrCodeCard";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { buildTicketQrPayload } from "@/utils/ticketing";

const prettyTicketStatus = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "Booked";
    case "USED":
      return "Present";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
};

const paymentStatusTone = (status?: string) => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized.startsWith("refunded")) return "var(--warning)";
  if (normalized === "success") return "var(--success)";
  if (normalized === "cancelled") return "var(--danger)";
  return "var(--text-soft)";
};

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const { data: ticket, error, isLoading } = useAsyncResource(() => emtsApi.getTicketById(ticketId), [ticketId, refreshKey]);
  const { data: bookingBundle } = useAsyncResource(
    async () => {
      const nextTicket = await emtsApi.getTicketById(ticketId);
      if (!nextTicket) return null;

      const [booking, event, payment, refundPolicy, tickets] = await Promise.all([
        emtsApi.getBookingById(nextTicket.bookingId),
        emtsApi.getEventById(nextTicket.eventId),
        emtsApi.getPaymentByBooking(nextTicket.bookingId),
        emtsApi.getRefundPolicyByEvent(nextTicket.eventId),
        emtsApi.getTicketsByBooking(nextTicket.bookingId)
      ]);

      return { booking, event, payment, refundPolicy, tickets };
    },
    [ticketId, refreshKey]
  );

  if (isLoading) {
    return <Card><div className="muted">Loading live ticket details...</div></Card>;
  }

  if (!ticket || !bookingBundle) {
    return <Card><div className="muted">{error || "Ticket not found."}</div></Card>;
  }

  const { booking, event, payment, refundPolicy, tickets } = bookingBundle;
  const cancellationBlocked = ticket.ticketStatus !== "ACTIVE";
  const hoursToEvent = event ? (new Date(event.startDateTime).getTime() - Date.now()) / (1000 * 60 * 60) : null;
  const policyState = !refundPolicy
    ? "No refund policy found."
    : hoursToEvent === null
      ? refundPolicy.policyDescription ?? "Refund policy available."
      : hoursToEvent >= refundPolicy.fullRefundWindowHours
        ? `Full refund available until ${refundPolicy.fullRefundWindowHours} hours before the event.`
        : hoursToEvent >= refundPolicy.partialRefundWindowHours
          ? `${refundPolicy.partialRefundPercentage}% refund available until ${refundPolicy.partialRefundWindowHours} hours before the event.`
          : "Refund window has closed, but unused tickets can still be cancelled until the event ends without a refund.";

  const handleCancel = async () => {
    if (!booking) {
      setMessage("Booking information is unavailable.");
      return;
    }

    setIsCancelling(true);
    setMessage("");

    try {
      await emtsApi.cancelBooking(booking.bookingId);
      setMessage("The whole booking was cancelled and every ticket under it was processed together.");
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Cancellation failed.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="two-column">
      <Card>
        <div className="eyebrow">Issued Ticket</div>
        <h2 className="section-title">{event?.title ?? "Ticket details"}</h2>
        <div className="details-list" style={{ marginTop: 18 }}>
          <div className="details-row">
            <div className="details-key">Ticket ID</div>
            <div className="details-value mono">{ticket.ticketId}</div>
          </div>
          <div className="details-row">
            <div className="details-key">Category</div>
            <div className="details-value">{ticket.seatLabel}</div>
          </div>
          <div className="details-row">
            <div className="details-key">Status</div>
            <div className="details-value">{prettyTicketStatus(ticket.ticketStatus)}</div>
          </div>
          <div className="details-row">
            <div className="details-key">Issued at</div>
            <div className="details-value">{formatDateTime(ticket.issuedAt)}</div>
          </div>
          {ticket.validatedAt && (
            <div className="details-row">
              <div className="details-key">Validated at</div>
              <div className="details-value">{formatDateTime(ticket.validatedAt)}</div>
            </div>
          )}
          <Link href={`/customer/bookings/${booking?.bookingId}`} className="button button-secondary" style={{ width: "fit-content" }}>
            Open booking
          </Link>
        </div>
      </Card>

      <QrCodeCard value={buildTicketQrPayload(ticket)} label="Ticket QR" />

      <Card>
        <div className="eyebrow">Booking and cancellation</div>
        <h3 style={{ marginBottom: 6 }}>Booking-level refund handling</h3>
        <div className="grid" style={{ marginTop: 18 }}>
          <Badge style={{ color: paymentStatusTone(payment?.paymentStatus) }}>
            {payment?.paymentStatus ?? "No payment found"}
          </Badge>
          <div className="details-list">
            <div className="details-row">
              <div className="details-key">Booking total</div>
              <div className="details-value">{formatCurrency(booking?.totalAmount ?? 0)}</div>
            </div>
            <div className="details-row">
              <div className="details-key">Tickets in booking</div>
              <div className="details-value">{tickets.length}</div>
            </div>
            <div className="details-row">
              <div className="details-key">Event start</div>
              <div className="details-value">{event ? formatDateTime(event.startDateTime) : "Unknown"}</div>
            </div>
            <div className="details-row">
              <div className="details-key">Venue</div>
              <div className="details-value">{event?.venueName ?? "Unknown"}</div>
            </div>
          </div>
          <div className="badge">{policyState}</div>
          {message && <div className="badge">{message}</div>}
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={cancellationBlocked || isCancelling}>
            {isCancelling ? "Cancelling..." : cancellationBlocked ? "Booking cannot be cancelled" : "Cancel booking"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
