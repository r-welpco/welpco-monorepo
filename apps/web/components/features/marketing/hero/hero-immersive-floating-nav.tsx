"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";
import { Link, usePathname } from "@/i18n/navigation";
import { isMarketingNavActive } from "@/i18n/path-utils";
import { useSearchDestination } from "@/lib/hooks/use-search-destination";
import { syncPublicRouteLocale } from "@/lib/i18n/sync-public-route-locale";
import { MarketingLogo } from "../shared/marketing-logo";
import {
  MARKETING_NAV_KEY_BY_HREF,
  MARKETING_PRIMARY_NAV_HREFS,
} from "../shared/marketing-nav-links";
import { LanguageSwitcher } from "../shared/language-switcher";
import { IMMERSIVE_SHELL_LOGO_PAD_PX } from "./immersive-shell";

export function HeroImmersiveFloatingNav({ headlineFontCss }: { headlineFontCss: string }) {
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = useTranslations("marketing");
  const tNav = useTranslations("marketing.nav");
  const searchHref = useSearchDestination();

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
    <>
      <header
        data-hero-immersive-nav
        style={{
          position: "absolute",
          top: 20,
          left: "var(--immersive-shell-x)",
          zIndex: 5,
          width: "var(--immersive-shell-w)",
          padding: `10px 14px 10px ${IMMERSIVE_SHELL_LOGO_PAD_PX}px`,
          borderRadius: 9999,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(0,73,47,0.1)",
          boxShadow: "0 12px 40px rgba(0,25,18,0.15)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontFamily: headlineFontCss,
          fontWeight: 700,
        }}
      >
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }} aria-label={t("a11y.home")}>
          <MarketingLogo height={32} />
        </Link>

        <nav
          aria-label={t("a11y.primaryNav")}
          data-immersive-desktop-links
          style={{
            flex: 1,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            minWidth: 0,
          }}
        >
          {MARKETING_PRIMARY_NAV_HREFS.map((href) => {
            const active = isMarketingNavActive(pathname, href);
            const key = MARKETING_NAV_KEY_BY_HREF[href];
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  color: active ? "var(--evergreen)" : "rgba(0,73,47,0.55)",
                  background: active ? "rgba(0,73,47,0.08)" : "transparent",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {tNav(key)}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div data-immersive-header-lang>
            <LanguageSwitcher />
          </div>
          <Link
            href="/login"
            data-immersive-header-cta
            className="btn btn-ghost"
            style={{
              padding: "8px 14px",
              fontSize: 13,
              borderColor: "rgba(0,73,47,0.2)",
              fontWeight: 700,
              fontFamily: headlineFontCss,
            }}
          >
            {tNav("signIn")}
          </Link>
          <NextLink
            href={searchHref}
            data-immersive-header-cta
            className="btn btn-primary"
            style={{ padding: "8px 16px", fontSize: 13, fontWeight: 700, fontFamily: headlineFontCss }}
            onClick={() => syncPublicRouteLocale(locale)}
          >
            {tNav("findHelp")}
            <span aria-hidden="true" style={{ display: "inline-block", transform: "translateY(-1px)" }}>
              →
            </span>
          </NextLink>
          <button
            type="button"
            data-immersive-burger
            aria-expanded={drawerOpen}
            aria-controls="welpco-immersive-mobile-nav"
            aria-label={drawerOpen ? t("a11y.closeMenu") : t("a11y.openMenu")}
            onClick={() => setDrawerOpen((o) => !o)}
            style={{
              alignItems: "center",
              justifyContent: "center",
              width: 42,
              height: 42,
              borderRadius: 999,
              border: "1px solid rgba(0,73,47,0.2)",
              background: "transparent",
              color: "var(--evergreen)",
              cursor: "pointer",
            }}
          >
            {drawerOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div
          id="welpco-immersive-mobile-nav"
          data-immersive-mobile-drawer
          role="dialog"
          aria-modal="true"
          aria-label={t("a11y.mobileNav")}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(15,33,26,0.45)",
            display: "flex",
            justifyContent: "flex-end",
            padding: 12,
            animation: "welpco-fade 160ms ease-out both",
          }}
        >
          <div
            data-immersive-mobile-panel
            style={{
              width: "min(360px, 100%)",
              background: "var(--card)",
              borderRadius: 20,
              padding: 20,
              boxShadow: "var(--shadow-md)",
              animation: "welpco-slide 200ms ease-out both",
              fontFamily: headlineFontCss,
              fontWeight: 700,
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                    style={{
                      display: "block",
                      padding: "14px 12px",
                      fontSize: 18,
                      fontFamily: headlineFontCss,
                      fontWeight: 700,
                      color: "var(--fg)",
                      textDecoration: "none",
                      borderRadius: 12,
                      background: active ? "var(--pill-bg)" : undefined,
                    }}
                  >
                    {tNav(key)}
                  </Link>
                );
              })}
            </nav>
            <div data-immersive-mobile-lang style={{ marginTop: 16 }}>
              <LanguageSwitcher />
            </div>
            <div
              data-immersive-mobile-cta-row
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}
            >
              <Link
                href="/login"
                className="btn btn-ghost"
                style={{ justifyContent: "center", fontSize: 14, fontWeight: 700, fontFamily: headlineFontCss }}
                onClick={() => setDrawerOpen(false)}
              >
                {tNav("signIn")}
              </Link>
              <NextLink
                href={searchHref}
                className="btn btn-primary"
                style={{ justifyContent: "center", fontSize: 14, fontWeight: 700, fontFamily: headlineFontCss }}
                onClick={() => {
                  syncPublicRouteLocale(locale);
                  setDrawerOpen(false);
                }}
              >
                {tNav("findHelp")}
              </NextLink>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
