"use client";

import Link from "next/link";
import { Bell, QrCode, Search } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/app/providers";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency, formatDate } from "@/utils/format";

export function CustomerDashboard() {
  const { session } = useAuth();
  const customerId = session?.user.userId ?? "u1";
  const { data: publishedEventsData, isLoading: isLoadingEvents } = useAsyncResource(() => emtsApi.getPublishedEvents(), []);
  const { data: customerBookingsData } = useAsyncResource(() => emtsApi.getUserBookings(customerId), [customerId]);
  const { data: customerNotificationsData } = useAsyncResource(() => emtsApi.getNotificationsForUser(customerId), [customerId]);
  const { data: customerTicketsData } = useAsyncResource(async () => {
    const bookings = await emtsApi.getUserBookings(customerId);
    const ticketLists = await Promise.all(bookings.map((booking) => emtsApi.getTicketsByBooking(booking.bookingId)));
    return ticketLists.flat();
  }, [customerId]);
  const publishedEvents = publishedEventsData ?? [];
  const customerBookings = customerBookingsData ?? [];
  const customerNotifications = customerNotificationsData ?? [];
  const customerTickets = customerTicketsData ?? [];
  const unreadCount = useMemo(
    () => customerNotifications.length,
    [customerNotifications]
  );
  const activeTickets = customerTickets.filter((ticket) => ticket.ticketStatus === "ACTIVE").length;

  if (isLoadingEvents && publishedEvents.length === 0) {
    return <Card><div className="muted">Loading your live dashboard...</div></Card>;
  }

  if (publishedEvents.length === 0) {
    return <Card><div className="muted">No live published events are available yet.</div></Card>;
  }

  return (
    <div className="grid">
      <SectionHeader
        eyebrow="Customer Portal"
        title="Your event workspace"
        description="Browse current events, complete a new booking, and monitor ticket confirmations, refunds, and platform notifications."
        action={
          <Link href="/customer/events" className="button button-primary">
            <Search size={16} />
            Explore events
          </Link>
        }
      />

      <div className="metrics-grid">
        <Link href="/customer/tickets" style={{ color: "inherit" }}>
          <StatCard label="Active Tickets" value={`${activeTickets}`} caption="Open your current active tickets" icon={<QrCode size={22} />} />
        </Link>
        <StatCard label="Event Notices" value={`${unreadCount}`} caption="Notifications attached to your booked events" icon={<Bell size={22} />} />
        <StatCard label="Bookings" value={`${customerBookings.length}`} caption="Bookings recorded for this account" icon={<QrCode size={22} />} />
        <StatCard label="Published Events" value={`${publishedEvents.length}`} caption="Upcoming live events visible right now" icon={<Search size={22} />} />
      </div>

      <div className="two-column">
        <Card>
          <div className="eyebrow">Recent booking</div>
          <h3 style={{ marginBottom: 4 }}>{customerBookings[0] ? `Booking ${customerBookings[0].bookingId}` : "No bookings yet"}</h3>
          <div className="muted">{customerBookings[0] ? `${customerBookings[0].quantity} ticket(s) ${customerBookings[0].bookingStatus}` : "Create your first booking from the events list."}</div>
          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <div className="pill" style={{ justifyContent: "space-between" }}>
              <span>Total paid</span>
              <strong>{formatCurrency(customerBookings[0]?.totalAmount ?? 0)}</strong>
            </div>
            <Link href="/customer/history" className="button button-secondary" style={{ width: "100%" }}>
              Open purchase history
            </Link>
          </div>
        </Card>

        <Card>
          <div className="eyebrow">Current notifications</div>
          <h3 style={{ marginBottom: 4 }}>Keep up with event changes</h3>
          <div className="muted">Read direct payment updates, refund notices, and event-wide announcements.</div>
          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <div className="pill" style={{ justifyContent: "space-between" }}>
              <span>Unread notifications</span>
              <strong>{unreadCount}</strong>
            </div>
            <Link href="/customer/notifications" className="button button-secondary" style={{ width: "100%" }}>
              Open notifications
            </Link>
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="eyebrow">Published events</div>
            <h3 style={{ margin: "8px 0 0" }}>Curated upcoming experiences</h3>
          </div>
          <Link href="/customer/notifications" className="button button-secondary">
            Notifications center
          </Link>
        </div>
        <div className="event-grid" style={{ marginTop: 18 }}>
          {publishedEvents.map((event) => (
            <Link key={event.eventId} href={`/customer/events/${event.eventId}`} className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
              <div
                style={{
                  height: 170,
                  borderRadius: 18,
                  background: `linear-gradient(145deg, color-mix(in srgb, var(--accent) 18%, transparent), rgba(0,0,0,0.18)), url(${event.bannerImageUrl}) center/cover`
                }}
              />
              <div>
                <h3 style={{ margin: "0 0 6px" }}>{event.title}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {event.cityName} · {formatDate(event.startDateTime)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
