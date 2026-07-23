import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  getWelperGuideMetadata,
  WelperGuidePageContent,
} from "@/components/features/marketing/guides/guide-page-content";
import type { Locale } from "@/i18n/routing";

/**
 * /guides/welper (en) and /fr/guides/welper (fr) — welper guide.
 */

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getWelperGuideMetadata(locale as Locale);
}

export default async function LocalizedWelperGuidePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WelperGuidePageContent locale={locale as Locale} />;
}
