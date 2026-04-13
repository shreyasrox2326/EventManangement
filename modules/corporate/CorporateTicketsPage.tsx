"use client";

import { useAuth } from "@/app/providers";
import { GroupedTicketsView } from "@/components/tickets/GroupedTicketsView";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";

export function CorporateTicketsPage() {
  const { session } = useAuth();
  const corporateUserId = session?.user.userId ?? "";
  const { data, isLoading, error } = useAsyncResource(async () => {
    const [requests, events] = await Promise.all([
      emtsApi.getCorporateRequestsForCorporate(corporateUserId),
      emtsApi.getEvents()
    ]);
    const now = Date.now();

    const paidRequests = requests.filter((request) => request.bookingId);
    const tickets = (
      await Promise.all(
        paidRequests.map(async (request) => ({
          request,
          tickets: await emtsApi.getTicketsByBooking(request.bookingId!)
        }))
      )
    ).flatMap(({ tickets }) => tickets.filter((ticket) => ticket.ticketStatus === "ACTIVE" || ticket.ticketStatus === "USED"));

    return Object.values(
      tickets.reduce<Record<string, { eventId: string; eventName: string; eventDate?: string; tickets: typeof tickets }>>((accumulator, ticket) => {
        const event = events.find((entry) => entry.eventId === ticket.eventId);
        if (!event || new Date(event.endDateTime).getTime() <= now) {
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
  }, [corporateUserId]);

  return (
    <>
      {error && <div className="badge">{error}</div>}
      {isLoading && !data && <div className="card"><div className="muted">Loading live tickets...</div></div>}
      <GroupedTicketsView eyebrow="Live Tickets" title="Issued corporate tickets" groups={data ?? []} />
    </>
  );
}
