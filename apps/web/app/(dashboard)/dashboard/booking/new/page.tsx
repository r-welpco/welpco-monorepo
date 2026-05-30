import NewBookingPageClient from "./page-client";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{
    welperId?: string;
    offeringId?: string;
    jobId?: string;
    applicationId?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <NewBookingPageClient
      welperId={params.welperId}
      offeringId={params.offeringId}
      jobId={params.jobId}
      applicationId={params.applicationId}
    />
  );
}
