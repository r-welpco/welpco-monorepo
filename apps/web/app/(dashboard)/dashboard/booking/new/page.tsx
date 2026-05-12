import NewBookingPageClient from "./page-client";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ welperId?: string; offeringId?: string }>;
}) {
  const params = await searchParams;
  return <NewBookingPageClient welperId={params.welperId} offeringId={params.offeringId} />;
}
