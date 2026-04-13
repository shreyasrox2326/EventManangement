import { TicketDetail } from "@/modules/customer/TicketDetail";

export default async function CustomerTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return <TicketDetail ticketId={ticketId} />;
}
