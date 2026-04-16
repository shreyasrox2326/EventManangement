"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { StaffEventAssignment } from "@/types/contracts";
import { getDateTimeMillis } from "@/utils/date-time";
import { formatCurrency, formatDateTime, formatPercentage } from "@/utils/format";
import { isInternalUseCategory } from "@/utils/ticketing";

const getOrganizerStatus = (event: { status: string; startDateTime: string; endDateTime: string }) => {
  const normalized = event.status.toLowerCase();
  if (normalized === "deleted") return "deleted";
  if (normalized === "cancelled") return "cancelled";

  const now = Date.now();
  const start = getDateTimeMillis(event.startDateTime);
  const end = getDateTimeMillis(event.endDateTime);

  if (now >= end) return "completed";
  if (now >= start) return "ongoing";
  return "published";
};

const toLocalDateTimeInput = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getDefaultOfferExpiry = () => toLocalDateTimeInput(new Date(Date.now() + 60 * 60 * 1000));

const getRequestStatusMeta = (status: string) => {
  switch (status) {
    case "paid":
      return { label: "Paid", color: "var(--success)" };
    case "approved_pending_payment":
      return { label: "Pending Payment", color: "var(--warning)" };
    case "submitted":
      return { label: "Pending", color: "var(--warning)" };
    case "cancelled":
    case "rejected":
    case "expired":
      return { label: status.charAt(0).toUpperCase() + status.slice(1), color: "var(--danger)" };
    default:
      return { label: status.replaceAll("_", " "), color: "var(--text-soft)" };
  }
};

