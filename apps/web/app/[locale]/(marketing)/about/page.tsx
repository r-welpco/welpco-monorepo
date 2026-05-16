import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AboutPage } from "@/components/features/marketing/pages/about-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.about");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: "/about" },
    openGraph: {
      title: `${t("meta.title")} — Welpco`,
      description: t("meta.description"),
      url: "/about",
      type: "website",
    },
  };
}

export default function MarketingAboutRoute() {
  return <AboutPage />;
}
