import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/i18n/locale-routes";
import {
  getCustomerGuideDocument,
  getWelperGuideDocument,
} from "@/lib/guides/get-guide-document";
import {
  toOverviewNavItems,
  toSectionNavItems,
  type GuideBlock,
  type GuideDocument,
} from "@/lib/guides/types";
import { GuideMobileNav, GuideOverviewLinks, GuideSectionNav } from "./guide-nav";
import styles from "./guides.module.css";

/**
 * Guide pages — bilingual public onboarding guides (customer + welper),
 * content-JSON driven like the legal pages. Rendered inside the `.welpco`
 * marketing layout.
 *
 * Layout is a documentation shell: a compact hero band, then a centred
 * two-column body (sticky section nav + a ~70ch content column). The intro
 * prose and the PDF's "Inside, you will find…" list open the content column
 * as an Overview whose rows are anchor links into the matching sections.
 *
 * The small amount of page chrome ("On this page", index-page copy) is
 * hardcoded per locale below — same approach as the legal pages' chrome.
 */

type GuideChrome = { onThisPage: string; contents: string; overview: string };

const GUIDE_CHROME: Record<Locale, GuideChrome> = {
  en: { onThisPage: "On this page", contents: "Contents", overview: "Overview" },
  fr: { onThisPage: "Sur cette page", contents: "Sommaire", overview: "Aperçu" },
};

/* ---------- Decorative wave (echoes the PDF covers) ----------
   Spans the FULL bottom edge of whatever band it sits in — `preserveAspectRatio="none"`
   + `width: 100%` means it stretches rather than getting clipped at one corner. */

type WaveTone = "hero" | "dark" | "cream";

const WAVE_FILLS: Record<WaveTone, { back: string; backOpacity: number; front: string }> = {
  // Cream hero band curving into the white content area below it.
  hero: { back: "var(--spring-soft, #AFD966)", backOpacity: 0.4, front: "#fff" },
  // Evergreen support card — a whisper of spring along the bottom.
  dark: { back: "var(--spring, #79C000)", backOpacity: 0.14, front: "rgba(121, 192, 0, 0.09)" },
  // Cream index cards.
  cream: { back: "var(--spring-soft, #AFD966)", backOpacity: 0.3, front: "rgba(121, 192, 0, 0.16)" },
};

function GuideWave({ className, tone }: { className: string; tone: WaveTone }) {
  const fill = WAVE_FILLS[tone];
  return (
    <svg
      className={className}
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <path
        d="M0 58 C240 10 480 98 720 74 C960 50 1200 6 1440 44 L1440 120 L0 120 Z"
        fill={fill.back}
        opacity={fill.backOpacity}
      />
      <path
        d="M0 86 C240 42 480 122 720 98 C960 74 1200 34 1440 70 L1440 120 L0 120 Z"
        fill={fill.front}
      />
    </svg>
  );
}

/* ---------- Block rendering ---------- */

function GuideBlocks({ blocks, locale }: { blocks: GuideBlock[]; locale: Locale }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return <p key={`p-${index}`}>{block.text}</p>;
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={`l-${index}`} className={styles.blockList}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ListTag>
          );
        }
        if (block.type === "callout") {
          return (
            <div
              key={`c-${index}`}
              className={
                block.variant === "important" ? styles.calloutImportant : styles.calloutTip
              }
            >
              {block.text}
            </div>
          );
        }
        const href = block.href.startsWith("/")
          ? localizedPath(block.href, locale)
          : block.href;
        return (
          <p key={`cta-${index}`}>
            <Link href={href} className={styles.cta}>
              {block.label}
              <span className={styles.ctaArrow} aria-hidden="true">
                →
              </span>
            </Link>
          </p>
        );
      })}
    </>
  );
}

/* ---------- Full guide document view ---------- */

