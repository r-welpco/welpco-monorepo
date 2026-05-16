import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  getPrivacyMetadata,
  PrivacyPageContent,
} from "@/components/features/marketing/legal/privacy-page-content";
import type { Locale } from "@/i18n/routing";

/**
 * /legal/privacy (en) and /fr/legal/privacy (fr) — locale from `[locale]` segment.
 */

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getPrivacyMetadata(locale as Locale);
}

export default async function LocalizedPrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyPageContent locale={locale as Locale} />;
}
