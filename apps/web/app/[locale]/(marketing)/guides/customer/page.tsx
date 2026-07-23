import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  CustomerGuidePageContent,
  getCustomerGuideMetadata,
} from "@/components/features/marketing/guides/guide-page-content";
import type { Locale } from "@/i18n/routing";

/**
 * /guides/customer (en) and /fr/guides/customer (fr) — customer guide.
 */

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getCustomerGuideMetadata(locale as Locale);
}

export default async function LocalizedCustomerGuidePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CustomerGuidePageContent locale={locale as Locale} />;
}
