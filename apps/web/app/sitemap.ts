import type { MetadataRoute } from "next";

/**
 * `sitemap.xml` for the public site.
 *
 * Core marketing routes include English (unprefixed) URLs with French
 * `/fr` alternates. Blog and legal stubs are English-only for now.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://welpco.com";

interface RouteEntry {
  path: string;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
}

const CORE_MARKETING_ROUTES: RouteEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
];

// Public guide pages — bilingual (EN + `/fr` alternates), like core marketing.
const GUIDE_ROUTES: RouteEntry[] = [
  { path: "/guides", changeFrequency: "monthly", priority: 0.7 },
  { path: "/guides/customer", changeFrequency: "monthly", priority: 0.7 },
  { path: "/guides/welper", changeFrequency: "monthly", priority: 0.7 },
];

const OTHER_ROUTES: RouteEntry[] = [
  // Public welper search — top-of-funnel entry (English-only, like /welper/[id]).
  { path: "/search", changeFrequency: "daily", priority: 0.9 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.5 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.3 },
];

const LEGAL_PRIVACY_ROUTE: RouteEntry = {
  path: "/legal/privacy",
  changeFrequency: "yearly",
  priority: 0.3,
};

const LAST_MODIFIED = "2026-04-24";

function localePath(path: string, locale: "en" | "fr"): string {
  if (locale === "fr") {
    return path === "/" ? "/fr" : `/fr${path}`;
  }
  return path;
}

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

function bilingualEntry(route: RouteEntry): MetadataRoute.Sitemap[number] {
  const enPath = localePath(route.path, "en");
  const frPath = localePath(route.path, "fr");

  return {
    url: absoluteUrl(enPath),
    lastModified: LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: {
        en: absoluteUrl(enPath),
        fr: absoluteUrl(frPath),
        "x-default": absoluteUrl(enPath),
      },
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const coreEntries: MetadataRoute.Sitemap = CORE_MARKETING_ROUTES.map(bilingualEntry);

  const guideEntries: MetadataRoute.Sitemap = GUIDE_ROUTES.map(bilingualEntry);

  const otherEntries: MetadataRoute.Sitemap = OTHER_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const privacyEntry: MetadataRoute.Sitemap[number] = {
    url: absoluteUrl(localePath(LEGAL_PRIVACY_ROUTE.path, "en")),
    lastModified: LAST_MODIFIED,
    changeFrequency: LEGAL_PRIVACY_ROUTE.changeFrequency,
    priority: LEGAL_PRIVACY_ROUTE.priority,
    alternates: {
      languages: {
        en: absoluteUrl(localePath(LEGAL_PRIVACY_ROUTE.path, "en")),
        fr: absoluteUrl(localePath(LEGAL_PRIVACY_ROUTE.path, "fr")),
        "x-default": absoluteUrl(localePath(LEGAL_PRIVACY_ROUTE.path, "en")),
      },
    },
  };

  return [...coreEntries, ...guideEntries, ...otherEntries, privacyEntry];
}
