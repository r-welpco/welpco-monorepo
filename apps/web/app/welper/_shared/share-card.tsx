import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import type { ReactElement } from "react";
import type { PublicWelperProfile } from "@/types";
import frMessages from "@/messages/fr.json";
import { publicWelperDisplayName } from "@/lib/display-name";
import { categoryChipNames } from "./profile-data";
import { SUPPORT_EMAIL, displayHost } from "./app-origin";
import {
  BrandFrame,
  CHIP_BG,
  CHIP_BORDER,
  CHIP_TEXT,
  GRASS,
  INK,
  Isotype,
  MUTED,
  ShieldIcon,
  StarIcon,
  Wordmark,
  fetchPhotoDataUri,
  initialsFor,
} from "./profile-og";

/**
 * SHARE-004 — downloadable share cards in three aspect ratios, reusing the
 * SHARE-003 OG design language (grass brand frame, cream card, honest
 * rating/badge rules — bible §22.6).
 *
 * Refinement pass (2026-07-11):
 * - Scannable QR code on every downloadable format (server-side
 *   `QRCode.create` module matrix → one inline SVG path — satori-safe, no
 *   canvas), near-black modules on a white rounded panel, error-correction H
 *   with the Welpco logomark on a centered white chip (~19% edge).
 *   QR target carries `?src=qr-story|qr-square|qr-landscape`.
 * - Printed URLs / host text derive from the request origin (route handler) —
 *   no hardcoded domain here.
 * - Contact footer on every card: `{host} · support@welpco.com`.
 * - EN + FR via a small inline dictionary (these routes sit outside
 *   next-intl).
 *
 * The human-readable printed URL keeps the original `src` codes
 * (story → `?src=story`, square → `?src=square`, landscape → `?src=og`) so
 * typed-in visits and scanned visits stay distinguishable (SHARE-005).
 */

export const SHARE_CARD_FORMATS = ["story", "square", "landscape"] as const;
export type ShareCardFormat = (typeof SHARE_CARD_FORMATS)[number];

export const SHARE_CARD_LANGS = ["en", "fr"] as const;
export type ShareCardLang = (typeof SHARE_CARD_LANGS)[number];

export const SHARE_CARD_SIZES: Record<ShareCardFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1200, height: 630 },
};

/** SHARE-005 whitelisted src code carried by each format's printed URL. */
export const SHARE_CARD_SRC: Record<ShareCardFormat, string> = {
  story: "story",
  square: "square",
  landscape: "og",
};

/** src code carried by each format's embedded QR target (scans ≠ typed visits). */
export const SHARE_CARD_QR_SRC: Record<ShareCardFormat, string> = {
  story: "qr-story",
  square: "qr-square",
  landscape: "qr-landscape",
};

/* ------------------------------------------------------------------ */
/* Card copy — EN/FR inline dictionary (outside next-intl)             */
/* ------------------------------------------------------------------ */

interface CardText {
  reviewSingular: string;
  reviewPlural: string;
  backgroundChecked: string;
  scanToBook: string;
  /** "Book {name} on {host}" line next to the QR. */
  bookOn: (name: string, host: string) => string;
  tagline: string;
  fallbackTagline: string;
}

const CARD_TEXT: Record<ShareCardLang, CardText> = {
  en: {
    reviewSingular: "review",
    reviewPlural: "reviews",
    backgroundChecked: "Background-checked",
    scanToBook: "Scan to book",
    bookOn: (name, host) => `Book ${name} on ${host}`,
    tagline: "No charge until the job is done",
    fallbackTagline: "Find trusted local help",
  },
  fr: {
    reviewSingular: "avis",
    reviewPlural: "avis",
    backgroundChecked: "Antécédents vérifiés",
    scanToBook: "Scannez pour réserver",
    bookOn: (name, host) => `Réservez ${name} sur ${host}`,
    tagline: "Débité seulement une fois le travail terminé",
    fallbackTagline: "Trouvez de l'aide locale de confiance",
  },
};

