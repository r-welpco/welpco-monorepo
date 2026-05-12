"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { MarketingLogo } from "./marketing-logo";
import { MARKETING_PRIMARY_NAV_LINKS } from "./marketing-nav-links";

/**
 * Sticky marketing bar for **subpages only** (`/faq`, `/about`, …). The homepage
 * uses `HeroImmersive` floating nav — this component is not mounted on `/`
 * (see `MarketingTopNavGate`).
 *
 * Bundle deviation: the bundle uses `window.dispatchEvent` to swap artboards
 * inside the design canvas. We have a real router, so links use `next/link`
 * and active state is computed via `usePathname()`.
 *
 * Day 9 production-ready additions:
 *   - Hamburger drawer for ≤ 1024px (the bundle had no mobile nav).
 *   - Hamburger reveal/hide rules live in `app/(marketing)/responsive.css`
 *     (`[data-topnav-burger]` shows ≤ 1024, the desktop link list hides at the
 *     same breakpoint), so the inline-styled bundle stays unchanged on
 *     desktop.
 *   - `aria-label` on the primary `<nav>` and `aria-current` on active links.
 */

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function TopNav() {
  const pathname = usePathname() ?? "/";
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Drawer closes via per-link `onClick` handlers below. We don't watch
  // pathname here because that pattern triggers
  // `react-hooks/set-state-in-effect` in our lint config.

  // Lock body scroll while the drawer is open + close on Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <header
      data-marketing-top-nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "color-mix(in oklab, var(--bg) 88%, transparent)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        className="container"
        style={{
          height: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }} aria-label="Welpco — home">
          <MarketingLogo height={46} />
        </Link>

        <nav
          aria-label="Primary"
          data-topnav-links
          style={{ display: "flex", gap: 6, alignItems: "center" }}
        >
          {MARKETING_PRIMARY_NAV_LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                data-topnav-link
                aria-current={active ? "page" : undefined}
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? "var(--fg)" : "var(--fg-muted)",
                  background: active ? "var(--pill-bg)" : "transparent",
                  textDecoration: "none",
                  transition: "all 120ms ease",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            href="/auth/signin"
            data-topnav-cta-secondary
            className="btn btn-ghost"
            style={{ padding: "10px 18px", fontSize: 14 }}
          >
            Sign in
          </Link>
          <Link
            href="/search"
            className="btn btn-primary"
            style={{ padding: "10px 18px", fontSize: 14 }}
          >
            Find help
            <span aria-hidden="true" style={{ display: "inline-block", transform: "translateY(-1px)" }}>
              →
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen((o) => !o)}
            data-topnav-burger
            aria-expanded={drawerOpen}
            aria-controls="welpco-mobile-nav"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 999,
              border: "1px solid var(--line-strong)",
              background: "transparent",
              color: "var(--fg)",
              cursor: "pointer",
            }}
          >
            {drawerOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div
          id="welpco-mobile-nav"
          data-mobile-drawer
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
          onClick={(e) => {
            // Click on the dim backdrop (not the panel) closes the drawer.
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
        >
          <div data-mobile-panel>
            <nav aria-label="Mobile">
              {MARKETING_PRIMARY_NAV_LINKS.map((l) => {
                const active = isActive(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div data-mobile-cta-row>
              <Link
                href="/auth/signin"
                className="btn btn-ghost"
                style={{ justifyContent: "center", fontSize: 14, padding: "12px 16px" }}
                onClick={() => setDrawerOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/search"
                className="btn btn-primary"
                style={{ justifyContent: "center", fontSize: 14, padding: "12px 16px" }}
                onClick={() => setDrawerOpen(false)}
              >
                Find help
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
