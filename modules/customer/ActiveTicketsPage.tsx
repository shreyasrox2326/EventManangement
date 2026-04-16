"use client";

import { useAuth } from "@/app/providers";
import { GroupedTicketsView } from "@/components/tickets/GroupedTicketsView";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { isEventStillLive } from "@/utils/ticketing";

export function ActiveTicketsPage() {
  const { session } = useAuth();
  const customerId = session?.user.userId ?? "";
  const { data, isLoading, error } = useAsyncResource(async () => {
    const bookings = await emtsApi.getUserBookings(customerId);
    const tickets = (await Promise.all(bookings.map((booking) => emtsApi.getTicketsByBooking(booking.bookingId)))).flat();
    const events = await emtsApi.getEvents();
    const visibleTickets = tickets.filter((ticket) => ticket.ticketStatus === "ACTIVE" || ticket.ticketStatus === "USED");

    return Object.values(
      visibleTickets.reduce<Record<string, { eventId: string; eventName: string; eventDate?: string; tickets: typeof visibleTickets }>>((accumulator, ticket) => {
        const event = events.find((entry) => entry.eventId === ticket.eventId);
        if (!event || !isEventStillLive(event)) {
          return accumulator;
        }
        if (!accumulator[ticket.eventId]) {
          accumulator[ticket.eventId] = {
            eventId: ticket.eventId,
            eventName: event?.title ?? ticket.eventId,
            eventDate: event?.startDateTime,
            tickets: []
          };
        }
        accumulator[ticket.eventId].tickets.push(ticket);
        return accumulator;
      }, {})
    );
  }, [customerId]);

  return (
    <>
      {error && <div className="badge">{error}</div>}
      {isLoading && !data && <div className="card"><div className="muted">Loading live tickets...</div></div>}
      <GroupedTicketsView eyebrow="Live Tickets" title="Tickets for events that have not ended" groups={data ?? []} />
    </>
  );
}