export function EventManagementPage() {
  const { session } = useAuth();
  const organizerId = session?.user.userId ?? "u2";
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [requestExpiry, setRequestExpiry] = useState<Record<string, string>>({});
  const [requestNotes, setRequestNotes] = useState<Record<string, string>>({});
  const [requestPrices, setRequestPrices] = useState<Record<string, Record<string, string>>>({});
  const [requestQuantities, setRequestQuantities] = useState<Record<string, Record<string, string>>>({});
  const [isUpdatingRequestId, setIsUpdatingRequestId] = useState<string | null>(null);
  const [selectedStaffByEvent, setSelectedStaffByEvent] = useState<Record<string, string>>({});
  const [staffSearchByEvent, setStaffSearchByEvent] = useState<Record<string, string>>({});
  const [isAssigningStaffForEvent, setIsAssigningStaffForEvent] = useState<string | null>(null);
  const [internalTicketTypeByEvent, setInternalTicketTypeByEvent] = useState<Record<string, "Internal" | "VIP">>({});
  const [internalTicketQuantityByEvent, setInternalTicketQuantityByEvent] = useState<Record<string, string>>({});
  const [isIssuingInternalForEvent, setIsIssuingInternalForEvent] = useState<string | null>(null);
  const { data, isLoading, error } = useAsyncResource(
    async () => (await emtsApi.getEvents()).filter((event) => event.organizerId === organizerId),
    [organizerId, refreshKey]
  );
  const { data: refundPoliciesData } = useAsyncResource(() => emtsApi.getRefundPolicies(), [refreshKey]);
  const { data: corporateRequestsData } = useAsyncResource(() => emtsApi.getCorporateRequestsForOrganizer(organizerId), [organizerId, refreshKey]);
  const { data: corporateProfilesData } = useAsyncResource(() => emtsApi.getCorporateProfiles(), [refreshKey]);
  const { data: usersData } = useAsyncResource(() => emtsApi.getUsers(), [refreshKey]);
  const { data: bookingsData } = useAsyncResource(() => emtsApi.getBookings(), [refreshKey]);
  const { data: paymentsData } = useAsyncResource(() => emtsApi.getPayments(), [refreshKey]);
  const { data: staffAssignmentsData } = useAsyncResource(
    async () =>
      Object.fromEntries(
        await Promise.all(
          ((await emtsApi.getEvents()).filter((event) => event.organizerId === organizerId)).map(async (event) => [
            event.eventId,
            await emtsApi.getStaffAssignmentsByEvent(event.eventId)
          ])
        )
      ),
    [organizerId, refreshKey]
  );
  const events = data ?? [];
  const refundPolicies = refundPoliciesData ?? [];
  const corporateRequests = corporateRequestsData ?? [];
  const corporateProfiles = corporateProfilesData ?? [];
  const users = usersData ?? [];
  const bookings = bookingsData ?? [];
  const payments = paymentsData ?? [];
  const staffAssignmentsByEvent = staffAssignmentsData ?? {};
  const staffUsers = users.filter((user) => user.roleCode === "STAFF");

  const sortedEvents = useMemo(
    () => [...events].sort((left, right) => new Date(left.startDateTime).getTime() - new Date(right.startDateTime).getTime()),
    [events]
  );

  const handleDelete = async (eventId: string) => {
    setIsDeleting(eventId);
    setMessage("");

    try {
      await emtsApi.deleteEvent(eventId);
      setExpandedEventId((current) => (current === eventId ? null : current));
      setRefreshKey((value) => value + 1);
      setMessage("Event marked as deleted. Related tickets were cancelled and refunds were triggered where applicable.");
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Delete failed for this event.");
    } finally {
      setIsDeleting(null);
    }
  };

  const approveCorporateRequest = async (requestId: string, eventId: string) => {
    const request = corporateRequests.find((entry) => entry.requestId === requestId);
    if (!request) return;

    const resolvedExpiry = requestExpiry[requestId] ?? getDefaultOfferExpiry();
    const minutesUntilExpiry = (new Date(resolvedExpiry).getTime() - Date.now()) / 60000;
    if (!Number.isFinite(minutesUntilExpiry) || minutesUntilExpiry < 15) {
      setMessage("Offer deadline must be at least 15 minutes from now.");
      return;
    }

    setIsUpdatingRequestId(requestId);
    setMessage("");

    try {
      await emtsApi.approveCorporateRequest({
        requestId,
        organizerNote: requestNotes[requestId] ?? "",
        expiresAt: resolvedExpiry,
        items: request.items.map((item) => ({
          categoryId: item.categoryId,
          quantity: Number(requestQuantities[requestId]?.[item.categoryId] ?? item.requestedQty),
          offeredUnitPrice: Number(requestPrices[requestId]?.[item.categoryId] ?? item.offeredUnitPrice ?? 0)
        }))
      });
      setRefreshKey((current) => current + 1);
      setMessage(`Corporate request ${requestId} approved for event ${eventId}.`);
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to approve corporate request.");
    } finally {
      setIsUpdatingRequestId(null);
    }
  };

  const rejectCorporateRequest = async (requestId: string) => {
    setIsUpdatingRequestId(requestId);
    setMessage("");
    try {
      await emtsApi.rejectCorporateRequest(requestId, requestNotes[requestId] ?? "");
      setRefreshKey((current) => current + 1);
      setMessage(`Corporate request ${requestId} rejected.`);
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to reject corporate request.");
    } finally {
      setIsUpdatingRequestId(null);
    }
  };

  const assignStaff = async (eventId: string) => {
    const staffUserId = selectedStaffByEvent[eventId];
    if (!staffUserId) {
      setMessage("Select a staff user first.");
      return;
    }

    setIsAssigningStaffForEvent(eventId);
    setMessage("");
    try {
      await emtsApi.assignStaffToEvent({
        staffUserId,
        eventId,
        assignedByUserId: organizerId
      });
      setSelectedStaffByEvent((current) => ({ ...current, [eventId]: "" }));
      setRefreshKey((current) => current + 1);
      setMessage("Staff assigned to event.");
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to assign staff.");
    } finally {
      setIsAssigningStaffForEvent(null);
    }
  };

  const issueInternalTickets = async (eventId: string) => {
    const quantity = Number(internalTicketQuantityByEvent[eventId] ?? "1");
    const type = internalTicketTypeByEvent[eventId] ?? "Internal";

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage("Internal usage quantity must be at least 1.");
      return;
    }

    setIsIssuingInternalForEvent(eventId);
    setMessage("");
    try {
      await emtsApi.issueInternalTickets({
        eventId,
        userId: organizerId,
        type,
        quantity,
        createdByUserId: organizerId
      });
      setInternalTicketQuantityByEvent((current) => ({ ...current, [eventId]: "1" }));
      setRefreshKey((current) => current + 1);
      setMessage(`${type} ticket${quantity > 1 ? "s" : ""} issued successfully.`);
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to issue internal usage tickets.");
    } finally {
      setIsIssuingInternalForEvent(null);
    }
  };

  return (
    <div className="grid">
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="eyebrow">Event Management</div>
            <h2 className="section-title">Events and ticket categories</h2>
          </div>
          <Link href="/organizer/events/create" className="button button-primary">
            Create event
          </Link>
        </div>
        {error && <div className="badge" style={{ marginTop: 16 }}>{error}</div>}
        {message && <div className="badge" style={{ marginTop: 16 }}>{message}</div>}
      </Card>

      {isLoading && sortedEvents.length === 0 && <Card><div className="muted">Loading organizer events...</div></Card>}

      {!isLoading && sortedEvents.length === 0 && (
        <Card>
          <div className="muted">No events have been created for this organizer yet.</div>
        </Card>
      )}

      {sortedEvents.map((event) => {
        const isExpanded = expandedEventId === event.eventId;
        const eventBookings = bookings.filter((booking) => booking.eventId === event.eventId);
        const computedRevenue = payments
          .filter((payment) => eventBookings.some((booking) => booking.bookingId === payment.bookingId))
          .reduce((sum, payment) => sum + payment.amountPaid, 0);
        const refundPolicy = refundPolicies.find((policy) => policy.eventId === event.eventId) ?? null;
        const organizerStatus = getOrganizerStatus(event);
        const eventCorporateRequests = corporateRequests.filter((request) => request.eventId === event.eventId);
        const eventStaffAssignments: StaffEventAssignment[] = staffAssignmentsByEvent[event.eventId] ?? [];
        const internalCategories = event.ticketCategories.filter((category) => isInternalUseCategory(category));
        const actionLocked = organizerStatus === "completed" || organizerStatus === "cancelled" || organizerStatus === "deleted";
        const filteredStaffUsers = staffUsers.filter((user) => {
          if (eventStaffAssignments.some((assignment) => assignment.staffUserId === user.userId)) {
            return false;
          }
          const query = (staffSearchByEvent[event.eventId] ?? "").trim().toLowerCase();
          if (!query) return true;
          return [user.fullName, user.emailAddress, user.userId].some((value) => value.toLowerCase().includes(query));
        });

        return (
          <Card key={event.eventId}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <div className="eyebrow">{organizerStatus}</div>
                <h3 style={{ margin: "6px 0" }}>{event.title}</h3>
                <div className="muted">{formatDateTime(event.startDateTime)} - {event.venueName}</div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div className="badge">
                  Occupancy {formatPercentage(event.occupancyPercentage)}
                </div>
                <div className="badge">
                  Revenue {formatCurrency(computedRevenue)}
                </div>
                <Button type="button" variant="secondary" onClick={() => setExpandedEventId(isExpanded ? null : event.eventId)}>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {isExpanded ? "Hide details" : "View details"}
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div className="grid" style={{ marginTop: 20 }}>
                <div className="two-column">
                  <div className="card" style={{ padding: 18 }}>
                    <div className="eyebrow">Event Summary</div>
                    <div className="details-list" style={{ marginTop: 12 }}>
                      <div className="details-row">
                        <div className="details-key">Type</div>
                        <div className="details-value">{event.eventType}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-key">Capacity</div>
                        <div className="details-value">{event.seatCapacity}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-key">Venue</div>
                        <div className="details-value">{event.venueName}</div>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 18 }}>
                    <div className="eyebrow">Actions</div>
                    <div className="grid" style={{ marginTop: 12 }}>
                      <Link href={`/organizer/reports?eventId=${event.eventId}`} className="button button-secondary">
                        Open reports
                      </Link>
                      {!actionLocked ? (
                        <Button type="button" onClick={() => handleDelete(event.eventId)} disabled={isDeleting === event.eventId}>
                          {isDeleting === event.eventId ? "Deleting..." : "Delete event"}
                        </Button>
                      ) : (
                        <div className="muted">This event is closed, so new destructive actions are disabled.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 18 }}>
                  <div className="eyebrow">Refund Policy</div>
                  <div className="details-list" style={{ marginTop: 12 }}>
                    <div className="details-row">
                      <div className="details-key">Full refund window</div>
                      <div className="details-value">{refundPolicy ? `${refundPolicy.fullRefundWindowHours} hours` : "Missing"}</div>
                    </div>
                    <div className="details-row">
                      <div className="details-key">Partial refund window</div>
                      <div className="details-value">{refundPolicy ? `${refundPolicy.partialRefundWindowHours} hours` : "Missing"}</div>
                    </div>
                    <div className="details-row">
                      <div className="details-key">Partial refund percentage</div>
                      <div className="details-value">{refundPolicy ? `${refundPolicy.partialRefundPercentage}%` : "Missing"}</div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 18 }}>
                  <div className="eyebrow">Ticket Categories</div>
                  {event.ticketCategories.length === 0 ? (
                    <div className="muted" style={{ marginTop: 12 }}>No ticket categories are attached to this event.</div>
                  ) : (
                    <table className="table" style={{ marginTop: 12 }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Price</th>
                          <th>Total Qty</th>
                          <th>Available Qty</th>
                          <th>Sale Start</th>
                        </tr>
                      </thead>
                      <tbody>
                        {event.ticketCategories.map((category) => (
                          <tr key={category.ticketCategoryId}>
                            <td>{category.displayName}</td>
                            <td>{formatCurrency(category.unitPrice)}</td>
                            <td>{category.capacity}</td>
                            <td>{category.availableQuantity}</td>
                            <td>{category.saleStartDate ? formatDateTime(category.saleStartDate) : "Immediate"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="card" style={{ padding: 18 }}>
                  <div className="eyebrow">Internal Usage</div>
                  <div className="grid" style={{ gap: 12, marginTop: 12 }}>
                    {!actionLocked ? (
                      <>
                        <div className="muted">Issue zero-revenue internal usage tickets for your own organizer access on this event.</div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <select
                            className="select"
                            value={internalTicketTypeByEvent[event.eventId] ?? "Internal"}
                            onChange={(nextEvent) =>
                              setInternalTicketTypeByEvent((current) => ({
                                ...current,
                                [event.eventId]: nextEvent.target.value as "Internal" | "VIP"
                              }))
                            }
                          >
                            <option value="Internal">Internal</option>
                            <option value="VIP">VIP</option>
                          </select>
                          <input
                            className="input"
                            style={{ width: 120 }}
                            type="number"
                            min={1}
                            value={internalTicketQuantityByEvent[event.eventId] ?? "1"}
                            onChange={(nextEvent) =>
                              setInternalTicketQuantityByEvent((current) => ({
                                ...current,
                                [event.eventId]: nextEvent.target.value
                              }))
                            }
                          />
                          <Button type="button" onClick={() => issueInternalTickets(event.eventId)} disabled={isIssuingInternalForEvent === event.eventId}>
                            {isIssuingInternalForEvent === event.eventId ? "Issuing..." : "Issue internal tickets"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="muted">New internal usage tickets cannot be issued after the event is closed.</div>
                    )}
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Total</th>
                          <th>Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        {internalCategories.map((category) => (
                          <tr key={category.ticketCategoryId}>
                            <td>{category.displayName}</td>
                            <td>{category.capacity}</td>
                            <td>{category.availableQuantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {internalCategories.length === 0 && <div className="muted">No internal usage categories have been issued yet.</div>}
                  </div>
                </div>

                <div className="card" style={{ padding: 18 }}>
                  <div className="eyebrow">Staff Assignment</div>
                  <div className="grid" style={{ gap: 12, marginTop: 12 }}>
                    {!actionLocked ? (
                      <>
                        <input
                          className="input"
                          placeholder="Search staff by name, email, or ID"
                          value={staffSearchByEvent[event.eventId] ?? ""}
                          onChange={(nextEvent) =>
                            setStaffSearchByEvent((current) => ({
                              ...current,
                              [event.eventId]: nextEvent.target.value
                            }))
                          }
                        />
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <select
                            className="select"
                            value={selectedStaffByEvent[event.eventId] ?? ""}
                            onChange={(nextEvent) =>
                              setSelectedStaffByEvent((current) => ({
                                ...current,
                                [event.eventId]: nextEvent.target.value
                              }))
                            }
                            style={{ minWidth: 280 }}
                          >
                            <option value="">Select staff user</option>
                            {filteredStaffUsers.map((user) => (
                              <option key={user.userId} value={user.userId}>
                                {[user.fullName, user.emailAddress].join(" · ")}
                              </option>
                            ))}
                          </select>
                          <Button type="button" onClick={() => assignStaff(event.eventId)} disabled={isAssigningStaffForEvent === event.eventId || !selectedStaffByEvent[event.eventId]}>
                            {isAssigningStaffForEvent === event.eventId ? "Assigning..." : "Assign staff"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="muted">New staff assignments are disabled after the event is closed.</div>
                    )}
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Assigned At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventStaffAssignments.map((assignment) => {
                          const staffUser = staffUsers.find((user) => user.userId === assignment.staffUserId);
                          return (
                            <tr key={assignment.assignmentId}>
                              <td>{staffUser?.fullName ?? assignment.staffUserId}</td>
                              <td>{staffUser?.emailAddress ?? "-"}</td>
                              <td>{formatDateTime(assignment.assignedAt)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {eventStaffAssignments.length === 0 && <div className="muted">No staff assigned yet.</div>}
                  </div>
                </div>

                <div className="card" style={{ padding: 18 }}>
                  <div className="eyebrow">Corporate Requests</div>
                  {eventCorporateRequests.length === 0 ? (
                    <div className="muted" style={{ marginTop: 12 }}>No corporate requests for this event yet.</div>
                  ) : (
                    <div className="grid" style={{ gap: 16, marginTop: 12 }}>
                      {eventCorporateRequests.map((request) => {
                        const statusMeta = getRequestStatusMeta(request.status);
                        const resolvedExpiry = requestExpiry[request.requestId] ?? getDefaultOfferExpiry();
                        return (
                          <div key={request.requestId} className="card" style={{ padding: 16, borderRadius: 18 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                              <div>
                                <strong>{corporateProfiles.find((profile) => profile.userId === request.corporateUserId)?.companyName ?? request.requestId}</strong>
                                <div className="muted" style={{ marginTop: 6 }}>{request.requestId}</div>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: statusMeta.color, display: "inline-block" }} />
                                  <span>{statusMeta.label}</span>
                                </div>
                              </div>
                              <div className="badge">{request.requestedTotalQty} tickets</div>
                            </div>
                            {request.corporateNote && <div className="muted" style={{ marginTop: 12 }}>{request.corporateNote}</div>}
                            <table className="table" style={{ marginTop: 12 }}>
                              <thead>
                                <tr>
                                  <th>Category</th>
                                  <th>Requested</th>
                                  <th>Approved</th>
                                  <th>Booked</th>
                                  <th>Offer</th>
                                </tr>
                              </thead>
                              <tbody>
                                {request.items.map((item) => {
                                  const category = event.ticketCategories.find((entry) => entry.ticketCategoryId === item.categoryId);
                                  return (
                                    <tr key={item.requestItemId}>
                                      <td>{category?.displayName ?? item.categoryId}</td>
                                      <td>{item.requestedQty}</td>
                                      <td>
                                        {request.status === "submitted" ? (
                                          <input
                                            className="input"
                                            style={{ maxWidth: 120 }}
                                            type="number"
                                            min={1}
                                            max={item.requestedQty}
                                            value={requestQuantities[request.requestId]?.[item.categoryId] ?? `${item.requestedQty}`}
                                            onChange={(nextEvent) =>
                                              setRequestQuantities((current) => ({
                                                ...current,
                                                [request.requestId]: {
                                                  ...(current[request.requestId] ?? {}),
                                                  [item.categoryId]: nextEvent.target.value
                                                }
                                              }))
                                            }
                                          />
                                        ) : (
                                          item.approvedQty ?? "-"
                                        )}
                                      </td>
                                      <td>{request.status === "paid" ? (item.approvedQty ?? 0) : 0}</td>
                                      <td>
                                        {request.status === "submitted" ? (
                                          <input
                                            className="input"
                                            style={{ maxWidth: 140 }}
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={requestPrices[request.requestId]?.[item.categoryId] ?? `${category?.unitPrice ?? 0}`}
                                            onChange={(nextEvent) =>
                                              setRequestPrices((current) => ({
                                                ...current,
                                                [request.requestId]: {
                                                  ...(current[request.requestId] ?? {}),
                                                  [item.categoryId]: nextEvent.target.value
                                                }
                                              }))
                                            }
                                          />
                                        ) : (
                                          item.offeredUnitPrice !== undefined ? formatCurrency(item.offeredUnitPrice) : "Pending"
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>

                            {request.status === "submitted" && (
                              <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 12, marginTop: 16 }}>
                                <label style={{ display: "grid", gap: 8 }}>
                                  <span className="eyebrow">Offer expiry</span>
                                  <input
                                    className="input"
                                    type="datetime-local"
                                    value={resolvedExpiry}
                                    onChange={(nextEvent) =>
                                      setRequestExpiry((current) => ({
                                        ...current,
                                        [request.requestId]: nextEvent.target.value
                                      }))
                                    }
                                  />
                                </label>
                                <label style={{ display: "grid", gap: 8 }}>
                                  <span className="eyebrow">Organizer note</span>
                                  <input
                                    className="input"
                                    value={requestNotes[request.requestId] ?? ""}
                                    onChange={(nextEvent) =>
                                      setRequestNotes((current) => ({
                                        ...current,
                                        [request.requestId]: nextEvent.target.value
                                      }))
                                    }
                                  />
                                </label>
                              </div>
                            )}

                            {request.status === "submitted" && (
                              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
                                <Button type="button" disabled={isUpdatingRequestId === request.requestId} onClick={() => approveCorporateRequest(request.requestId, event.eventId)}>
                                  {isUpdatingRequestId === request.requestId ? "Updating..." : "Approve and send offer"}
                                </Button>
                                <Button type="button" variant="secondary" disabled={isUpdatingRequestId === request.requestId} onClick={() => rejectCorporateRequest(request.requestId)}>
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
