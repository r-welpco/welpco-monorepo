import { ImageResponse } from "next/og";
import type { ReactElement, ReactNode } from "react";
import type { PublicWelperProfile } from "@/types";
import { publicWelperDisplayName } from "@/lib/display-name";
import { categoryChipNames } from "./profile-data";
import { displayHost, envAppOrigin } from "./app-origin";

/**
 * SHARE-003 — shared 1200×630 OG card for `/welper/[id]` and `/w/[handle]`.
 *
 * Design (plan §3.1 "card anatomy", brand = grass green family, tokens.ts
 * SEMANTIC_COLOR.primary = "grass"): grass-gradient brand frame around a
 * cream card, Welpco wordmark (inlined SVG paths from
 * `public/logos/Welpco_Logotype_*.svg` — satori can't load <style> classes,
 * so paths carry explicit fills), photo disc left (initials disc fallback),
 * name, category chips, rating line only when reviewCount ≥ 1, and a
 * "Background-checked" pill only when `verified === true` — never fabricated
 * (bible §22.6).
 *
 * Any failure (no profile, photo fetch error, render input problem) degrades
 * to a static branded fallback card — this route must never 500 a link
 * unfurl.
 */

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";
export const OG_IMAGE_ALT = "Welper profile on Welpco";

/** Deep brand green — fill color of the primary logo SVGs. */
export const BRAND_GREEN = "#004B2D";
/** Radix grass-9 — SEMANTIC_COLOR.primary accent. */
export const GRASS = "#46A758";
export const CREAM = "#FBFAF3";
export const INK = "#14231A";
export const MUTED = "#5B7263";
export const CHIP_BG = "#E5F2E5";
export const CHIP_BORDER = "#C6E2CB";
export const CHIP_TEXT = "#1D5B36";
export const STAR_AMBER = "#EE9D2B";

/* ------------------------------------------------------------------ */
/* Brand marks — paths inlined from apps/web/public/logos (satori-safe) */
/* ------------------------------------------------------------------ */

const WORDMARK_PATHS = [
  "M54.85,29.5h-7.04c-.24,0-.44.17-.51.41l-7.58,30.15-7.97-29.61c-.07-.23-.28-.39-.52-.39h-7.08c-.24,0-.45.16-.52.39l-7.91,29.61-7.69-30.15c-.05-.24-.27-.41-.52-.41H.54c-.36,0-.61.33-.52.67l10.56,39.77c.12.47.53.79,1.01.79h7.47c.48,0,.89-.32,1.01-.79l7.66-28.37,7.56,28.37c.13.47.56.79,1.04.79h7.4c.48,0,.89-.32,1.01-.79l10.61-39.77c.09-.33-.17-.67-.51-.67Z",
  "M89.19,64.41v5.78c0,.29-.24.53-.53.53h-27.44c-.58,0-1.05-.47-1.05-1.05V30.57c0-.59.48-1.06,1.06-1.06h26.78c.29,0,.53.24.53.53v5.79c0,.29-.23.52-.52.52h-20.23v16.31c.69-1.24,1.53-2.43,2.51-3.53,3.09-3.46,6.98-5.35,11.59-5.72,1.54-.13,3.1-.05,4.67-.03.29,0,.53.24.53.53v5.66c0,.32-.29.56-.61.52-8.44-1.21-15.49,4.41-18.68,9.57v4.23h20.87c.29,0,.53.24.53.53Z",
  "M124.11,63.66h-20.37c-.29,0-.52-.24-.52-.53V30.03c0-.28-.25-.53-.53-.53h-6.56c-.29,0-.53.25-.53.53v40.15c0,.29.24.53.53.53h27.98c.29,0,.53-.24.53-.53v-6c0-.29-.24-.52-.53-.52Z",
  "M228.24,28.45c-11.9,0-21.82,8.63-21.82,21.53s9.88,21.58,21.82,21.58,21.75-8.63,21.75-21.58-9.87-21.53-21.75-21.53ZM228.24,64.72c-8.19,0-14.14-5.84-14.14-14.75s6-14.7,14.14-14.7,14.13,5.78,14.13,14.7-5.88,14.75-14.13,14.75Z",
  "M159.73,41.98c-.53-5.67-4.97-10.32-10.4-11.69-3.67-1.07-7.38-.79-11.14-.79h-9.36c-.53.05-.95.51-.95,1.05v39.1c0,.59.48,1.05,1.05,1.05h5.51c.59,0,1.06-.47,1.06-1.05v-20.33s0,.03.01.04c2.48,8.54,15.3,9.2,20.82,2.54,2.56-3.09,3.77-6.02,3.38-9.93ZM149.32,48.45c-2.35,1.2-5.38,1.27-7.83.4-2.01-.71-3.78-2.07-4.85-3.93-.75-1.29-.9-2.59-.98-4.06-.08-1.41-.09-2.82-.13-4.23,0-.15.11-.27.26-.27,1.82,0,3.64-.03,5.45.02,2.62.07,5.49.01,7.92,1.18,2.7,1.29,4.59,4.55,3.35,7.5-.65,1.56-1.81,2.67-3.2,3.39Z",
  "M202.86,61.57c-3.75,6.4-10.36,9.99-18.35,9.99-12.23,0-21.47-8.69-21.47-21.58s9.75-21.53,21.53-21.53c4.7,0,9.44,1.36,13.2,4.22,1.85,1.41,3.41,3.16,4.63,5.14,1.79,2.91-2.66,4.37-4.72,4.93-1.5.42-2.75.6-2.75.6.09-1.67-.35-3.33-1.41-4.65-1.12-1.38-2.87-2.28-4.56-2.75-1.47-.41-2.93-.66-4.45-.66-7.91,0-13.79,5.61-13.79,14.74s5.72,14.69,13.68,14.69c5.43,0,10.14-2.58,12.26-7.02.28-.59,1-.81,1.54-.45l4.34,2.89c.47.32.6.94.32,1.43Z",
] as const;

