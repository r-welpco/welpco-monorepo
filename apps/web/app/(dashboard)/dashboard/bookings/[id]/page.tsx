import BookingDetailClient from "./page-client";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookingDetailClient bookingId={id} />;
}
