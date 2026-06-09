import { requireRole } from "@/lib/auth/server-auth";
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
  await requireRole("customer");
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
