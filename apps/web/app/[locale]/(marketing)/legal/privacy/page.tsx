import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PrivacyPageContent } from "@/components/features/marketing/legal/privacy-page-content";

/**
 * /fr/legal/privacy — Politique de confidentialité Welpco (French).
 * English canonical URL: /legal/privacy
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.legal.privacy.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function LocalizedPrivacyPage() {
  return <PrivacyPageContent />;
}