export function isShareCardLang(value: string | null): value is ShareCardLang {
  return value !== null && (SHARE_CARD_LANGS as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ */
/* Category chips — taxonomy names arrive from the BFF in English      */
/* ------------------------------------------------------------------ */

/**
 * The taxonomy stores one English name per category, so a FR card would
 * otherwise print English chips under translated copy. This reuses the same
 * map the dashboard uses (`useCategoryDisplayName`) rather than keeping a
 * second list that could drift. English names are already display names.
 */
const CATEGORY_NAMES: Record<ShareCardLang, Record<string, string>> = {
  en: {},
  fr: frMessages.auth.register.categoryNames,
};

/** Localized chip label, falling back to the English name when unmapped. */
export function shareCardCategoryName(
  englishName: string,
  lang: ShareCardLang,
): string {
  return CATEGORY_NAMES[lang][englishName] ?? englishName;
}

/* ------------------------------------------------------------------ */
/* URL helpers                                                         */
/* ------------------------------------------------------------------ */

function profilePath(
  profile: Pick<PublicWelperProfile, "welperId" | "handle">,
): string {
  return profile.handle
    ? `/w/${profile.handle}`
    : `/welper/${profile.welperId}`;
}

/** Bare display URL printed on the card (no protocol — this is for humans). */
export function shareCardUrlText(
  profile: Pick<PublicWelperProfile, "welperId" | "handle">,
  format: ShareCardFormat,
  host: string,
): string {
  return `${host}${profilePath(profile)}?src=${SHARE_CARD_SRC[format]}`;
}

/** Absolute QR target with the scan-specific src code. */
export function shareCardQrTarget(
  profile: Pick<PublicWelperProfile, "welperId" | "handle">,
  format: ShareCardFormat,
  origin: string,
): string {
  return `${origin}${profilePath(profile)}?src=${SHARE_CARD_QR_SRC[format]}`;
}

/* ------------------------------------------------------------------ */
/* Text-fitting helpers — long names must never collide with the frame */
/* ------------------------------------------------------------------ */

function ellipsize(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Drop to the smaller size once the (already ellipsized) name gets long. */
function fitFontSize(text: string, base: number, small: number, threshold = 16): number {
  return text.length > threshold ? small : base;
}

/* ------------------------------------------------------------------ */
/* QR panel — server-side module matrix rendered as one SVG path       */
/* ------------------------------------------------------------------ */

/** Near-black ink for modules — matches the share-hub client QR. */
const QR_INK = INK;

/** One `M…h…v1h-…z` run per horizontal streak of dark modules — compact. */
function qrPathData(size: number, data: Uint8Array | number[]): string {
  const segments: string[] = [];
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      if (data[y * size + x]) {
        let run = 1;
        while (x + run < size && data[y * size + (x + run)]) run++;
        segments.push(`M${x} ${y}h${run}v1h-${run}z`);
        x += run;
      } else {
        x++;
      }
    }
  }
  return segments.join("");
}

/**
 * White rounded panel, QR at error-correction **H**, Welpco logomark centered
 * on a white chip (~19% of the code edge — occludes ~7% of modules, well
 * inside H's 30% recovery budget). The panel padding doubles as the quiet
 * zone. Everything is satori-friendly: one inline `<svg>` + a few divs.
 */
function QrPanel({ url, edge }: { url: string; edge: number }) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const moduleCount = qr.modules.size;
  const path = qrPathData(moduleCount, qr.modules.data);

  // Quiet zone ≈ 4 modules on each side.
  const quiet = Math.max(12, Math.round((edge / (moduleCount + 8)) * 4));
  const inner = edge - quiet * 2;
  const chip = Math.round(inner * 0.26);
  const logo = Math.round(inner * 0.19);
  const chipOffset = Math.round((edge - chip) / 2);

  return (
    <div
      style={{
        display: "flex",
        width: `${edge}px`,
        height: `${edge}px`,
        padding: `${quiet}px`,
        backgroundColor: "#FFFFFF",
        borderRadius: `${Math.round(edge * 0.07)}px`,
        border: `1px solid ${CHIP_BORDER}`,
        position: "relative",
      }}
    >
      <svg width={inner} height={inner} viewBox={`0 0 ${moduleCount} ${moduleCount}`}>
        <path d={path} fill={QR_INK} />
      </svg>
      <div
        style={{
          position: "absolute",
          top: `${chipOffset}px`,
          left: `${chipOffset}px`,
          width: `${chip}px`,
          height: `${chip}px`,
          backgroundColor: "#FFFFFF",
          borderRadius: `${Math.round(chip * 0.22)}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Isotype size={logo} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared sub-blocks                                                   */
/* ------------------------------------------------------------------ */

function PhotoDisc({
  photoDataUri,
  name,
  size,
}: {
  photoDataUri: string | null;
  name: string;
  size: number;
}) {
  if (photoDataUri) {
    return (
      <img
        src={photoDataUri}
        width={size}
        height={size}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "9999px",
          objectFit: "cover",
          border: `${Math.max(8, Math.round(size / 24))}px solid ${GRASS}`,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "9999px",
        backgroundColor: GRASS,
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${Math.round(size * 0.4)}px`,
        fontWeight: 700,
      }}
    >
      {initialsFor(name)}
    </div>
  );
}

