"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { getEventSalesStatus, getLowestAvailablePrice, getSellableCategories } from "@/utils/ticketing";

export function BulkRequestPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading, error } = useAsyncResource(() => emtsApi.getPublishedEvents(), []);
  const { data: organizerProfilesData } = useAsyncResource(() => emtsApi.getOrganizerProfiles(), []);
  const events = data ?? [];
  const organizerProfiles = organizerProfilesData ?? [];

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) {
          return true;
        }

        return (
          event.title.toLowerCase().includes(query) ||
          event.venueName.toLowerCase().includes(query) ||
          event.cityName.toLowerCase().includes(query)
        );
      }),
    [events, searchTerm]
  );

  return (
    <div className="grid">
      <Card>
        <div className="eyebrow">Browse Events</div>
        <h2 className="section-title">Choose an event to request corporate tickets</h2>
        <label style={{ display: "grid", gap: 8, marginTop: 18 }}>
          <span className="eyebrow">Search</span>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: 16, color: "var(--text-soft)" }} />
            <input
              className="input"
              style={{ paddingLeft: 40 }}
              placeholder="Search by event name or venue"
              value={searchTerm}
              onChange={(nextEvent) => setSearchTerm(nextEvent.target.value)}
            />
          </div>
        </label>
        {error && <div className="badge" style={{ marginTop: 16 }}>{error}</div>}
      </Card>

      {isLoading && filteredEvents.length === 0 && <Card><div className="muted">Loading published events...</div></Card>}

      {!isLoading && filteredEvents.length === 0 && (
        <Card>
          <div className="muted">No published events matched the current search.</div>
        </Card>
      )}

      <div className="event-grid">
        {filteredEvents.map((event) => {
          const organizerName = organizerProfiles.find((profile) => profile.userId === event.organizerId)?.orgName ?? "Organizer";
          const lowestPrice = getLowestAvailablePrice(event);
          const salesStatus = getEventSalesStatus(event);
          const saleStartValues = getSellableCategories(event)
            .map((category) => category.saleStartDate)
            .filter((value): value is string => Boolean(value))
            .sort((left, right) => new Date(left).getTime() - new Date(right).getTime());

          return (
            <Link key={event.eventId} href={`/corporate/request/${event.eventId}`} className="card panel" style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  height: 210,
                  borderRadius: 18,
                  background: `linear-gradient(160deg, rgba(8,12,20,0.14), rgba(0,0,0,0.48)), url(${event.bannerImageUrl}) center/cover`
                }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge>{event.eventType}</Badge>
                <Badge>{event.cityName}</Badge>
                <Badge>Organizer: {organizerName}</Badge>
                {salesStatus.saleNotStarted && <Badge>Booking window closed</Badge>}
                {salesStatus.soldOut && <Badge>Sold out</Badge>}
              </div>
              <div>
                <h3 style={{ margin: "0 0 6px" }}>{event.title}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {formatDateTime(event.startDateTime)} · {lowestPrice !== null ? `from ${formatCurrency(lowestPrice)}` : "Sold out"}
                </p>
                <p className="muted" style={{ margin: "8px 0 0" }}>
                  Ticket sales start: {saleStartValues[0] ? formatDateTime(saleStartValues[0]) : "Immediate"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
