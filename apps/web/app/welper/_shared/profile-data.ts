import type { Metadata } from "next";
import type { PublicWelperProfile } from "@/types";
import { publicWelperDisplayName } from "@/lib/display-name";

/**
 * SHARE-003 — server-side helpers shared by `/welper/[id]` and `/w/[handle]`
 * for `generateMetadata` and the `opengraph-image` routes.
 *
 * Server code talks to the BFF origin directly (same base the auth config
 * uses server-side: `NEXT_PUBLIC_API_URL`). The public profile endpoint is
 * unauthenticated, so a plain `fetch` with a short revalidate window is all
 * we need — no api-client/session machinery in the metadata path.
 */

/**
 * `NEXT_PUBLIC_API_URL` is inlined at build time; `BFF_INTERNAL_URL` is a
 * runtime, server-only override for deployments where the server should hit
 * the BFF over an internal origin (and for local testing).
 */
const BFF_URL =
  process.env.BFF_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

/** Metadata is not booking-critical — 5 min of staleness is fine. */
const PROFILE_REVALIDATE_SECONDS = 300;

const FETCH_TIMEOUT_MS = 5_000;

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: PROFILE_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // Network error, timeout, or invalid JSON — callers treat null as
    // "unknown welper" and fall back to generic metadata / notFound().
    return null;
  }
}

function isPublicWelperProfile(value: unknown): value is PublicWelperProfile {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { welperId?: unknown }).welperId === "string"
  );
}

/** Public profile by welper id (`GET /api/search/welpers/:welperId`). Null on any failure. */
export async function fetchPublicWelperProfile(
  welperId: string,
): Promise<PublicWelperProfile | null> {
  if (!welperId) return null;
  const json = await fetchJson(
    `${BFF_URL}/api/search/welpers/${encodeURIComponent(welperId)}`,
  );
  return isPublicWelperProfile(json) ? json : null;
}

/**
 * SHARE-002 — resolve a vanity handle to the public profile
 * (`GET /api/search/welpers/by-handle/:handle`). The endpoint ships from the
 * BFF separately; until it exists every call resolves to null (404), which
 * the `/w/[handle]` route turns into `notFound()`.
 *
 * Defensive on shape: if the resolver returns only `{ welperId }` rather
 * than the full profile, follow up with the by-id fetch.
 */
export async function fetchPublicWelperProfileByHandle(
  handle: string,
): Promise<PublicWelperProfile | null> {
  if (!handle) return null;
  const json = await fetchJson(
    `${BFF_URL}/api/search/welpers/by-handle/${encodeURIComponent(handle)}`,
  );
  if (!isPublicWelperProfile(json)) return null;
  if (Array.isArray((json as { serviceOfferings?: unknown }).serviceOfferings)) {
    return json;
  }
  return fetchPublicWelperProfile(json.welperId);
}

/** First offering's category — the "headline" trade for title/description. */
export function primaryCategoryName(
  profile: PublicWelperProfile,
): string | null {
  const offering = profile.serviceOfferings?.[0];
  if (!offering) return null;
  return offering.categoryName || offering.parentCategoryName || null;
}

/** Deduped category names for the OG chips (top-level names preferred). */
export function categoryChipNames(
  profile: PublicWelperProfile,
  max = 3,
): string[] {
  const names: string[] = [];
  for (const offering of profile.serviceOfferings ?? []) {
    const name = offering.categoryName || offering.parentCategoryName;
    if (name && !names.includes(name)) names.push(name);
    if (names.length >= max) break;
  }
  return names;
}

/** Collapse whitespace and truncate on a word boundary for meta descriptions. */
function excerpt(text: string, maxLength = 160): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return collapsed;
  const cut = collapsed.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : maxLength - 1)}…`;
}

const FALLBACK_TITLE = "Welper profile | Welpco";
const FALLBACK_DESCRIPTION = "Find trusted local help on Welpco.";

/**
 * Per-welper metadata. Honest by construction (bible §22.6): the description
 * is the welper's own bio when they wrote one, otherwise a factual booking
 * line — never fabricated social proof.
 *
 * Unknown welper (bad id, BFF down) → plain generic metadata; the page
 * renders its own error/notFound state.
 */
export function buildWelperMetadata(
  profile: PublicWelperProfile | null,
  options: { canonicalPath?: string } = {},
): Metadata {
  const { canonicalPath } = options;

  if (!profile) {
    return {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      openGraph: {
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        siteName: "Welpco",
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
      },
    };
  }

  const name = publicWelperDisplayName(profile);
  const category = primaryCategoryName(profile);
  const title = category ? `${name} — ${category} | Welpco` : `${name} | Welpco`;
  const bio = profile.bio?.trim();
  const description = bio
    ? excerpt(bio)
    : category
      ? `Book ${name} for ${category} on Welpco — no charge until the job is done.`
      : `Book ${name} on Welpco — no charge until the job is done.`;

  return {
    title,
    description,
    ...(canonicalPath ? { alternates: { canonical: canonicalPath } } : {}),
    openGraph: {
      title,
      description,
      siteName: "Welpco",
      type: "profile",
      ...(canonicalPath ? { url: canonicalPath } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
