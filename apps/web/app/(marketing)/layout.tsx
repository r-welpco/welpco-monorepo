import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import "../[locale]/(marketing)/tokens.css";
import { Footer } from "@/components/features/marketing/shared/footer";
import en from "@/messages/en.json";

/**
 * Layout for English-only blog and legal routes (phase 1 i18n scope).
 * Core marketing pages live under `app/[locale]/(marketing)/`.
 */
export default function MarketingBlogLegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextIntlClientProvider locale="en" messages={en as unknown as AbstractIntlMessages}>
      <div className="welpco" style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <main id="main-content">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
