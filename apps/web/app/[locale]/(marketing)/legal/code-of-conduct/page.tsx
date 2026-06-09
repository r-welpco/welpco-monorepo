import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  CodeOfConductPageContent,
  getCodeOfConductMetadata,
} from "@/components/features/marketing/legal/code-of-conduct-page-content";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getCodeOfConductMetadata(locale as Locale);
}

export default async function LocalizedCodeOfConductPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CodeOfConductPageContent locale={locale as Locale} />;
}
