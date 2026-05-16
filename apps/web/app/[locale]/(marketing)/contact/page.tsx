import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactPage } from "@/components/features/marketing/pages/contact-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.contactPage");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: { canonical: "/contact" },
    openGraph: {
      title: `${t("meta.title")} — Welpco`,
      description: t("meta.description"),
      url: "/contact",
      type: "website",
    },
  };
}

export default function MarketingContactRoute() {
  return <ContactPage />;
}
