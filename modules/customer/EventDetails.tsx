"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency, formatDateTime, formatPercentage } from "@/utils/format";
import { getEventSalesStatus, getSellableCategories } from "@/utils/ticketing";

export function EventDetails({ eventId }: { eventId: string }) {
  const { data: event, error, isLoading } = useAsyncResource(() => emtsApi.getEventById(eventId), [eventId]);
  const { data: refundPolicy } = useAsyncResource(() => emtsApi.getRefundPolicyByEvent(eventId), [eventId]);

  if (isLoading) {
    return <Card><div className="muted">Loading event details...</div></Card>;
  }

  if (!event) {
    return (
      <Card>
        <div className="eyebrow">Event</div>
        <h2 className="section-title">Event not found</h2>
        <p className="muted">{error || "The requested event could not be loaded from the live API."}</p>
      </Card>
    );
  }

  const salesStatus = getEventSalesStatus(event);
  const sellableCategories = getSellableCategories(event);

  return (
    <div className="grid">
      <div
        className="card panel"
        style={{
          minHeight: 380,
          background: `linear-gradient(160deg, rgba(6,11,18,0.22), rgba(6,11,18,0.58)), url(${event.bannerImageUrl}) center/cover`,
          color: "white"
        }}
      >
        <div className="pill" style={{ width: "fit-content", background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.12)", color: "white" }}>
          {event.eventType}
        </div>
        <div style={{ maxWidth: 720, marginTop: 24 }}>
          <h1 style={{ fontSize: "clamp(2.4rem, 4vw, 4.5rem)", letterSpacing: "-0.08em", marginBottom: 12 }}>{event.title}</h1>
          <p style={{ marginTop: 0, color: "rgba(255,255,255,0.82)", fontSize: "1.06rem" }}>{event.subtitle}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <Badge>{event.cityName}</Badge>
            <Badge>{formatDateTime(event.startDateTime)}</Badge>
            <Badge>{formatPercentage(event.occupancyPercentage)} sold</Badge>
            {salesStatus.saleNotStarted && salesStatus.earliestSaleStart && <Badge>Booking opens {formatDateTime(salesStatus.earliestSaleStart)}</Badge>}
            {salesStatus.soldOut && <Badge>Sold out</Badge>}
            {salesStatus.eventEnded && <Badge>Booking closed</Badge>}
          </div>
          <div style={{ marginTop: 24 }}>
            {salesStatus.canBook ? (
              <Link href={`/customer/checkout/${event.eventId}`} className="button button-primary">
                Proceed to ticketing
              </Link>
            ) : (
              <div className="badge" style={{ width: "fit-content" }}>
                {salesStatus.saleNotStarted && salesStatus.earliestSaleStart
                  ? `Booking window opens on ${formatDateTime(salesStatus.earliestSaleStart)}`
                  : salesStatus.soldOut
                    ? "This event is currently sold out."
                    : "Booking window is closed for this event."}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="two-column">
        <Card>
          <SectionHeader
            eyebrow="Event Overview"
            title="Commercially ready event detail experience"
            description={event.description}
          />
          <div className="grid" style={{ marginTop: 18 }}>
            {sellableCategories.map((category) => (
              <div key={category.ticketCategoryId} className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: "0 0 6px" }}>{category.displayName}</h3>
                    <div className="muted">{category.description}</div>
                  </div>
                  <Badge>{category.categoryCode}</Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 16 }}>
                  <strong>{formatCurrency(category.unitPrice)}</strong>
                  <span className="muted">{category.availableQuantity > 0 ? `${category.availableQuantity} seats available` : "Sold out"}</span>
                </div>
                <div className="muted" style={{ marginTop: 10 }}>
                  Sales start: {category.saleStartDate ? formatDateTime(category.saleStartDate) : "Immediate"}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="eyebrow">Refund policy</div>
          <h3 style={{ marginBottom: 6 }}>Applicable cancellation rules</h3>
          <div className="grid" style={{ marginTop: 16 }}>
            <div className="pill">Full refund before {refundPolicy?.fullRefundWindowHours ?? 0} hours</div>
            <div className="pill">{refundPolicy?.partialRefundPercentage ?? 0} percent refund before {refundPolicy?.partialRefundWindowHours ?? 0} hours</div>
            <div className="pill">No refund after the partial refund window closes</div>
            <div className="pill">QR ticket becomes invalid after cancellation</div>
          </div>
          <div style={{ marginTop: 24 }}>
            {salesStatus.canBook ? (
              <Link href={`/customer/checkout/${event.eventId}`} className="button button-primary" style={{ width: "100%" }}>
                Choose category and continue
              </Link>
            ) : (
              <div className="badge">
                {salesStatus.saleNotStarted && salesStatus.earliestSaleStart
                  ? `Booking opens on ${formatDateTime(salesStatus.earliestSaleStart)}`
                  : salesStatus.soldOut
                    ? "All categories are sold out."
                    : "Booking window is closed."}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
