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
  const [challengeId, setChallengeId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pendingBookingId, setPendingBookingId] = useState("");
  const [pendingPaymentId, setPendingPaymentId] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState("");
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
  const isOtpStep = Boolean(challengeId);

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

  const handleSendOtp = async () => {
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
      const challenge = await emtsApi.initiateCheckout({
        customerId: session.user.userId,
        eventId,
        ticketCategoryId: selectedCategory.ticketCategoryId,
        quantity: parsedQuantity,
        paymentMethod
      });
      setChallengeId(challenge.challengeId);
      setPendingBookingId(challenge.bookingId ?? "");
      setPendingPaymentId(challenge.paymentId ?? "");
      setOtpExpiresAt(challenge.expiresAt);
      setMessage("Payment OTP sent to your email.");
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Booking failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!challengeId || !pendingBookingId || !pendingPaymentId) {
      setMessage("Start payment again to receive a valid OTP.");
      return;
    }
    if (!otpCode.trim()) {
      setMessage("Enter the OTP sent to your email.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await emtsApi.confirmCheckout({
        bookingId: pendingBookingId,
        paymentId: pendingPaymentId,
        challengeId,
        otpCode: otpCode.trim()
      });
      router.push(`/customer/bookings/${result.bookingId}`);
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to confirm payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToSelection = () => {
    setChallengeId("");
    setOtpCode("");
    setPendingBookingId("");
    setPendingPaymentId("");
    setOtpExpiresAt("");
    setMessage("");
  };

  return (
    <div className="two-column">
      <Card>
        <div className="eyebrow">Checkout</div>
        <h2 className="section-title">{isOtpStep ? "Confirm payment OTP" : "Select category, quantity, and payment method"}</h2>
        {!isOtpStep ? (
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
            <Button type="button" onClick={handleSendOtp} disabled={isSubmitting || selectedCategory.availableQuantity === 0}>
              {isSubmitting ? "Sending OTP..." : "Send payment OTP"}
            </Button>
          </div>
        ) : (
          <div className="grid" style={{ marginTop: 18 }}>
            <div className="details-list">
              <div className="details-row">
                <div className="details-key">Email verification</div>
                <div className="details-value">OTP sent to your registered email</div>
              </div>
              <div className="details-row">
                <div className="details-key">Expires</div>
                <div className="details-value">{otpExpiresAt || "-"}</div>
              </div>
            </div>
            <label style={{ display: "grid", gap: 8 }}>
              <span className="eyebrow">OTP</span>
              <input
                className="input mono"
                inputMode="numeric"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="Enter 6-digit OTP"
              />
            </label>
            {message && <div className="badge">{message}</div>}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button type="button" onClick={handleConfirmPurchase} disabled={isSubmitting}>
                {isSubmitting ? "Confirming..." : "Confirm payment"}
              </Button>
              <Button type="button" variant="secondary" onClick={handleBackToSelection} disabled={isSubmitting}>
                Back
              </Button>
            </div>
          </div>
        )}
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
