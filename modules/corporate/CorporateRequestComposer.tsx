"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { getSellableCategories } from "@/utils/ticketing";

export function CorporateRequestComposer({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { session } = useAuth();
  const corporateUserId = session?.user.userId ?? "";
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [corporateNote, setCorporateNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: event, error, isLoading } = useAsyncResource(() => emtsApi.getEventById(eventId), [eventId]);
  const { data: organizerProfilesData } = useAsyncResource(() => emtsApi.getOrganizerProfiles(), [eventId]);
  const organizerProfiles = organizerProfilesData ?? [];

  const totalRequested = useMemo(
    () => Object.values(quantities).reduce((sum, value) => sum + (Number(value) || 0), 0),
    [quantities]
  );

  const handleSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    if (!event) {
      setMessage("Event details are unavailable.");
      return;
    }

    const items = event.ticketCategories
      .map((category) => ({
        categoryId: category.ticketCategoryId,
        quantity: Number(quantities[category.ticketCategoryId] || 0)
      }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setMessage("Select at least one category quantity.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await emtsApi.createCorporateRequest({
        corporateUserId,
        eventId: event.eventId,
        corporateNote,
        items
      });
      router.push("/corporate");
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to submit corporate request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Card><div className="muted">Loading event details...</div></Card>;
  }

  if (!event) {
    return <Card><div className="muted">{error || "Event not found."}</div></Card>;
  }

  const sellableCategories = getSellableCategories(event);

  return (
    <form className="grid" onSubmit={handleSubmit}>
      <Card style={{ padding: 24 }}>
        <div className="eyebrow">Corporate Request</div>
        <h2 className="section-title">{event.title}</h2>
        <div className="muted">{formatDateTime(event.startDateTime)} · {event.venueName}</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Organizer: {organizerProfiles.find((profile) => profile.userId === event.organizerId)?.orgName ?? "Organizer"}
        </div>
      </Card>

      <Card style={{ padding: 24 }}>
        <div className="eyebrow">Ticket Categories</div>
        <table className="table" style={{ marginTop: 18 }}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Price</th>
              <th>Available</th>
              <th>Requested</th>
            </tr>
          </thead>
          <tbody>
            {sellableCategories.map((category) => (
              <tr key={category.ticketCategoryId}>
                <td>{category.displayName}</td>
                <td>{formatCurrency(category.unitPrice)}</td>
                <td>{category.availableQuantity}</td>
                <td>
                  <input
                    className="input"
                    style={{ maxWidth: 140 }}
                    type="number"
                    min={0}
                    max={category.availableQuantity}
                    value={quantities[category.ticketCategoryId] ?? ""}
                    onChange={(nextEvent) =>
                      setQuantities((current) => ({
                        ...current,
                        [category.ticketCategoryId]: nextEvent.target.value
                      }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <label style={{ display: "grid", gap: 8, marginTop: 18 }}>
          <span className="eyebrow">Note to organizer</span>
          <textarea className="textarea" rows={4} value={corporateNote} onChange={(nextEvent) => setCorporateNote(nextEvent.target.value)} />
        </label>
      </Card>

      <Card style={{ padding: 24 }}>
        <div className="eyebrow">Summary</div>
        <div className="pill" style={{ justifyContent: "space-between" }}>
          <span>Total requested tickets</span>
          <strong>{totalRequested}</strong>
        </div>
        {message && <div className="badge" style={{ marginTop: 16 }}>{message}</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <Button type="submit" disabled={isSubmitting || totalRequested <= 0}>
            {isSubmitting ? "Submitting..." : "Submit request"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
