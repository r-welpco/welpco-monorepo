import type { Metadata } from "next";
import { FAQPage } from "@/components/features/marketing/pages/faq-page";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions for Welpers and customers — Welping, booking, payments and platform safety.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — Welpco",
    description: "Common questions about Welping, booking, payments and platform safety.",
    url: "/faq",
    type: "website",
  },
};

export default function MarketingFAQRoute() {
  return <FAQPage />;
}
