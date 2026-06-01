import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

const nextConfig: NextConfig = {
  turbopack: {
    // Monorepo root so Next.js uses pnpm-lock.yaml and avoids multiple-lockfile warning
    root: path.join(__dirname, "..", ".."),
    resolveAlias: {
      "next-intl/config": "./i18n/request.ts",
    },
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
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com ${TURNSTILE_ORIGIN}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.amazonaws.com",
              "font-src 'self'",
              "manifest-src 'self'",
              "worker-src 'self'",
              "connect-src 'self' https://api.stripe.com https://*.amazonaws.com " +
                `${TURNSTILE_ORIGIN} ` +
                (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"),
              `frame-src 'self' https://js.stripe.com https://hooks.stripe.com ${TURNSTILE_ORIGIN}`,
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
