import type { MetadataRoute } from "next";

/**
 * `robots.txt` for the public site.
 *
 * Allows crawlers to index the marketing surface, the public blog/legal
 * pages, and the public welper search (`/search`, adoption report item 10 —
 * a privacy-safe, unauthenticated surface). Disallows the dashboard, auth,
 * welper onboarding, and API — user-state surfaces that should never appear
 * in search engines.
 *
 * Override the host via `NEXT_PUBLIC_SITE_URL` in production.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://welpco.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/how-it-works", "/faq", "/contact", "/blog", "/legal", "/search"],
        // `/w` (vanity handle, SHARE-002) mirrors the `/welper` privacy
        // default — profile indexing stays opt-in until SHARE-012.
        disallow: ["/dashboard", "/auth", "/welper", "/w", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
