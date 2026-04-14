"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QrCodeCard } from "@/components/ui/QrCodeCard";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { Ticket } from "@/types/contracts";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { buildTicketQrPayload, downloadTicketQrZip } from "@/utils/ticketing";

const statusDot = (status: string) => (status === "ACTIVE" ? "var(--success)" : status === "USED" ? "var(--danger)" : "var(--text-soft)");
export function BookingDetailPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const corporateUserId = session?.user.userId ?? "";
  const routeId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId;
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQrs, setShowQrs] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [paymentChallengeId, setPaymentChallengeId] = useState("");
  const [paymentOtpCode, setPaymentOtpCode] = useState("");
  const [paymentOtpExpiresAt, setPaymentOtpExpiresAt] = useState("");
  const { data, isLoading } = useAsyncResource(async () => {
    const [requests, events] = await Promise.all([
      emtsApi.getCorporateRequestsForCorporate(corporateUserId),
      emtsApi.getEvents()
    ]);

    const request = requests.find((entry) => entry.requestId === routeId || entry.bookingId === routeId) ?? null;
    if (!request) {
      return null;
    }

    const event = events.find((entry) => entry.eventId === request.eventId) ?? null;
    const tickets = request.bookingId ? await emtsApi.getTicketsByBooking(request.bookingId) : [];

    return { request, event, tickets };
  }, [corporateUserId, routeId, refreshKey]);

  const request = data?.request ?? null;
  const event = data?.event ?? null;
  const tickets = data?.tickets ?? [];

  const offerTotal = useMemo(
    () => request?.offeredTotalAmount ?? request?.items.reduce((sum, item) => sum + ((item.offeredUnitPrice ?? 0) * (item.approvedQty ?? 0)), 0) ?? 0,
    [request]
  );

  const bookedCountsByCategory = useMemo(
    () =>
      tickets.reduce<Record<string, number>>((accumulator, ticket) => {
        accumulator[ticket.ticketCategoryId] = (accumulator[ticket.ticketCategoryId] ?? 0) + 1;
        return accumulator;
      }, {}),
    [tickets]
  );

  const usedCountsByCategory = useMemo(
    () =>
      tickets.reduce<Record<string, number>>((accumulator, ticket) => {
        if (ticket.ticketStatus === "USED") {
          accumulator[ticket.ticketCategoryId] = (accumulator[ticket.ticketCategoryId] ?? 0) + 1;
        }
        return accumulator;
      }, {}),
    [tickets]
  );

  useEffect(() => {
    if (!isLoading && !request) {
      router.replace("/corporate");
    }
  }, [isLoading, request, router]);

  const handlePay = async () => {
    if (!request) return;
    setIsSubmitting(true);
    setMessage("");
    try {
      const challenge = await emtsApi.sendCorporatePaymentOtp(request.requestId, "corporate");
      setPaymentChallengeId(challenge.challengeId);
      setPaymentOtpExpiresAt(challenge.expiresAt);
      setMessage("Payment OTP sent to your email.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send payment OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!request) return;
    if (!paymentChallengeId || !paymentOtpCode.trim()) {
      setMessage("Enter the OTP sent to your email.");
      return;
    }
    setIsSubmitting(true);
    setMessage("");
    try {
      await emtsApi.payCorporateRequest(request.requestId, "corporate", {
        challengeId: paymentChallengeId,
        otpCode: paymentOtpCode.trim()
      });
      setPaymentChallengeId("");
      setPaymentOtpCode("");
      setPaymentOtpExpiresAt("");
      setRefreshKey((current) => current + 1);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!request) return;
    setIsSubmitting(true);
    setMessage("");
    try {
      await emtsApi.cancelCorporateRequest(request.requestId);
      setRefreshKey((current) => current + 1);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to cancel request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadQrs = async () => {
    setIsDownloading(true);
    setMessage("");
    try {
      await downloadTicketQrZip(tickets as Array<Pick<Ticket, "ticketId" | "bookingId" | "seatLabel" | "qrCodeValue">>);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to download QR files.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!request) {
    return <Card><div className="muted">Loading request details...</div></Card>;
  }

  return (
    <div className="grid">
      <Card style={{ padding: 24 }}>
        <div className="eyebrow">{request.bookingId ? "Corporate booking" : "Corporate request"}</div>
        <h2 className="section-title">{request.bookingId ? `Booking ${request.bookingId}` : `Request ${request.requestId}`}</h2>
        <div className="details-list" style={{ marginTop: 12 }}>
          <div className="details-row">
            <div className="details-key">Event</div>
            <div className="details-value">{event?.title ?? request.eventId}</div>
          </div>
          <div className="details-row">
            <div className="details-key">Status</div>
            <div className="details-value">{request.status.replaceAll("_", " ")}</div>
          </div>
          <div className="details-row">
            <div className="details-key">Created</div>
            <div className="details-value">{formatDateTime(request.createdAt)}</div>
          </div>
          {request.paidAt && (
            <div className="details-row">
              <div className="details-key">Paid at</div>
              <div className="details-value">{formatDateTime(request.paidAt)}</div>
            </div>
          )}
          {request.expiresAt && (
            <div className="details-row">
              <div className="details-key">Payment deadline</div>
              <div className="details-value">{formatDateTime(request.expiresAt)}</div>
            </div>
          )}
          {request.organizerNote && (
            <div className="details-row">
              <div className="details-key">Organizer note</div>
              <div className="details-value">{request.organizerNote}</div>
            </div>
          )}
        </div>
      </Card>

      <Card style={{ padding: 24 }}>
        <div className="eyebrow">Ticket Breakdown</div>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Requested</th>
              <th>Approved</th>
              <th>Booked</th>
              <th>Used</th>
              <th>Unit price</th>
            </tr>
          </thead>
          <tbody>
            {request.items.map((item) => {
              const category = event?.ticketCategories.find((entry) => entry.ticketCategoryId === item.categoryId);
              return (
                <tr key={item.requestItemId}>
                  <td>{category?.displayName ?? item.categoryId}</td>
                  <td>{item.requestedQty}</td>
                  <td>{item.approvedQty ?? "-"}</td>
                  <td>{request.status === "paid" ? (bookedCountsByCategory[item.categoryId] ?? 0) : 0}</td>
                  <td>{request.status === "paid" ? (usedCountsByCategory[item.categoryId] ?? 0) : 0}</td>
                  <td>{item.offeredUnitPrice !== undefined ? formatCurrency(item.offeredUnitPrice) : "Pending"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {offerTotal > 0 && (
          <div className="details-list" style={{ marginTop: 16 }}>
            <div className="details-row">
              <div className="details-key">Total offer</div>
              <div className="details-value">{formatCurrency(offerTotal)}</div>
            </div>
          </div>
        )}
        {message && <div className="badge" style={{ marginTop: 16 }}>{message}</div>}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          {request.status === "approved_pending_payment" && (
            <>
              {!paymentChallengeId ? (
                <Button type="button" disabled={isSubmitting} onClick={handlePay}>
                  {isSubmitting ? "Sending OTP..." : "Send payment OTP"}
                </Button>
              ) : (
                <>
                  <input
                    className="input mono"
                    style={{ minWidth: 180 }}
                    inputMode="numeric"
                    value={paymentOtpCode}
                    onChange={(event) => setPaymentOtpCode(event.target.value)}
                    placeholder="Enter OTP"
                  />
                  <Button type="button" disabled={isSubmitting} onClick={handleConfirmPayment}>
                    {isSubmitting ? "Confirming..." : "Confirm payment"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                    onClick={() => {
                      setPaymentChallengeId("");
                      setPaymentOtpCode("");
                      setPaymentOtpExpiresAt("");
                      setMessage("");
                    }}
                  >
                    Cancel OTP
                  </Button>
                </>
              )}
            </>
          )}
          {(request.status === "submitted" || request.status === "approved_pending_payment") && (
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={handleCancel}>
              Cancel request
            </Button>
          )}
          {request.status === "paid" && tickets.length > 0 && (
            <>
              <Button type="button" variant="secondary" onClick={() => setShowQrs((current) => !current)}>
                {showQrs ? "Hide QRs" : "Show QRs"}
              </Button>
              <Button type="button" variant="secondary" disabled={isDownloading} onClick={handleDownloadQrs}>
                {isDownloading ? "Preparing ZIP..." : "Download QRs"}
              </Button>
            </>
          )}
        </div>
        {paymentChallengeId && (
          <div className="muted" style={{ marginTop: 12 }}>
            OTP expires at {paymentOtpExpiresAt}.
          </div>
        )}
      </Card>

      {tickets.length > 0 && (
        <Card style={{ padding: 24 }}>
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
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: statusDot(ticket.ticketStatus), display: "inline-block" }} />
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </Card>
      )}

      {showQrs && tickets.length > 0 && (
        <Card style={{ padding: 24 }}>
          <div className="eyebrow">Issued QR Codes</div>
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
    </div>
  );
}
