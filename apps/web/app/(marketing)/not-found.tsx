import type { Metadata } from "next";
import Link from "next/link";

/**
 * Marketing-scoped 404 page.
 *
 * Lives inside the (marketing) route group so it inherits the layout's
 * TopNav + Footer chrome and the bundle's `welpco` token scope. The
 * not-found.tsx file at the route-group level catches any unmatched path
 * inside the marketing tree (e.g. `/foo`, `/about/typo`).
 */

export const metadata: Metadata = {
  title: "Not found",
  description: "We couldn’t find that page. Try the homepage or contact support.",
  robots: { index: false, follow: false },
};

export default function MarketingNotFound() {
  return (
    <section className="section">
      <div
        className="container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          maxWidth: 720,
          gap: 28,
        }}
      >
        <div className="eyebrow" aria-hidden="true">
          — 404
        </div>
        <h1>
          That page <span className="display-italic">isn’t here.</span>
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "var(--fg-muted)",
            lineHeight: 1.6,
            maxWidth: 520,
          }}
        >
          The link may be broken or the page may have moved. Try the homepage, browse categories, or
          reach out — we’ll point you the right way.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary">
            Back to home
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            Contact support
          </Link>
        </div>
      </div>
    </section>
  );
}
