"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isMarketingNavActive } from "@/i18n/path-utils";
import { MarketingLogo } from "./marketing-logo";
import {
  MARKETING_NAV_KEY_BY_HREF,
  MARKETING_PRIMARY_NAV_HREFS,
} from "./marketing-nav-links";
import { LanguageSwitcher } from "./language-switcher";

export function TopNav() {
  const pathname = usePathname() ?? "/";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = useTranslations("marketing");
  const tNav = useTranslations("marketing.nav");

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
        <Link href="/" style={{ textDecoration: "none" }} aria-label={t("a11y.home")}>
          <MarketingLogo height={46} />
        </Link>

        <nav
          aria-label={t("a11y.primaryNav")}
          data-topnav-links
          style={{ display: "flex", gap: 6, alignItems: "center" }}
        >
          {MARKETING_PRIMARY_NAV_HREFS.map((href) => {
            const active = isMarketingNavActive(pathname, href);
            const key = MARKETING_NAV_KEY_BY_HREF[href];
            return (
              <Link
                key={href}
                href={href}
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
                {tNav(key)}
              </Link>
            );
          })}
        </nav>

        <div
          style={{ display: "flex", gap: 10, alignItems: "center" }}
        >
          <LanguageSwitcher />
          <Link
            href="/login"
            data-topnav-cta-secondary
            className="btn btn-ghost"
            style={{ padding: "10px 18px", fontSize: 14 }}
          >
            {tNav("signIn")}
          </Link>
          <Link
            href="/search"
            className="btn btn-primary"
            style={{ padding: "10px 18px", fontSize: 14 }}
          >
            {tNav("findHelp")}
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
            aria-label={drawerOpen ? t("a11y.closeMenu") : t("a11y.openMenu")}
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
          aria-label={t("a11y.mobileNav")}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
        >
          <div data-mobile-panel>
            <nav aria-label={t("a11y.mobileNav")}>
              {MARKETING_PRIMARY_NAV_HREFS.map((href) => {
                const active = isMarketingNavActive(pathname, href);
                const key = MARKETING_NAV_KEY_BY_HREF[href];
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {tNav(key)}
                  </Link>
                );
              })}
            </nav>
            <div data-mobile-cta-row>
              <LanguageSwitcher />
              <Link
                href="/login"
                className="btn btn-ghost"
                style={{ justifyContent: "center", fontSize: 14, padding: "12px 16px" }}
                onClick={() => setDrawerOpen(false)}
              >
                {tNav("signIn")}
              </Link>
              <Link
                href="/search"
                className="btn btn-primary"
                style={{ justifyContent: "center", fontSize: 14, padding: "12px 16px" }}
                onClick={() => setDrawerOpen(false)}
              >
                {tNav("findHelp")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
