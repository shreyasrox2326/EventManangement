"use client";

import Link from "next/link";
import { BarChart3, CalendarPlus2, CircleDollarSign, Eye, ReceiptText } from "lucide-react";
import { useAuth } from "@/app/providers";
import { AttendanceDonutChart } from "@/components/charts/AttendanceDonutChart";
import { OccupancyBarChart } from "@/components/charts/OccupancyBarChart";
import { RevenueAreaChart } from "@/components/charts/RevenueAreaChart";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency } from "@/utils/format";
import { isInternalUseCategoryName } from "@/utils/ticketing";
import { useState } from "react";

export function OrganizerDashboard() {
  const { session } = useAuth();
  const organizerId = session?.user.userId ?? "u2";
  const [showApprovedRequests, setShowApprovedRequests] = useState(false);
  const [showRejectedRequests, setShowRejectedRequests] = useState(false);
  const { data: organizerEventsData, isLoading } = useAsyncResource(
    async () => (await emtsApi.getEvents()).filter((event) => event.organizerId === organizerId),
    [organizerId]
  );
  const { data: bookingsData } = useAsyncResource(() => emtsApi.getBookings(), [organizerId]);
  const { data: paymentsData } = useAsyncResource(() => emtsApi.getPayments(), [organizerId]);
  const { data: ticketsData } = useAsyncResource(() => emtsApi.getTickets(), [organizerId]);
  const { data: reportsData } = useAsyncResource(() => emtsApi.getReportsByOrganizer(organizerId), [organizerId]);
  const { data: corporateRequestsData } = useAsyncResource(() => emtsApi.getCorporateRequestsForOrganizer(organizerId), [organizerId]);
  const { data: corporateProfilesData } = useAsyncResource(() => emtsApi.getCorporateProfiles(), [organizerId]);
  const organizerEvents = organizerEventsData ?? [];
  const bookings = bookingsData ?? [];
  const payments = paymentsData ?? [];
  const tickets = ticketsData ?? [];
  const reports = reportsData ?? [];
  const corporateRequests = corporateRequestsData ?? [];
  const corporateProfiles = corporateProfilesData ?? [];
  const latestFiveEvents = [...organizerEvents]
    .sort((left, right) => new Date(right.startDateTime).getTime() - new Date(left.startDateTime).getTime())
    .slice(0, 5)
    .sort((left, right) => new Date(left.startDateTime).getTime() - new Date(right.startDateTime).getTime());
  const publishedEvents = latestFiveEvents.filter((event) => event.status.toUpperCase() === "PUBLISHED");
  const organizerBookings = bookings.filter((booking) => organizerEvents.some((event) => event.eventId === booking.eventId));
  const organizerPayments = payments.filter((payment) => organizerBookings.some((booking) => booking.bookingId === payment.bookingId));
  const organizerTickets = tickets.filter(
    (ticket) =>
      latestFiveEvents.some((event) => event.eventId === ticket.eventId) &&
      !isInternalUseCategoryName(ticket.seatLabel)
  );
  const grossRevenue = organizerPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);
  const refundedRevenue = organizerPayments.filter((payment) => payment.paymentStatus.startsWith("refunded")).reduce((sum, payment) => sum + payment.amountPaid, 0);
  const checkedInCount = organizerTickets.filter((ticket) => ticket.ticketStatus === "USED").length;
  const activeTickets = organizerTickets.filter((ticket) => ticket.ticketStatus === "ACTIVE").length;
  const averageOccupancy =
    publishedEvents.length > 0
      ? publishedEvents.reduce((sum, event) => {
          const publicCategories = event.ticketCategories.filter((category) => !isInternalUseCategoryName(category.displayName));
          const publicCapacity = publicCategories.reduce((categorySum, category) => categorySum + category.capacity, 0);
          const publicSold = organizerTickets.filter((ticket) => ticket.eventId === event.eventId && ticket.ticketStatus !== "CANCELLED").length;
          return sum + (publicCapacity > 0 ? (publicSold / publicCapacity) * 100 : 0);
        }, 0) / publishedEvents.length
      : 0;
  const publicCapacityAcrossDashboard = publishedEvents.reduce(
    (sum, event) =>
      sum + event.ticketCategories.filter((category) => !isInternalUseCategoryName(category.displayName)).reduce((categorySum, category) => categorySum + category.capacity, 0),
    0
  );
  const publicSoldAcrossDashboard = organizerTickets.filter((ticket) => ticket.ticketStatus !== "CANCELLED").length;
  const latestReport = reports[0]?.parsedData ?? null;
  const visibleCorporateRequests = corporateRequests.filter((request) => {
    if (request.status === "submitted") return true;
    if (request.status === "approved_pending_payment" || request.status === "paid") return showApprovedRequests;
    if (request.status === "rejected" || request.status === "cancelled" || request.status === "expired") return showRejectedRequests;
    return false;
  });

  if (isLoading && organizerEvents.length === 0) {
    return <Card><div className="muted">Loading organizer dashboard...</div></Card>;
  }

  return (
    <div className="grid">
      <SectionHeader
        eyebrow="Organizer Portal"
        title="Commercial and operational command center"
        description="Track live backend events, ticket categories, bookings, attendance, and generated report snapshots."
        action={
          <Link href="/organizer/events/create" className="button button-primary">
            <CalendarPlus2 size={16} />
            Create event
          </Link>
        }
      />

      <div className="metrics-grid">
        <StatCard label="Published Events" value={`${publishedEvents.length}`} caption="Live events from the backend" icon={<Eye size={20} />} />
        <StatCard label="Gross Revenue" value={formatCurrency(grossRevenue)} caption={`${organizerPayments.length} payments recorded`} icon={<CircleDollarSign size={20} />} />
        <StatCard label="Refunded Amount" value={formatCurrency(refundedRevenue)} caption="Derived from payment status" icon={<ReceiptText size={20} />} />
        <StatCard label="Checked In" value={`${checkedInCount}`} caption={`${activeTickets} tickets still unused`} icon={<BarChart3 size={20} />} />
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div className="eyebrow">Corporate Offers</div>
            <h3 style={{ margin: "6px 0" }}>Pending corporate requests</h3>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={showApprovedRequests} onChange={(event) => setShowApprovedRequests(event.target.checked)} />
              <span className="muted">Show approved</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={showRejectedRequests} onChange={(event) => setShowRejectedRequests(event.target.checked)} />
              <span className="muted">Show rejected</span>
            </label>
            <Link href="/organizer/events" className="button button-secondary">Open event management</Link>
          </div>
        </div>
        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Company</th>
              <th>Event</th>
              <th>Status</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {visibleCorporateRequests.map((request) => (
              <tr key={request.requestId}>
                <td>{corporateProfiles.find((profile) => profile.userId === request.corporateUserId)?.companyName ?? request.corporateUserId}</td>
                <td>{organizerEvents.find((event) => event.eventId === request.eventId)?.title ?? request.eventId}</td>
                <td>{request.status.replaceAll("_", " ")}</td>
                <td>{request.requestedTotalQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleCorporateRequests.length === 0 && <div className="muted" style={{ marginTop: 12 }}>No corporate requests matched the selected filters.</div>}
      </Card>

      <div className="grid" style={{ gridTemplateColumns: "1.35fr 1fr" }}>
        <Card>
          <div className="eyebrow">Revenue Trend</div>
          <h3 style={{ marginBottom: 6 }}>Revenue by event</h3>
          <RevenueAreaChart
            data={latestFiveEvents.map((event) => ({
              label: event.title.length > 12 ? `${event.title.slice(0, 12)}...` : event.title,
              fullLabel: event.title,
              value: organizerPayments
                .filter((payment) => organizerBookings.some((booking) => booking.bookingId === payment.bookingId && booking.eventId === event.eventId))
                .reduce((sum, payment) => sum + payment.amountPaid, 0)
            }))}
          />
        </Card>
        <Card>
          <div className="eyebrow">Attendance Mix</div>
          <h3 style={{ marginBottom: 6 }}>Capacity, sold, and attended</h3>
          <AttendanceDonutChart
            capacity={publicCapacityAcrossDashboard}
            sold={publicSoldAcrossDashboard}
            attended={checkedInCount}
            centerLabel="Attended / Capacity"
            centerValue={`${checkedInCount} / ${publicCapacityAcrossDashboard}`}
          />
        </Card>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card>
          <div className="eyebrow">Occupancy Tracking</div>
          <h3 style={{ marginBottom: 6 }}>Published event occupancy</h3>
          <OccupancyBarChart
            data={publishedEvents
              .map((event) => ({
                label: event.title.length > 12 ? `${event.title.slice(0, 12)}...` : event.title,
                fullLabel: event.title,
                value: (() => {
                  const publicCategories = event.ticketCategories.filter((category) => !isInternalUseCategoryName(category.displayName));
                  const publicCapacity = publicCategories.reduce((sum, category) => sum + category.capacity, 0);
                  const publicSold = organizerTickets.filter((ticket) => ticket.eventId === event.eventId && ticket.ticketStatus !== "CANCELLED").length;
                  return Number((publicCapacity > 0 ? (publicSold / publicCapacity) * 100 : 0).toFixed(1));
                })()
              }))}
          />
        </Card>
        <Card>
          <div className="eyebrow">Latest Report Snapshot</div>
          <h3 style={{ marginBottom: 16 }}>Most recent persisted organizer report</h3>
          <div className="grid">
            <div className="pill" style={{ justifyContent: "space-between" }}>
              <span>Reports stored</span>
              <strong>{reports.length}</strong>
            </div>
            <div className="pill" style={{ justifyContent: "space-between" }}>
              <span>Average occupancy</span>
              <strong>{latestReport ? `${Math.round(latestReport.summary.averageOccupancy)}%` : `${Math.round(averageOccupancy)}%`}</strong>
            </div>
            <div className="pill" style={{ justifyContent: "space-between" }}>
              <span>Total bookings</span>
              <strong>{latestReport?.summary.totalBookings ?? organizerBookings.length}</strong>
            </div>
            <div className="pill" style={{ justifyContent: "space-between" }}>
              <span>Total tickets sold</span>
              <strong>{latestReport?.summary.totalTickets ?? organizerTickets.length}</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
