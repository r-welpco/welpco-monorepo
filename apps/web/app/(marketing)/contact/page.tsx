import type { Metadata } from "next";
import { ContactPage } from "@/components/features/marketing/pages/contact-page";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions, concerns or feedback. We respond within 48 hours.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact — Welpco",
    description: "Email support@welpco.com or send a message — we respond within 48 hours.",
    url: "/contact",
    type: "website",
  },
};

export default function MarketingContactRoute() {
  return <ContactPage />;
}
