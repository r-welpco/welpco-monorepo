import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FAQPage } from "@/components/features/marketing/pages/faq-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.faqPage");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: "/faq" },
    openGraph: {
      title: `${t("meta.title")} — Welpco`,
      description: t("meta.description"),
      url: "/faq",
      type: "website",
    },
  };
}

export default function MarketingFAQRoute() {
  return <FAQPage />;
}
