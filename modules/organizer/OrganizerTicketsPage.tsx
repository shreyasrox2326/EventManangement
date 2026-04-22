"use client";

import { useAuth } from "@/app/providers";
import { GroupedTicketsView } from "@/components/tickets/GroupedTicketsView";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";

export function OrganizerTicketsPage() {
  const { session } = useAuth();
  const organizerUserId = session?.user.userId ?? "";
  const { data, isLoading, error } = useAsyncResource(async () => {
    const [ticketsForUser, events] = await Promise.all([
      emtsApi.getTicketsByUser(organizerUserId),
      emtsApi.getEvents()
    ]);

    const tickets = ticketsForUser
      .filter(
        (ticket) =>
          ticket.seatLabel.toLowerCase().startsWith("internal usage -") &&
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
  }, [organizerUserId]);

  return (
    <>
      {error && <div className="badge">{error}</div>}
      {isLoading && !data && <div className="card"><div className="muted">Loading internal usage tickets...</div></div>}
      <GroupedTicketsView eyebrow="Internal Tickets" title="Your organizer access tickets" groups={data ?? []} />
    </>
  );
}
