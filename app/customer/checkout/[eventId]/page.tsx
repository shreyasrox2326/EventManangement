import { CheckoutScreen } from "@/modules/customer/CheckoutScreen";

export default async function CheckoutPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <CheckoutScreen eventId={eventId} />;
}
