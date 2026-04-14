"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency } from "@/utils/format";
import { getEventSalesStatus, getSellableCategories } from "@/utils/ticketing";

export function CheckoutScreen({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { session } = useAuth();
  const { data: event, error, isLoading } = useAsyncResource(() => emtsApi.getEventById(eventId), [eventId]);
  const [categoryId, setCategoryId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const sellableCategories = event ? getSellableCategories(event) : [];
    if (sellableCategories[0]?.ticketCategoryId) {
      setCategoryId(sellableCategories[0].ticketCategoryId);
    }
  }, [event]);

  const categories = event ? getSellableCategories(event) : [];
  const selectedCategory = categories.find((category) => category.ticketCategoryId === categoryId) ?? categories[0] ?? null;
  const parsedQuantity = Number.parseInt(quantity, 10);
  const hasValidQuantity = Number.isFinite(parsedQuantity) && parsedQuantity >= 1;
  const total = (selectedCategory?.unitPrice ?? 0) * (hasValidQuantity ? parsedQuantity : 0);
  const salesStatus = event ? getEventSalesStatus(event) : null;

  const availabilityTone = useMemo(() => {
    if (!selectedCategory) {
      return "Unavailable";
    }
    if (selectedCategory.availableQuantity === 0) {
      return "Sold out";
    }
    if (selectedCategory.availableQuantity < 10) {
      return "Limited availability";
    }
    if (selectedCategory.availableQuantity < 50) {
      return "High demand";
    }
    return "Available";
  }, [selectedCategory?.availableQuantity]);

  if (isLoading) {
    return <Card><div className="muted">Loading checkout...</div></Card>;
  }

  if (!event) {
    return (
      <Card>
        <div className="eyebrow">Checkout</div>
        <h2 className="section-title">Event not found</h2>
        <p className="muted">{error || "The requested event could not be loaded into the checkout flow."}</p>
      </Card>
    );
  }

  if (!selectedCategory) {
    return <Card><div className="muted">This live event does not have ticket categories yet.</div></Card>;
  }

  if (salesStatus && !salesStatus.canBook) {
    return (
      <Card>
        <div className="eyebrow">Checkout</div>
        <h2 className="section-title">Ticketing is unavailable</h2>
        <p className="muted">
          {salesStatus.saleNotStarted && salesStatus.earliestSaleStart
            ? `Booking opens on ${salesStatus.earliestSaleStart}.`
            : salesStatus.soldOut
              ? "All ticket categories for this event are sold out."
              : "The booking window is closed for this event."}
        </p>
      </Card>
    );
  }

  const handlePurchase = async () => {
    if (!session?.user.userId) {
      setMessage("You need to be signed in to complete this booking.");
      return;
    }

    if (selectedCategory.availableQuantity === 0) {
      setMessage("This category is sold out.");
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 10) {
      setMessage("Please enter a ticket quantity between 1 and 10.");
      return;
    }

    if (parsedQuantity > selectedCategory.availableQuantity) {
      setMessage("Requested quantity exceeds the remaining tickets in this category.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await emtsApi.initiateCheckout({
        customerId: session.user.userId,
        eventId,
        ticketCategoryId: selectedCategory.ticketCategoryId,
        quantity: parsedQuantity,
        paymentMethod
      });
      router.push(`/customer/bookings/${result.bookingId}`);
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Booking failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="two-column">
      <Card>
        <div className="eyebrow">Checkout</div>
        <h2 className="section-title">Select category, quantity, and payment method</h2>
        <div className="grid" style={{ marginTop: 18 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Ticket category</span>
            <select className="select" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              {categories.map((category) => (
                <option key={category.ticketCategoryId} value={category.ticketCategoryId}>
                  {category.displayName} - {formatCurrency(category.unitPrice)}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Quantity</span>
            <input
              className="input"
              type="number"
              min={1}
              inputMode="numeric"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Payment method</span>
            <select className="select" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">Net Banking</option>
            </select>
          </label>
          <div className="pill">{availabilityTone}</div>
          {message && <div className="badge">{message}</div>}
          <Button type="button" onClick={handlePurchase} disabled={isSubmitting || selectedCategory.availableQuantity === 0}>
            {isSubmitting ? "Processing payment..." : "Pay and issue tickets"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="eyebrow">Order summary</div>
        <h3 style={{ marginBottom: 4 }}>{event.title}</h3>
        <div className="muted">{selectedCategory.displayName}</div>
        <div className="grid" style={{ marginTop: 18 }}>
          <div className="pill" style={{ justifyContent: "space-between" }}>
            <span>Seat availability</span>
            <strong>{selectedCategory.availableQuantity}</strong>
          </div>
          <div className="pill" style={{ justifyContent: "space-between" }}>
            <span>Total payable</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </div>
      </Card>
    </div>
  );
}
