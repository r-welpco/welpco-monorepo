import type { Metadata } from "next";
import { HowItWorksPage } from "@/components/features/marketing/pages/how-it-works-page";

export const metadata: Metadata = {
  title: "How it works",
  description: "Two flows — booking and providing. Both take three steps.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How it works — Welpco",
    description: "How Welpco works: booking a service or becoming a Welper, in three steps.",
    url: "/how-it-works",
    type: "website",
  },
};

export default function MarketingHowItWorksRoute() {
  return <HowItWorksPage />;
}
