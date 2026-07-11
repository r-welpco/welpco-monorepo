import { redirect } from "next/navigation";

/**
 * Locale-prefixed search entry (e.g. /fr/search). The public search page
 * lives at the unprefixed `app/search/page.tsx` (this route family is
 * outside the i18n provider and hardcoded EN, like `/welper/[id]`).
 * Redirect there, preserving the query string.
 */
export default async function LocaleSearchRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      qs.set(key, value);
    } else if (Array.isArray(value) && value.length > 0) {
      qs.set(key, value[value.length - 1]);
    }
  }
  const query = qs.toString();
  redirect(query ? `/search?${query}` : "/search");
}
