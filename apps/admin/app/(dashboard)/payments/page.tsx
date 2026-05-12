import { PaymentsBrowse } from "./payments-browse";
import { PaymentsExportClient } from "./payments-export-client";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    welperId?: string;
    customerId?: string;
    status?: string;
    capturedDateFrom?: string;
    capturedDateTo?: string;
  }>;
}) {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Payments</h1>
      <PaymentsBrowse searchParams={searchParams} />
      <PaymentsExportClient />
    </div>
  );
}
