import type { MetadataRoute } from "next";

/**
 * `sitemap.xml` for the public site.
 *
 * Covers the 5 canonical marketing routes plus the public blog/legal stubs.
 * The dashboard, auth, search and welper onboarding are intentionally
 * excluded. Add new public routes here as they ship.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://welpco.com";

interface RouteEntry {
  path: string;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
}

const ROUTES: RouteEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.5 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.3 },
];

/**
 * Use a build-time constant so the sitemap can prerender statically. Next 16
 * cache-components mode treats `new Date()` as a dynamic data source and
 * forces the route to ƒ; the resulting timestamp would only update on each
 * deploy regardless. A static fallback is the same effective behavior with
 * better edge-cache headers.
 */
const LAST_MODIFIED = "2026-04-24";

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
