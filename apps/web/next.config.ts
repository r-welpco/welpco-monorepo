import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";
/** Dev/preview: @vercel/analytics and @vercel/speed-insights load debug scripts from here (prod uses `/_vercel/*` on same origin). */
const VERCEL_ANALYTICS_SCRIPT_ORIGIN = "https://va.vercel-scripts.com";
const VERCEL_ANALYTICS_CONNECT_ORIGIN = "https://vitals.vercel-insights.com";

function cspOriginFromUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return undefined;
  try {
    return new URL(rawUrl).origin;
  } catch {
    return undefined;
  }
}

function cspSources(...sources: Array<string | undefined>): string {
  return [...new Set(sources.filter(Boolean))].join(" ");
}

const ZOHO_SALESIQ_SCRIPT_ORIGIN = cspOriginFromUrl(
  process.env.NEXT_PUBLIC_ZOHO_SALESIQ_SCRIPT_SRC,
);

const ZOHO_SALESIQ_SCRIPT_SOURCES = cspSources(
  ZOHO_SALESIQ_SCRIPT_ORIGIN,
  "https://salesiq.zohopublic.ca",
  "https://js.zohocdn.com",
  "https://static.zohocdn.com",
);

const ZOHO_SALESIQ_STYLE_SOURCES = cspSources(
  "https://css.zohocdn.com",
  "https://static.zohocdn.com",
);
const ZOHO_SALESIQ_FONT_SOURCES = cspSources(
  "https://css.zohocdn.com",
  "https://static.zohocdn.com",
);
const ZOHO_SALESIQ_IMAGE_SOURCES = cspSources(
  "https://ca1-files.zohopublic.ca",
  "https://css.zohocdn.com",
  "https://js.zohocdn.com",
  "https://salesiq.zohopublic.ca",
  "https://salesiq.zohocloud.ca",
  "https://static.zohocdn.com",
);
const ZOHO_SALESIQ_CONNECT_SOURCES = cspSources(
  "https://ca1-files.zohopublic.ca",
  "https://salesiq.zohopublic.ca",
  "https://salesiq.zohocloud.ca",
  "wss://salesiq.zohopublic.ca",
  "wss://salesiq.zohocloud.ca",
);
const ZOHO_SALESIQ_FRAME_SOURCES = cspSources(
  "https://salesiq.zohopublic.ca",
  "https://salesiq.zohocloud.ca",
);

const nextConfig: NextConfig = {
  turbopack: {
    // Monorepo root so Next.js uses pnpm-lock.yaml and avoids multiple-lockfile warning
    root: path.join(__dirname, "..", ".."),
  },
  experimental: {
    // The persistent cache has grown beyond 9 GB locally and causes Turbopack
    // to saturate CPU and memory while loading and compacting old SST files.
    turbopackFileSystemCacheForDev: false,
  },
  cacheComponents: true,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/offline.html",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), payment=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com ${TURNSTILE_ORIGIN} ${VERCEL_ANALYTICS_SCRIPT_ORIGIN} ${ZOHO_SALESIQ_SCRIPT_SOURCES}`,
              `style-src 'self' 'unsafe-inline' ${ZOHO_SALESIQ_STYLE_SOURCES}`,
              `img-src 'self' data: blob: https://*.amazonaws.com ${ZOHO_SALESIQ_IMAGE_SOURCES}`,
              `font-src 'self' ${ZOHO_SALESIQ_FONT_SOURCES}`,
              "manifest-src 'self'",
              "worker-src 'self'",
              "connect-src 'self' https://api.stripe.com https://*.amazonaws.com " +
                `${TURNSTILE_ORIGIN} ${VERCEL_ANALYTICS_CONNECT_ORIGIN} ` +
                `${ZOHO_SALESIQ_CONNECT_SOURCES} ` +
                (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"),
              `frame-src 'self' https://js.stripe.com https://hooks.stripe.com ${TURNSTILE_ORIGIN} ${ZOHO_SALESIQ_FRAME_SOURCES}`,
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