function Chips({
  chips,
  fontSize,
  align = "center",
}: {
  chips: string[];
  fontSize: number;
  align?: "center" | "start";
}) {
  if (chips.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: `${Math.round(fontSize * 0.5)}px`,
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
      }}
    >
      {chips.map((chip) => (
        <div
          key={chip}
          style={{
            display: "flex",
            padding: `${Math.round(fontSize * 0.35)}px ${Math.round(fontSize * 0.9)}px`,
            borderRadius: "9999px",
            backgroundColor: CHIP_BG,
            border: `1px solid ${CHIP_BORDER}`,
            color: CHIP_TEXT,
            fontSize: `${fontSize}px`,
            fontWeight: 600,
          }}
        >
          {ellipsize(chip, 24)}
        </div>
      ))}
    </div>
  );
}

/** Rating (only when ≥1 review) + verified badge (only when earned). */
function TrustRow({
  profile,
  fontSize,
  text,
  align = "center",
}: {
  profile: PublicWelperProfile;
  fontSize: number;
  text: CardText;
  align?: "center" | "start";
}) {
  const hasRating =
    typeof profile.averageRating === "number" &&
    profile.averageRating > 0 &&
    typeof profile.reviewCount === "number" &&
    profile.reviewCount >= 1;
  const verified = profile.verified === true;
  if (!hasRating && !verified) return null;
  const reviewLabel =
    profile.reviewCount === 1 ? text.reviewSingular : text.reviewPlural;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: `${Math.round(fontSize * 0.8)}px`,
        flexWrap: "wrap",
      }}
    >
      {hasRating && (
        <div style={{ display: "flex", alignItems: "center", gap: `${Math.round(fontSize * 0.35)}px` }}>
          <StarIcon size={Math.round(fontSize * 1.15)} />
          <div style={{ display: "flex", fontSize: `${fontSize}px`, fontWeight: 700, color: INK }}>
            {(profile.averageRating ?? 0).toFixed(1)}
          </div>
          <div style={{ display: "flex", fontSize: `${Math.round(fontSize * 0.92)}px`, color: MUTED }}>
            {`· ${profile.reviewCount} ${reviewLabel}`}
          </div>
        </div>
      )}
      {verified && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: `${Math.round(fontSize * 0.35)}px`,
            padding: `${Math.round(fontSize * 0.3)}px ${Math.round(fontSize * 0.7)}px`,
            borderRadius: "9999px",
            backgroundColor: CHIP_BG,
            border: `1px solid ${CHIP_BORDER}`,
          }}
        >
          <ShieldIcon size={Math.round(fontSize * 0.95)} />
          <div
            style={{
              display: "flex",
              fontSize: `${Math.round(fontSize * 0.85)}px`,
              fontWeight: 600,
              color: CHIP_TEXT,
            }}
          >
            {text.backgroundChecked}
          </div>
        </div>
      )}
    </div>
  );
}

/** Printed profile URL — carries the format's src code. */
function UrlLine({ text, fontSize }: { text: string; fontSize: number }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: `${fontSize}px`,
        fontWeight: 600,
        color: CHIP_TEXT,
      }}
    >
      {text}
    </div>
  );
}

