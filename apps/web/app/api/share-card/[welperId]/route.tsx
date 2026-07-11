import type { NextRequest } from "next/server";
import { fetchPublicWelperProfile } from "@/app/welper/_shared/profile-data";
import { originFromHeaders } from "@/app/welper/_shared/app-origin";
import {
  SHARE_CARD_FORMATS,
  isShareCardLang,
  renderShareCard,
  type ShareCardFormat,
  type ShareCardLang,
} from "@/app/welper/_shared/share-card";

/**
 * SHARE-004 — downloadable share-card PNGs.
 *
 * `GET /api/share-card/{welperId}?format=story|square|landscape&lang=en|fr`
 * - story:     1080×1920
 * - square:    1080×1080
 * - landscape: 1200×630 (the SHARE-003 OG design + QR side panel)
 *
 * Every card embeds a scannable QR (`?src=qr-{format}`) and a contact
 * footer. The QR target and printed host derive from the request origin
 * (`x-forwarded-host` → `host`, proto from `x-forwarded-proto`) — no
 * hardcoded domain.
 *
 * Public-profile data only (same source as the OG image routes), so the
 * route is unauthenticated by design. Unknown welper or a render failure
 * degrades to the static branded card — never a 500.
 *
 * `Content-Disposition: attachment` so the share-hub download buttons (and
 * direct navigation) save a file instead of rendering inline.
 */

function isShareCardFormat(value: string | null): value is ShareCardFormat {
  return value !== null && (SHARE_CARD_FORMATS as readonly string[]).includes(value);
}

/** Filename-safe slug: handle when claimed, otherwise the welper id. */
function filenameSlug(handle: string | null | undefined, welperId: string): string {
  const base = handle && /^[a-z0-9-]+$/.test(handle) ? handle : welperId;
  return base.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64) || "profile";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ welperId: string }> },
) {
  const { welperId } = await params;
  const formatParam = request.nextUrl.searchParams.get("format");
  const format: ShareCardFormat = isShareCardFormat(formatParam)
    ? formatParam
    : "landscape";
  const langParam = request.nextUrl.searchParams.get("lang");
  const lang: ShareCardLang = isShareCardLang(langParam) ? langParam : "en";
  const origin = originFromHeaders(request.headers);

  const profile = await fetchPublicWelperProfile(welperId);
  const slug = filenameSlug(profile?.handle, welperId);

  return renderShareCard(profile, format, {
    origin,
    lang,
    headers: {
      "Content-Disposition": `attachment; filename="welpco-${slug}-${format}-${lang}.png"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