function GuideDocumentView({ doc, locale }: { doc: GuideDocument; locale: Locale }) {
  const chrome = GUIDE_CHROME[locale] ?? GUIDE_CHROME.en;
  const sectionItems = toSectionNavItems(doc);
  const overviewItems = toOverviewNavItems(doc);

  return (
    <div className={styles.guidePage}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.heroEyebrow}>{doc.hero.eyebrow}</p>
          <h1 className={styles.heroTitle}>{doc.hero.title}</h1>
          <p className={styles.heroSubtitle}>{doc.hero.subtitle}</p>
        </div>
        <GuideWave className={styles.heroWave} tone="hero" />
      </header>

      <div className={styles.shell}>
        <GuideSectionNav items={sectionItems} label={chrome.onThisPage} />
        <GuideMobileNav items={sectionItems} label={chrome.contents} />

        <div className={styles.content}>
          <section className={styles.overview} aria-label={chrome.overview}>
            <div className={styles.overviewIntro}>
              {doc.overview.intro.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
            <p className={styles.overviewLead}>{doc.overview.tocLead}</p>
            <GuideOverviewLinks items={overviewItems} />
          </section>

          <div className={styles.sections}>
            {doc.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className={styles.section}
                tabIndex={-1}
                aria-labelledby={`${section.id}-title`}
              >
                <span className={styles.sectionNumeral}>{section.numeral}</span>
                <h2 id={`${section.id}-title`} className={styles.sectionTitle}>
                  {section.title}
                </h2>
                <div className={styles.sectionBody}>
                  <GuideBlocks blocks={section.blocks} locale={locale} />
                </div>
              </section>
            ))}
          </div>

          <section className={styles.supportCard} aria-labelledby="guide-support-title">
            <GuideWave className={styles.supportWave} tone="dark" />
            <h2 id="guide-support-title" className={styles.supportTitle}>
              {doc.support.title}
            </h2>
            <p className={styles.supportText}>{doc.support.text}</p>
            <a href={`mailto:${doc.support.email}`} className={styles.supportEmail}>
              {doc.support.email}
            </a>
            <div className={styles.supportClosing}>
              {doc.support.closing.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
            <p className={styles.supportSignature}>{doc.support.signature}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------- Customer guide ---------- */

export async function CustomerGuidePageContent({
  locale: localeProp,
}: { locale?: Locale } = {}) {
  const locale = localeProp ?? ((await getLocale()) as Locale);
  const doc = getCustomerGuideDocument(locale);
  return <GuideDocumentView doc={doc} locale={locale} />;
}

export async function getCustomerGuideMetadata(locale?: Locale) {
  const resolved = locale ?? ((await getLocale()) as Locale);
  return getCustomerGuideDocument(resolved).meta;
}

/* ---------- Welper guide ---------- */

export async function WelperGuidePageContent({
  locale: localeProp,
}: { locale?: Locale } = {}) {
  const locale = localeProp ?? ((await getLocale()) as Locale);
  const doc = getWelperGuideDocument(locale);
  return <GuideDocumentView doc={doc} locale={locale} />;
}

export async function getWelperGuideMetadata(locale?: Locale) {
  const resolved = locale ?? ((await getLocale()) as Locale);
  return getWelperGuideDocument(resolved).meta;
}

/* ---------- Guides index (two role cards) ---------- */

type GuidesIndexCopy = {
  meta: { title: string; description: string };
  eyebrow: string;
  title: string;
  lead: string;
  cards: {
    customer: { eyebrow: string; title: string; text: string; link: string };
    welper: { eyebrow: string; title: string; text: string; link: string };
  };
};

const GUIDES_INDEX_COPY: Record<Locale, GuidesIndexCopy> = {
  en: {
    meta: {
      title: "Welpco — Guides",
      description:
        "Official Welpco guides for customers and Welpers — how bookings, payments, the Marketplace, messaging, and reviews work.",
    },
    eyebrow: "Guides",
    title: "The Welpco guides",
    lead: "Everything you need to get started on the platform — how bookings, payments, messaging, and reviews work, step by step.",
    cards: {
      customer: {
        eyebrow: "For customers",
        title: "Customer guide",
        text: "Find the right Welper, post a request in the Marketplace, book a service, and learn how secure payments and reviews work.",
        link: "Read the customer guide",
      },
      welper: {
        eyebrow: "For Welpers",
        title: "Welper guide",
        text: "Set up your Stripe payouts, receive bookings, use the Marketplace, keep your profile up to date, and build your reputation.",
        link: "Read the Welper guide",
      },
    },
  },
  fr: {
    meta: {
      title: "Welpco — Guides",
      description:
        "Les guides officiels Welpco pour les clients et les Welpers — réservations, paiements, Marketplace, messagerie et avis.",
    },
    eyebrow: "Guides",
    title: "Les guides Welpco",
    lead: "Tout ce qu’il faut pour bien démarrer sur la plateforme — réservations, paiements, messagerie et avis, étape par étape.",
    cards: {
      customer: {
        eyebrow: "Pour les clients",
        title: "Guide du client",
        text: "Trouvez le bon Welper, publiez une demande dans la Marketplace, réservez un service et découvrez comment fonctionnent les paiements sécurisés et les avis.",
        link: "Lire le guide du client",
      },
      welper: {
        eyebrow: "Pour les Welpers",
        title: "Guide du Welper",
        text: "Configurez vos paiements Stripe, recevez des réservations, utilisez la Marketplace, gardez votre profil à jour et bâtissez votre réputation.",
        link: "Lire le guide du Welper",
      },
    },
  },
};

export async function GuidesIndexPageContent({
  locale: localeProp,
}: { locale?: Locale } = {}) {
  const locale = localeProp ?? ((await getLocale()) as Locale);
  const copy = GUIDES_INDEX_COPY[locale] ?? GUIDES_INDEX_COPY.en;

  const cards = [
    { key: "customer", href: localizedPath("/guides/customer", locale), ...copy.cards.customer },
    { key: "welper", href: localizedPath("/guides/welper", locale), ...copy.cards.welper },
  ];

  return (
    <div className={styles.guidePage}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.heroEyebrow}>{copy.eyebrow}</p>
          <h1 className={styles.heroTitle}>{copy.title}</h1>
          <p className={styles.heroSubtitle}>{copy.lead}</p>
        </div>
        <GuideWave className={styles.heroWave} tone="hero" />
      </header>

      <div className={styles.indexCards}>
        {cards.map((card) => (
          <Link key={card.key} href={card.href} className={styles.roleCard}>
            <GuideWave className={styles.roleCardWave} tone="cream" />
            <span className={styles.roleCardEyebrow}>{card.eyebrow}</span>
            <span className={styles.roleCardTitle}>{card.title}</span>
            <span className={styles.roleCardText}>{card.text}</span>
            <span className={styles.roleCardLink}>
              {card.link}
              <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function getGuidesIndexMetadata(locale?: Locale) {
  const resolved = locale ?? ((await getLocale()) as Locale);
  return (GUIDES_INDEX_COPY[resolved] ?? GUIDES_INDEX_COPY.en).meta;
}
