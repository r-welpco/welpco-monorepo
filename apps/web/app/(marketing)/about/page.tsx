import type { Metadata } from "next";
import { AboutPage } from "@/components/features/marketing/pages/about-page";

export const metadata: Metadata = {
  title: "About",
  description:
    "Welpco connects people who need everyday services with vetted providers in their area.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — Welpco",
    description:
      "A local-services marketplace built around proximity, trust, and provider autonomy.",
    url: "/about",
    type: "website",
  },
};

export default function MarketingAboutRoute() {
  return <AboutPage />;
}
