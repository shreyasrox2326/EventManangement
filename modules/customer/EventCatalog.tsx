"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency, formatDate } from "@/utils/format";
import { getEventSalesStatus, getLowestAvailablePrice } from "@/utils/ticketing";

export function EventCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventType, setEventType] = useState("ALL");
  const [eventWindow, setEventWindow] = useState("UPCOMING");
  const [sortBy, setSortBy] = useState("date");
  const { data, error, isLoading } = useAsyncResource(() => emtsApi.getPublishedEvents(), []);
  const publishedEvents = data ?? [];

  const filteredEvents = useMemo(() => {
    const next = publishedEvents.filter((event) => {
      const now = Date.now();
      const start = new Date(event.startDateTime).getTime();
      const end = new Date(event.endDateTime).getTime();
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.cityName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = eventType === "ALL" || event.eventType === eventType;
      const matchesWindow =
        eventWindow === "UPCOMING"
          ? start > now
          : eventWindow === "ONGOING"
            ? start <= now && end > now
            : end <= now;
      return matchesSearch && matchesType && matchesWindow;
    });

    return next.sort((left, right) => {
      if (sortBy === "price") {
        return (getLowestAvailablePrice(left) ?? Number.MAX_SAFE_INTEGER) - (getLowestAvailablePrice(right) ?? Number.MAX_SAFE_INTEGER);
      }
      return new Date(left.startDateTime).getTime() - new Date(right.startDateTime).getTime();
    });
  }, [eventType, eventWindow, publishedEvents, searchTerm, sortBy]);

  return (
    <div className="grid">
      <SectionHeader eyebrow="Browse Events" title="Search, filter, and compare events" description="Browse published events and switch between upcoming, ongoing, and completed views." />
      <Card>
        <div className="grid" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Search</span>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 14, top: 16, color: "var(--text-soft)" }} />
              <input
                className="input"
                style={{ paddingLeft: 40 }}
                placeholder="Search by title or city"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Event Type</span>
            <select className="select" value={eventType} onChange={(event) => setEventType(event.target.value)}>
              <option value="ALL">All</option>
              <option value="CONFERENCE">Conference</option>
              <option value="CONCERT">Concert</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="SPORTS">Sports</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">View</span>
            <select className="select" value={eventWindow} onChange={(event) => setEventWindow(event.target.value)}>
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Sort By</span>
            <select className="select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="date">Date</option>
              <option value="price">Starting price</option>
            </select>
          </label>
        </div>
      </Card>
      {error && <div className="badge" style={{ color: "var(--danger)" }}>{error}</div>}
      {isLoading && filteredEvents.length === 0 && <Card><div className="muted">Loading live events...</div></Card>}
      {!isLoading && filteredEvents.length === 0 && <Card><div className="muted">No events matched the selected filters.</div></Card>}
      <div className="event-grid">
        {filteredEvents.map((event) => {
          const lowestPrice = getLowestAvailablePrice(event);
          const salesStatus = getEventSalesStatus(event);
          return (
            <Link key={event.eventId} href={`/customer/events/${event.eventId}`} className="card panel" style={{ display: "grid", gap: 14 }}>
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
                <Badge>{event.occupancyPercentage}% occupied</Badge>
                {salesStatus.saleNotStarted && <Badge>Booking window closed</Badge>}
                {salesStatus.soldOut && <Badge>Sold out</Badge>}
              </div>
              <div>
                <h3 style={{ margin: "0 0 6px" }}>{event.title}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {formatDate(event.startDateTime)} · {lowestPrice !== null ? `from ${formatCurrency(lowestPrice)}` : "Sold out"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