const ISOTYPE_PATHS = [
  "M64,42.94c11.72,0,21.22-9.5,21.22-21.22S75.72.5,64,.5s-21.22,9.5-21.22,21.22,9.5,21.22,21.22,21.22Z",
  "M113.68,50.25h-28.62c-3.48,0-6.76,1.64-8.85,4.42l-3.35,4.46c-4.43,5.9-13.28,5.9-17.71,0l-3.35-4.46c-2.09-2.78-5.37-4.42-8.85-4.42H14.32c-9.82,0-13.66,12.74-5.48,18.17l20.34,13.49c3.84,2.55,5.42,7.4,3.81,11.72l-7.57,20.3c-3.51,9.4,7.59,17.46,15.45,11.22l16.97-13.47c3.61-2.86,8.72-2.86,12.32,0l16.97,13.47c7.86,6.24,18.95-1.82,15.45-11.22l-7.57-20.3c-1.61-4.32-.03-9.17,3.81-11.72l20.34-13.49c8.18-5.43,4.34-18.17-5.48-18.17Z",
] as const;

export function Wordmark({ height, color = BRAND_GREEN }: { height: number; color?: string }) {
  // Logotype viewBox is 250×100 (2.5:1).
  return (
    <svg
      width={Math.round(height * 2.5)}
      height={height}
      viewBox="0 0 250 100"
    >
      {WORDMARK_PATHS.map((d, i) => (
        <path key={i} d={d} fill={color} />
      ))}
    </svg>
  );
}

export function Isotype({ size, color = BRAND_GREEN }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128">
      {ISOTYPE_PATHS.map((d, i) => (
        <path key={i} d={d} fill={color} />
      ))}
    </svg>
  );
}

export function StarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={STAR_AMBER}
      />
    </svg>
  );
}

export function ShieldIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 1.7 3.5 4.9v6.3c0 5.3 3.6 10.2 8.5 11.4 4.9-1.2 8.5-6.1 8.5-11.4V4.9L12 1.7z"
        fill={CHIP_TEXT}
      />
      <path
        d="m10.7 15.4-3-3 1.5-1.5 1.5 1.5 4.1-4.1 1.5 1.5-5.6 5.6z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Data helpers                                                        */
/* ------------------------------------------------------------------ */

export function initialsFor(name: string): string {
  const parts = name
    .replace(/\./g, "")
    .split(/\s+/)
    .filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase());
  return letters.join("") || "W";
}

function toBase64(buffer: ArrayBuffer): string {
  // Edge-safe: prefer Buffer when the runtime has it, fall back to btoa.
  if (typeof Buffer !== "undefined") {
    return Buffer.from(buffer).toString("base64");
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Pre-fetch the profile photo into a data URI so a broken S3 URL degrades to
 * the initials disc instead of failing the whole satori render.
 */
export async function fetchPhotoDataUri(url: string | null): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4_000),
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const contentType = (res.headers.get("content-type") ?? "image/jpeg")
      .split(";")[0]
      .trim();
    if (!contentType.startsWith("image/") || contentType.includes("svg")) {
      return null;
    }
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > 8_000_000) return null;
    return `data:${contentType};base64,${toBase64(buffer)}`;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Card layout                                                         */
/* ------------------------------------------------------------------ */

/**
 * Grass gradient frame around the cream card — shared by the OG card and the
 * SHARE-004 downloadable cards (which pass bigger metrics for 1080px canvases).
 */
