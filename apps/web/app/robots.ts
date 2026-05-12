import type { MetadataRoute } from "next";

/**
 * `robots.txt` for the public site.
 *
 * Allows crawlers to index the marketing surface and the public blog/legal
 * pages. Disallows the dashboard, auth, welper onboarding, search, and API
 * — those are user-state surfaces that should never appear in search.
 *
 * Override the host via `NEXT_PUBLIC_SITE_URL` in production.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://welpco.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/how-it-works", "/faq", "/contact", "/blog", "/legal"],
        disallow: ["/dashboard", "/auth", "/welper", "/search", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
