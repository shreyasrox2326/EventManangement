import { EventDetails } from "@/modules/customer/EventDetails";

export default async function CustomerEventDetailsPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <EventDetails eventId={eventId} />;
}
