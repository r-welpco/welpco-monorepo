import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  getPolicyMetadata,
  PolicyPageContent,
} from "@/components/features/marketing/legal/policy-page-content";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getPolicyMetadata("refund", locale as Locale);
}

export default async function LocalizedRefundPolicyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PolicyPageContent kind="refund" locale={locale as Locale} />;
}
