"use client";

import { useAuth } from "@/app/providers";
import { GroupedTicketsView } from "@/components/tickets/GroupedTicketsView";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";

export function StaffTicketsPage() {
  const { session } = useAuth();
  const staffUserId = session?.user.userId ?? "";
  const { data, isLoading, error } = useAsyncResource(async () => {
    const [bookings, events] = await Promise.all([
      emtsApi.getUserBookings(staffUserId),
      emtsApi.getEvents()
    ]);

    const tickets = (
      await Promise.all(
        bookings.map(async (booking) => ({
          booking,
          tickets: await emtsApi.getTicketsByBooking(booking.bookingId)
        }))
      )
    )
      .flatMap(({ tickets }) => tickets)
      .filter(
        (ticket) =>
          ticket.seatLabel.toLowerCase().startsWith("internal usage - staff") &&
          (ticket.ticketStatus === "ACTIVE" || ticket.ticketStatus === "USED")
      );

    return Object.values(
      tickets.reduce<Record<string, { eventId: string; eventName: string; eventDate?: string; tickets: typeof tickets }>>((accumulator, ticket) => {
        const event = events.find((entry) => entry.eventId === ticket.eventId);
        if (!event) {
          return accumulator;
        }

        if (!accumulator[ticket.eventId]) {
          accumulator[ticket.eventId] = {
            eventId: ticket.eventId,
            eventName: event.title,
            eventDate: event.startDateTime,
            tickets: []
          };
        }

        accumulator[ticket.eventId].tickets.push(ticket);
        return accumulator;
      }, {})
    );
  }, [staffUserId]);

  return (
    <>
      {error && <div className="badge">{error}</div>}
      {isLoading && !data && <div className="card"><div className="muted">Loading staff tickets...</div></div>}
      <GroupedTicketsView eyebrow="My Ticket" title="Staff access tickets" groups={data ?? []} />
    </>
  );
}