/** Quiet Welpco contact footer: `{host} · support@welpco.com`. */
function ContactFooter({
  host,
  fontSize,
  align = "center",
}: {
  host: string;
  fontSize: number;
  align?: "center" | "start";
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: align === "center" ? "center" : "flex-start",
        fontSize: `${fontSize}px`,
        color: MUTED,
      }}
    >
      {`${host} · ${SUPPORT_EMAIL}`}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Format layouts                                                      */
/* ------------------------------------------------------------------ */

interface CardContext {
  origin: string;
  host: string;
  text: CardText;
  /** Localizes an English taxonomy name for this card's language. */
  categoryName: (englishName: string) => string;
}

/**
 * 1080×1920 — deliberate vertical rhythm: wordmark → dominant photo +
 * identity in the upper two-thirds → QR + "Scan to book" block → contact
 * footer at the base.
 */
function storyCard(
  profile: PublicWelperProfile,
  photoDataUri: string | null,
  ctx: CardContext,
): ReactElement {
  const name = ellipsize(publicWelperDisplayName(profile), 28);
  const chips = categoryChipNames(profile, 3).map((n) => ctx.categoryName(n));
  const urlText = shareCardUrlText(profile, "story", ctx.host);
  // UUID URLs are much longer than handle URLs — drop the font so one line fits.
  const urlFontSize = profile.handle ? 30 : 22;

  return (
    <BrandFrame framePadding={32} cardRadius={44} cardPadding="80px 72px" arcSize={640}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Wordmark height={64} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "40px",
            maxWidth: "880px",
          }}
        >
          <PhotoDisc photoDataUri={photoDataUri} name={name} size={380} />
          <div
            style={{
              display: "flex",
              fontSize: `${fitFontSize(name, 84, 64)}px`,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            {name}
          </div>
          <Chips chips={chips} fontSize={32} />
          <TrustRow profile={profile} fontSize={36} text={ctx.text} />
          <div style={{ display: "flex", fontSize: "30px", color: MUTED }}>
            {ctx.text.tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "36px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "44px" }}>
            <QrPanel url={shareCardQrTarget(profile, "story", ctx.origin)} edge={300} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                maxWidth: "540px",
              }}
            >
              <div style={{ display: "flex", fontSize: "44px", fontWeight: 700, color: INK }}>
                {ctx.text.scanToBook}
              </div>
              <div style={{ display: "flex", fontSize: "30px", color: MUTED }}>
                {ctx.text.bookOn(name, ctx.host)}
              </div>
              <UrlLine text={urlText} fontSize={urlFontSize} />
            </div>
          </div>
          <ContactFooter host={ctx.host} fontSize={24} />
        </div>
      </div>
    </BrandFrame>
  );
}

/**
 * 1080×1080 — photo + identity row up top (photo left keeps the name clear
 * of long category chips), QR anchored in the bottom-right corner with the
 * CTA + contact block bottom-left.
 */
function squareCard(
  profile: PublicWelperProfile,
  photoDataUri: string | null,
  ctx: CardContext,
): ReactElement {
  const name = ellipsize(publicWelperDisplayName(profile), 26);
  const chips = categoryChipNames(profile, 3).map((n) => ctx.categoryName(n));
  const urlText = shareCardUrlText(profile, "square", ctx.host);
  const urlFontSize = profile.handle ? 26 : 18;

  return (
    <BrandFrame framePadding={28} cardRadius={40} cardPadding="56px 60px" arcSize={520}>
      <div style={{ display: "flex" }}>
        <Wordmark height={52} />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "48px",
        }}
      >
        <PhotoDisc photoDataUri={photoDataUri} name={name} size={280} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "26px",
            maxWidth: "580px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: `${fitFontSize(name, 68, 52)}px`,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>
          <Chips chips={chips} fontSize={28} align="start" />
          <TrustRow profile={profile} fontSize={30} text={ctx.text} align="start" />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            maxWidth: "620px",
          }}
        >
          <div style={{ display: "flex", fontSize: "34px", fontWeight: 700, color: INK }}>
            {ctx.text.scanToBook}
          </div>
          <div style={{ display: "flex", fontSize: "26px", color: MUTED }}>
            {ctx.text.tagline}
          </div>
          <UrlLine text={urlText} fontSize={urlFontSize} />
          <ContactFooter host={ctx.host} fontSize={20} align="start" />
        </div>
        <QrPanel url={shareCardQrTarget(profile, "square", ctx.origin)} edge={240} />
      </div>
    </BrandFrame>
  );
}

