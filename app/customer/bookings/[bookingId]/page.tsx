import { BookingDetail } from "@/modules/customer/BookingDetail";

export default async function BookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  return <BookingDetail bookingId={bookingId} />;
}
