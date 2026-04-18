"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency } from "@/utils/format";

export function BulkBookingManagement() {
  const { session } = useAuth();
  const organizerId = session?.user.userId ?? "u2";
  const [refreshKey, setRefreshKey] = useState(0);
  const [eventId, setEventId] = useState("");
  const [name, setName] = useState("VIP");
  const [price, setPrice] = useState(0);
  const [capacity, setCapacity] = useState(10);
  const [saleStartDate, setSaleStartDate] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: eventsData, isLoading, error } = useAsyncResource(
    async () => (await emtsApi.getEvents()).filter((event) => event.organizerId === organizerId),
    [organizerId, refreshKey]
  );
  const events = eventsData ?? [];

  const handleCreateCategory = async () => {
    if (!eventId) {
      setMessage("Select an event before creating a ticket category.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await emtsApi.upsertTicketCategory({
        categoryId: `category-${Date.now()}`,
        eventId,
        name: name.trim(),
        price,
        totalQty: capacity,
        availableQty: capacity,
        saleStartDate: saleStartDate || new Date().toISOString()
      });
      setMessage("Ticket category saved to the backend.");
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to create the category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: "1.1fr 1fr" }}>
      <Card>
        <div className="eyebrow">Ticket Categories</div>
        <h2 className="section-title">Existing categories by event</h2>
        {error && <div className="badge" style={{ marginBottom: 16 }}>{error}</div>}
        {isLoading && events.length === 0 ? (
          <div className="muted">Loading organizer ticket categories...</div>
        ) : (
          <div className="grid">
            {events.map((event) => (
              <div key={event.eventId} className="card" style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0, marginBottom: 6 }}>{event.title}</h3>
                <div className="muted" style={{ marginBottom: 16 }}>{event.venueName}</div>
                {event.ticketCategories.length === 0 ? (
                  <div className="muted">No categories created yet.</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Capacity</th>
                        <th>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.ticketCategories.map((category) => (
                        <tr key={category.ticketCategoryId}>
                          <td>{category.displayName}</td>
                          <td>{formatCurrency(category.unitPrice)}</td>
                          <td>{category.capacity}</td>
                          <td>{category.availableQuantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card>
        <div className="eyebrow">Create Category</div>
        <h3 style={{ marginBottom: 16 }}>Add VIP, staff, complimentary, or bulk-style categories</h3>
        <div className="grid">
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Event</span>
            <select className="select" value={eventId} onChange={(currentEvent) => setEventId(currentEvent.target.value)}>
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.eventId} value={event.eventId}>{event.title} ({event.eventId})</option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Category name</span>
            <input className="input" value={name} onChange={(currentEvent) => setName(currentEvent.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Price</span>
            <input className="input" type="number" min={0} value={price} onChange={(currentEvent) => setPrice(Number(currentEvent.target.value) || 0)} />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Quantity</span>
            <input className="input" type="number" min={1} value={capacity} onChange={(currentEvent) => setCapacity(Number(currentEvent.target.value) || 1)} />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Sale start</span>
            <input className="input" type="datetime-local" value={saleStartDate} onChange={(currentEvent) => setSaleStartDate(currentEvent.target.value)} />
          </label>
          {message && <div className="badge">{message}</div>}
          <Button type="button" onClick={handleCreateCategory} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Create ticket category"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
