export type ShareCardFormat = "story" | "square" | "landscape";
export type ShareCardLang = "en" | "fr";

const DEFAULT_WEB_APP_URL = "http://localhost:8081";

/** Public web app origin (share-card PNGs live here). */
export function getWebAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_WEB_URL?.trim();
  return (raw || DEFAULT_WEB_APP_URL).replace(/\/+$/, "");
}

export function buildShareCardUrl(
  welperId: string,
  format: ShareCardFormat,
  lang: ShareCardLang,
): string {
  const params = new URLSearchParams({ format, lang });
  return `${getWebAppUrl()}/api/share-card/${encodeURIComponent(welperId)}?${params}`;
}

export function shareCardFilename(
  slug: string,
  format: ShareCardFormat,
  lang: ShareCardLang,
): string {
  return `welpco-${slug}-${format}-${lang}.png`;
}
