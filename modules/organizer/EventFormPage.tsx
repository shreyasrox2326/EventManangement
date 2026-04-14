"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { emtsApi } from "@/services/live-api";

const toLocalDateTimeInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface CategoryDraft {
  name: string;
  price: string;
  totalQty: string;
  saleStartDate: string;
}

const createEmptyCategory = (): CategoryDraft => ({
  name: "",
  price: "",
  totalQty: "",
  saleStartDate: toLocalDateTimeInput(new Date())
});

const isReservedInternalCategoryName = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "staff" ||
    normalized === "vip" ||
    normalized === "internal" ||
    normalized.startsWith("internal usage")
  );
};

export function EventFormPage({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const { session } = useAuth();
  const organizerId = session?.user.userId ?? "u2";
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("");
  const [venueName, setVenueName] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [seatCapacity, setSeatCapacity] = useState("");
  const [categories, setCategories] = useState<CategoryDraft[]>([createEmptyCategory()]);
  const [fullRefundWindowHours, setFullRefundWindowHours] = useState("");
  const [partialRefundWindowHours, setPartialRefundWindowHours] = useState("");
  const [partialRefundPercentage, setPartialRefundPercentage] = useState("");
  const [message, setMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addCategory = () => {
    setCategories((current) => [...current, createEmptyCategory()]);
  };

  const updateCategory = (index: number, field: keyof CategoryDraft, value: string) => {
    setCategories((current) =>
      current.map((category, currentIndex) => (currentIndex === index ? { ...category, [field]: value } : category))
    );
  };

  const removeCategory = (index: number) => {
    setCategories((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const validateForm = () => {
    const nextErrors: string[] = [];
    const parsedCapacity = Number(seatCapacity);
    const parsedFullRefund = Number(fullRefundWindowHours);
    const parsedPartialRefund = Number(partialRefundWindowHours);
    const parsedPartialRefundPct = Number(partialRefundPercentage);

    if (!title.trim()) nextErrors.push("Event name is required.");
    if (!eventType.trim()) nextErrors.push("Event type is required.");
    if (!venueName.trim()) nextErrors.push("Venue is required.");
    if (!seatCapacity.trim()) nextErrors.push("Capacity is required.");
    if (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0) nextErrors.push("Capacity must be a positive number.");
    if (!startDateTime) nextErrors.push("Start date and time are required.");
    if (!endDateTime) nextErrors.push("End date and time are required.");
    if (startDateTime && new Date(startDateTime).getTime() <= Date.now()) nextErrors.push("Event start time must be in the future.");
    if (startDateTime && endDateTime && new Date(endDateTime).getTime() <= new Date(startDateTime).getTime()) nextErrors.push("End time must be after start time.");
    if (categories.length === 0) nextErrors.push("At least one ticket category is required.");

    const parsedCategories = categories.map((category) => ({
      ...category,
      parsedPrice: Number(category.price),
      parsedTotalQty: Number(category.totalQty)
    }));

    const totalCategoryCapacity = parsedCategories.reduce((sum, category) => sum + (Number.isFinite(category.parsedTotalQty) ? category.parsedTotalQty : 0), 0);
    if (Number.isFinite(parsedCapacity) && totalCategoryCapacity !== parsedCapacity) {
      nextErrors.push("The sum of all ticket category quantities must exactly match the venue capacity.");
    }

    parsedCategories.forEach((category, index) => {
      if (!category.name.trim()) nextErrors.push(`Ticket category ${index + 1} needs a name.`);
      if (isReservedInternalCategoryName(category.name)) {
        nextErrors.push(`Ticket category ${index + 1} uses a reserved internal-use name. Create only public sale categories here.`);
      }
      if (category.price.trim() === "") nextErrors.push(`Ticket category ${index + 1} needs a price.`);
      if (!Number.isFinite(category.parsedPrice) || category.parsedPrice < 0) nextErrors.push(`Ticket category ${index + 1} price must be zero or greater.`);
      if (category.totalQty.trim() === "") nextErrors.push(`Ticket category ${index + 1} needs a quantity.`);
      if (!Number.isFinite(category.parsedTotalQty) || category.parsedTotalQty <= 0) nextErrors.push(`Ticket category ${index + 1} quantity must be at least 1.`);
      if (!category.saleStartDate) nextErrors.push(`Ticket category ${index + 1} needs a sale start time.`);
      if (category.saleStartDate && endDateTime && new Date(category.saleStartDate).getTime() > new Date(endDateTime).getTime()) {
        nextErrors.push(`Ticket category ${index + 1} sale start cannot be after the event end time.`);
      }
    });

    if (fullRefundWindowHours.trim() === "") nextErrors.push("Full refund window is required.");
    if (partialRefundWindowHours.trim() === "") nextErrors.push("Partial refund window is required.");
    if (partialRefundPercentage.trim() === "") nextErrors.push("Partial refund percentage is required.");
    if (!Number.isFinite(parsedFullRefund) || parsedFullRefund < 0) nextErrors.push("Full refund window must be zero or greater.");
    if (!Number.isFinite(parsedPartialRefund) || parsedPartialRefund < 0) nextErrors.push("Partial refund window must be zero or greater.");
    if (!Number.isFinite(parsedPartialRefundPct) || parsedPartialRefundPct < 0 || parsedPartialRefundPct > 100) nextErrors.push("Partial refund percentage must be between 0 and 100.");
    if (Number.isFinite(parsedFullRefund) && Number.isFinite(parsedPartialRefund) && parsedFullRefund < parsedPartialRefund) nextErrors.push("Full refund window must be greater than or equal to the partial refund window.");

    setValidationErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    if (mode === "edit") {
      setMessage("Event updates are not available because the backend does not expose an update endpoint.");
      return;
    }

    if (!validateForm()) {
      setMessage("Validation failed. Fix the highlighted fields and try again.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await emtsApi.createEvent({
        organizerId,
        title: title.trim(),
        description: `${title.trim()} at ${venueName.trim()}`,
        eventType: eventType.trim(),
        status: "published",
        venueName: venueName.trim(),
        cityName: venueName.trim(),
        startDateTime,
        endDateTime,
        seatCapacity: Number(seatCapacity),
        categories: categories.map((category) => ({
          name: category.name.trim(),
          price: Number(category.price),
          totalQty: Number(category.totalQty),
          availableQty: Number(category.totalQty),
          saleStartDate: category.saleStartDate || startDateTime
        })),
        refundPolicy: {
          fullRefundWindowHours: Number(fullRefundWindowHours),
          partialRefundWindowHours: Number(partialRefundWindowHours),
          partialRefundPercentage: Number(partialRefundPercentage)
        }
      });
      router.push("/organizer/events");
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Event creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "edit") {
    return (
      <Card>
        <div className="eyebrow">Event Updates</div>
        <h2 className="section-title">Update is not supported by the backend</h2>
        <p className="muted">The current backend supports event creation and deletion, but it does not expose an update endpoint yet.</p>
        <Link href="/organizer/events" className="button button-primary" style={{ width: "fit-content" }}>
          Back to events
        </Link>
      </Card>
    );
  }

  return (
    <form className="grid" onSubmit={handleSubmit}>
      <div className="two-column">
        <Card>
          <div className="eyebrow">Create Event</div>
          <h2 className="section-title">Event details</h2>
          <div className="grid">
            <label style={{ display: "grid", gap: 8 }}>
              <span className="eyebrow">Event name</span>
              <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter event name" />
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              <span className="eyebrow">Event type</span>
              <input className="input" value={eventType} onChange={(event) => setEventType(event.target.value)} placeholder="Concert, conference, workshop..." />
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              <span className="eyebrow">Venue</span>
              <input className="input" value={venueName} onChange={(event) => setVenueName(event.target.value)} placeholder="Enter venue name" />
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              <span className="eyebrow">Start date and time</span>
              <input className="input" type="datetime-local" value={startDateTime} onChange={(event) => setStartDateTime(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              <span className="eyebrow">End date and time</span>
              <input className="input" type="datetime-local" value={endDateTime} onChange={(event) => setEndDateTime(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              <span className="eyebrow">Capacity</span>
              <input className="input" type="number" min={1} value={seatCapacity} onChange={(event) => setSeatCapacity(event.target.value)} placeholder="Enter venue capacity" />
            </label>
          </div>
        </Card>

        <Card>
          <div className="eyebrow">Refund Policy</div>
          <h2 className="section-title">Cancellation windows</h2>
          <div className="grid">
            <label style={{ display: "grid", gap: 8 }}>
              <span className="eyebrow">Full refund window (hours)</span>
              <input className="input" type="number" min={0} value={fullRefundWindowHours} onChange={(event) => setFullRefundWindowHours(event.target.value)} placeholder="Example: 168" />
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              <span className="eyebrow">Partial refund window (hours)</span>
              <input className="input" type="number" min={0} value={partialRefundWindowHours} onChange={(event) => setPartialRefundWindowHours(event.target.value)} placeholder="Example: 48" />
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              <span className="eyebrow">Partial refund percentage</span>
              <input className="input" type="number" min={0} max={100} value={partialRefundPercentage} onChange={(event) => setPartialRefundPercentage(event.target.value)} placeholder="Example: 50" />
            </label>
          </div>
        </Card>
      </div>

      <Card>
        <div className="eyebrow">Ticket Categories</div>
        <h2 className="section-title">Event-owned categories</h2>
        <div className="grid">
          {categories.map((category, index) => (
            <div key={index} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <strong>Category {index + 1}</strong>
                {categories.length > 1 && (
                  <button type="button" onClick={() => removeCategory(index)} style={{ background: "none", border: 0, color: "var(--danger)", cursor: "pointer" }}>
                    Remove
                  </button>
                )}
              </div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span className="eyebrow">Category name</span>
                  <input className="input" value={category.name} onChange={(event) => updateCategory(index, "name", event.target.value)} placeholder="VIP, General, Student..." />
                </label>
                <label style={{ display: "grid", gap: 8 }}>
                  <span className="eyebrow">Price</span>
                  <input className="input" type="number" min={0} value={category.price} onChange={(event) => updateCategory(index, "price", event.target.value)} placeholder="Enter ticket price" />
                </label>
                <label style={{ display: "grid", gap: 8 }}>
                  <span className="eyebrow">Quantity</span>
                  <input className="input" type="number" min={1} value={category.totalQty} onChange={(event) => updateCategory(index, "totalQty", event.target.value)} placeholder="Enter quantity" />
                </label>
                <label style={{ display: "grid", gap: 8 }}>
                  <span className="eyebrow">Sale start</span>
                  <input className="input" type="datetime-local" value={category.saleStartDate} onChange={(event) => updateCategory(index, "saleStartDate", event.target.value)} />
                </label>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          <Button type="button" variant="secondary" onClick={addCategory}>
            Add ticket category
          </Button>
        </div>
      </Card>

      {(validationErrors.length > 0 || message) && (
        <Card>
          <div className="eyebrow">Form Feedback</div>
          {validationErrors.length > 0 && (
            <div className="badge">
              {validationErrors.join(" ")}
            </div>
          )}
          {message && <div className="badge" style={{ marginTop: validationErrors.length > 0 ? 12 : 0 }}>{message}</div>}
        </Card>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create event"}
        </Button>
        <Link href="/organizer/events" className="button button-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
