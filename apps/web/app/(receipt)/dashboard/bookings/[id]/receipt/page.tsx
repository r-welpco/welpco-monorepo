import type { Metadata } from "next";
import PaymentReceiptClient from "./payment-receipt-client";

type ReceiptPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string | string[] }>;
};

function shortReference(bookingId: string): string {
  return bookingId.slice(-8).toUpperCase();
}

export async function generateMetadata({ params }: ReceiptPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `welpco-receipt-${shortReference(id)}`,
    robots: { index: false, follow: false },
  };
}

export default async function PaymentReceiptPage({ params, searchParams }: ReceiptPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <PaymentReceiptClient bookingId={id} shouldPrint={query.print === "1"} />;
}
