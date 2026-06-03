import type { Metadata } from "next";
import localFont from "next/font/local";
import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { getTranslations } from "next-intl/server";
import "./tokens.css";
import "./responsive.css";
import { MarketingTopNavGate } from "./marketing-top-nav-gate";
import { Footer } from "@/components/features/marketing/shared/footer";

/**
 * Marketing route group — public marketing surface, ports the Claude Design
 * handoff bundle (`apps/web/.design-reference/`) faithfully into Next.js.
 * Locked as the canonical landing on 2026-04-25 (replaced the previous
 * Direction D refined-warm landing).
 *
 * Visual system:
 *   - The bundle's `tokens.css` is imported above as a global stylesheet,
 *     scoped throughout to `.welpco` so its CSS never leaks into the rest
 *     of the app.
 *   - Default theme is Evergreen (white page + evergreen text + spring-green
 *     accent). The Plum / Wine / Dark variants live in tokens.css as
 *     `[data-theme="…"]` selectors for completeness but are not exposed via
 *     any runtime switcher (per WEB-APP-PLAN.md §7.5).
 *
 * Fonts:
 *   - Fraunces, Inter Tight, JetBrains Mono via `next/font/google` (see `tokens.css`
 *     `--font-display` / `--font-body` / `--font-mono`).
 *   - Plus Jakarta Sans + Uncut Sans (variable `.ttf` in `fonts/marketing/`) for
 *     immersive hero experiments via `--font-plus-jakarta`,
 *     `--font-plus-jakarta-italic`, `--font-uncut-sans`.
 *
 * Chrome:
 *   - `<MarketingTopNavGate>` mounts `<TopNav>` on every marketing route except
 *     `/` (immersive hero supplies its own floating nav). `<Footer>` is always here.
 *   - `<WelperLaunchAnnouncementGate>` is available but not mounted here; wire it
 *     back in when a launch announcement should appear on marketing pages.
 *   - No Radix `<Theme>` wrapper — the bundle has its own button/card/pill
 *     system in `tokens.css` (`.btn`, `.card`, `.pill`, …) and does not
 *     consume any `@welpco/ui` primitives.
 */

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = localFont({
  src: "../../../fonts/marketing/PlusJakartaSans-VariableFont_wght.ttf",
  variable: "--font-plus-jakarta",
  weight: "200 800",
  display: "swap",
});

const plusJakartaSansItalic = localFont({
  src: "../../../fonts/marketing/PlusJakartaSans-Italic-VariableFont_wght.ttf",
  variable: "--font-plus-jakarta-italic",
  weight: "200 800",
  style: "italic",
  display: "swap",
});

const uncutSans = localFont({
  src: "../../../fonts/marketing/UncutSans-Variable.ttf",
  variable: "--font-uncut-sans",
  weight: "300 900",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://welpco.com";

const OG_IMAGE = {
  en: {
    path: "/og/og-image.png",
    alt: "Welpco — Local help. Real neighbours.",
  },
  fr: {
    path: "/og/og-image-fr.png",
    alt: "Welpco — De l'aide locale. Des gens de confiance.",
  },
} as const;

type MarketingLayoutParams = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<MarketingLayoutParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";
  const t = await getTranslations({ locale, namespace: "marketing.layout" });
  const og = isFr ? OG_IMAGE.fr : OG_IMAGE.en;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: "%s — Welpco",
    },
    description: t("description"),
    openGraph: {
      type: "website",
      siteName: "Welpco",
      title: t("title"),
      description: t("ogDescription"),
      url: SITE_URL,
      locale: isFr ? "fr_CA" : "en_US",
      images: [
        {
          url: og.path,
          width: 1200,
          height: 630,
          alt: og.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("twitterDescription"),
      images: [og.path],
    },
    alternates: { canonical: "/" },
  };
}

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = await getTranslations("marketing.a11y");

  return (
    <div
      className={`welpco ${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable} ${plusJakartaSans.variable} ${plusJakartaSansItalic.variable} ${uncutSans.variable}`}
      style={{ background: "var(--bg)", minHeight: "100vh" }}
    >
      <a className="welpco-skip-link" href="#main-content">
        {t("skipToContent")}
      </a>
      <MarketingTopNavGate />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  );
}
