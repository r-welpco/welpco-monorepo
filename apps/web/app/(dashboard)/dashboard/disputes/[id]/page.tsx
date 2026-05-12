import DisputeDetailPageClient from "./page-client";

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DisputeDetailPageClient disputeId={id} />;
}