export function BrandFrame({
  children,
  framePadding = 20,
  cardRadius = 28,
  cardPadding = "48px 64px",
  arcSize = 420,
}: {
  children: ReactNode;
  framePadding?: number;
  cardRadius?: number;
  cardPadding?: string;
  arcSize?: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        padding: `${framePadding}px`,
        background: `linear-gradient(135deg, ${BRAND_GREEN} 0%, ${GRASS} 100%)`,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: CREAM,
          borderRadius: `${cardRadius}px`,
          padding: cardPadding,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative grass corner arc, top-right. */}
        <div
          style={{
            position: "absolute",
            top: `${-Math.round(arcSize * 0.45)}px`,
            right: `${-Math.round(arcSize * 0.45)}px`,
            width: `${arcSize}px`,
            height: `${arcSize}px`,
            borderRadius: "9999px",
            backgroundColor: "#E9F3E6",
            display: "flex",
          }}
        />
        {children}
      </div>
    </div>
  );
}

function welperCard(
  profile: PublicWelperProfile,
  photoDataUri: string | null,
): ReactElement {
  const name = publicWelperDisplayName(profile);
  const chips = categoryChipNames(profile, 3);
  const hasRating =
    typeof profile.averageRating === "number" &&
    profile.averageRating > 0 &&
    typeof profile.reviewCount === "number" &&
    profile.reviewCount >= 1;
  const reviewLabel = profile.reviewCount === 1 ? "review" : "reviews";
  const verified = profile.verified === true;

  return (
    <BrandFrame>
      {/* Header — wordmark. */}
      <div style={{ display: "flex" }}>
        <Wordmark height={44} />
      </div>

      {/* Main row — photo + identity. */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "56px",
        }}
      >
        {photoDataUri ? (
          <img
            src={photoDataUri}
            width={240}
            height={240}
            style={{
              width: "240px",
              height: "240px",
              borderRadius: "9999px",
              objectFit: "cover",
              border: `10px solid ${GRASS}`,
            }}
          />
        ) : (
          <div
            style={{
              width: "240px",
              height: "240px",
              borderRadius: "9999px",
              backgroundColor: GRASS,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "96px",
              fontWeight: 700,
            }}
          >
            {initialsFor(name)}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            maxWidth: "740px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "64px",
              fontWeight: 700,
              color: INK,
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>

          {chips.length > 0 && (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {chips.map((chip) => (
                <div
                  key={chip}
                  style={{
                    display: "flex",
                    padding: "8px 22px",
                    borderRadius: "9999px",
                    backgroundColor: CHIP_BG,
                    border: `1px solid ${CHIP_BORDER}`,
                    color: CHIP_TEXT,
                    fontSize: "26px",
                    fontWeight: 600,
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            {/* Rating only when real (≥1 review) — bible §22.6. */}
            {hasRating && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <StarIcon size={32} />
                <div
                  style={{
                    display: "flex",
                    fontSize: "30px",
                    fontWeight: 700,
                    color: INK,
                  }}
                >
                  {(profile.averageRating ?? 0).toFixed(1)}
                </div>
                <div
                  style={{ display: "flex", fontSize: "28px", color: MUTED }}
                >
                  {`· ${profile.reviewCount} ${reviewLabel}`}
                </div>
              </div>
            )}

            {/* Badge only when earned. */}
            {verified && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 20px",
                  borderRadius: "9999px",
                  backgroundColor: CHIP_BG,
                  border: `1px solid ${CHIP_BORDER}`,
                }}
              >
                <ShieldIcon size={26} />
                <div
                  style={{
                    display: "flex",
                    fontSize: "24px",
                    fontWeight: 600,
                    color: CHIP_TEXT,
                  }}
                >
                  Background-checked
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", fontSize: "26px", color: MUTED }}>
          {displayHost(envAppOrigin())}
        </div>
        <Isotype size={40} color={GRASS} />
      </div>
    </BrandFrame>
  );
}

/** Static branded card — used when the profile is unknown or anything fails. */
function fallbackCard(): ReactElement {
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
          {`Find trusted local help — ${displayHost(envAppOrigin())}`}
        </div>
      </div>
    </BrandFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export async function renderWelperOgImage(
  profile: PublicWelperProfile | null,
): Promise<ImageResponse> {
  if (!profile) {
    return new ImageResponse(fallbackCard(), OG_IMAGE_SIZE);
  }
  try {
    const photoDataUri = await fetchPhotoDataUri(profile.profilePhotoUrl);
    return new ImageResponse(welperCard(profile, photoDataUri), OG_IMAGE_SIZE);
  } catch {
    // Never 500 a link unfurl — degrade to the static branded card.
    return new ImageResponse(fallbackCard(), OG_IMAGE_SIZE);
  }
}
