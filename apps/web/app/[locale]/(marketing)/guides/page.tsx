import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  getGuidesIndexMetadata,
  GuidesIndexPageContent,
} from "@/components/features/marketing/guides/guide-page-content";
import type { Locale } from "@/i18n/routing";

/**
 * /guides (en) and /fr/guides (fr) — guide index with two role cards.
 */

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getGuidesIndexMetadata(locale as Locale);
}

export default async function LocalizedGuidesIndexPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <GuidesIndexPageContent locale={locale as Locale} />;
}