/**
 * 1200×630 — the SHARE-003 OG composition on the left, a dedicated QR side
 * panel on the right, contact footer along the base.
 */
function landscapeCard(
  profile: PublicWelperProfile,
  photoDataUri: string | null,
  ctx: CardContext,
): ReactElement {
  const name = ellipsize(publicWelperDisplayName(profile), 26);
  const chips = categoryChipNames(profile, 3).map((n) => ctx.categoryName(n));
  const urlText = shareCardUrlText(profile, "landscape", ctx.host);
  const urlFontSize = profile.handle ? 22 : 17;

  return (
    <BrandFrame cardPadding="44px 56px">
      <div style={{ flex: 1, display: "flex", gap: "48px" }}>
        {/* Left — brand + identity + URL/contact footer. */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex" }}>
            <Wordmark height={40} />
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "44px" }}>
            <PhotoDisc photoDataUri={photoDataUri} name={name} size={200} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                maxWidth: "560px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: `${fitFontSize(name, 56, 44)}px`,
                  fontWeight: 700,
                  color: INK,
                  lineHeight: 1.1,
                }}
              >
                {name}
              </div>
              <Chips chips={chips} fontSize={24} align="start" />
              <TrustRow profile={profile} fontSize={26} text={ctx.text} align="start" />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <UrlLine text={urlText} fontSize={urlFontSize} />
            <ContactFooter host={ctx.host} fontSize={17} align="start" />
          </div>
        </div>

        {/* Right — QR side panel. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "18px",
          }}
        >
          <QrPanel url={shareCardQrTarget(profile, "landscape", ctx.origin)} edge={200} />
          <div style={{ display: "flex", fontSize: "22px", fontWeight: 700, color: INK }}>
            {ctx.text.scanToBook}
          </div>
        </div>
      </div>
    </BrandFrame>
  );
}

/** Static branded card — unknown welper or render failure. Never 500s. */
function fallbackCard(ctx: CardContext): ReactElement {
  return (
    <BrandFrame>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "36px",
        }}
      >
        <Isotype size={110} />
        <Wordmark height={72} />
        <div style={{ display: "flex", fontSize: "34px", color: MUTED }}>
          {`${ctx.text.fallbackTagline} — ${ctx.host}`}
        </div>
        <div style={{ display: "flex", fontSize: "24px", color: MUTED }}>
          {SUPPORT_EMAIL}
        </div>
      </div>
    </BrandFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

const LAYOUTS: Record<
  ShareCardFormat,
  (
    profile: PublicWelperProfile,
    photoDataUri: string | null,
    ctx: CardContext,
  ) => ReactElement
> = {
  story: storyCard,
  square: squareCard,
  landscape: landscapeCard,
};

export async function renderShareCard(
  profile: PublicWelperProfile | null,
  format: ShareCardFormat,
  options: {
    /** Request-derived origin, e.g. `https://welpco.com` — QR target + printed host. */
    origin: string;
    lang?: ShareCardLang;
    headers?: Record<string, string>;
  },
): Promise<ImageResponse> {
  const size = SHARE_CARD_SIZES[format];
  const responseInit = { ...size, headers: options.headers };
  const lang = options.lang ?? "en";
  const ctx: CardContext = {
    origin: options.origin,
    host: displayHost(options.origin),
    text: CARD_TEXT[lang],
    categoryName: (englishName) => shareCardCategoryName(englishName, lang),
  };
  if (!profile) {
    return new ImageResponse(fallbackCard(ctx), responseInit);
  }
  try {
    const photoDataUri = await fetchPhotoDataUri(profile.profilePhotoUrl);
    return new ImageResponse(LAYOUTS[format](profile, photoDataUri, ctx), responseInit);
  } catch {
    return new ImageResponse(fallbackCard(ctx), responseInit);
  }
}
