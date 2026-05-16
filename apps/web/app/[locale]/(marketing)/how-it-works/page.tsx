import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HowItWorksPage } from "@/components/features/marketing/pages/how-it-works-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.howItWorksPage");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: "/how-it-works" },
    openGraph: {
      title: `${t("meta.title")} — Welpco`,
      description: t("meta.description"),
      url: "/how-it-works",
      type: "website",
    },
  };
}

export default function MarketingHowItWorksRoute() {
  return <HowItWorksPage />;
}
