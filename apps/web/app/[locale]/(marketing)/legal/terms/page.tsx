import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  getTermsMetadata,
  TermsPageContent,
} from "@/components/features/marketing/legal/terms-page-content";
import type { Locale } from "@/i18n/routing";

/**
 * /legal/terms (en) and /fr/legal/terms (fr) — locale from `[locale]` segment.
 */

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getTermsMetadata(locale as Locale);
}

export default async function LocalizedTermsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TermsPageContent locale={locale as Locale} />;
}
