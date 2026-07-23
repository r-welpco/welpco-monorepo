"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { HeroVideoMedia } from "./hero-video-media";
import { HeroImmersiveFloatingNav } from "./hero-immersive-floating-nav";
import {
  IMMERSIVE_HEADLINE_FONT_CSS,
  immersiveHeadlineItalicFont,
} from "./immersive-hero-fonts";
import {
  IMMERSIVE_SHELL_INLINE,
  IMMERSIVE_SHELL_LOGO_PAD_PX,
  IMMERSIVE_SHELL_WIDTH,
} from "./immersive-shell";
import { syncPublicRouteLocale } from "@/lib/i18n/sync-public-route-locale";
import { Link as LocaleLink } from "@/i18n/navigation";

const HERO_TYPO = {
  headlineFont: "body" as const,
  headlineWeight: 400,
  subheadWeight: 420,
};

export function HeroImmersive() {
  const t = useTranslations("marketing.home.hero");
  const locale = useLocale();
  const headlineFamily = IMMERSIVE_HEADLINE_FONT_CSS[HERO_TYPO.headlineFont];
  const accentLineFont = immersiveHeadlineItalicFont(HERO_TYPO.headlineFont);

  const immersiveShellVars = {
    "--immersive-shell-w": IMMERSIVE_SHELL_WIDTH,
    "--immersive-shell-x": IMMERSIVE_SHELL_INLINE,
    "--immersive-shell-logo-pad": `${IMMERSIVE_SHELL_LOGO_PAD_PX}px`,
  } as CSSProperties;

  return (
    <section
      data-hero="immersive"
      style={{
        ...immersiveShellVars,
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        isolation: "isolate",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "112px 24px 56px 0",
        marginBottom: 48,
      }}
    >
      <HeroImmersiveFloatingNav headlineFontCss={headlineFamily} />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          background: "var(--evergreen)",
          pointerEvents: "none",
        }}
      >
        <HeroVideoMedia />
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(0,25,18,0.55) 0%, rgba(0,25,18,0.15) 38%, rgba(0,25,18,0.35) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 820,
          marginLeft: "calc(var(--immersive-shell-x) + var(--immersive-shell-logo-pad))",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 24,
        }}
      >
        <h1
          style={{
            color: "var(--cream)",
            fontFamily: headlineFamily,
            fontSize: "clamp(36px, 5.5vw, 64px)",
            lineHeight: 1.05,
            margin: 0,
            fontWeight: HERO_TYPO.headlineWeight,
          }}
        >
          {t("line1")}
          <br />
          <span
            style={{
              color: "var(--accent-soft)",
              fontFamily: accentLineFont,
              fontStyle: "italic",
            }}
          >
            {t("line2")}
          </span>
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-body)",
            fontSize: "clamp(16px, 2vw, 19px)",
            lineHeight: 1.55,
            color: "rgba(250,241,229,0.88)",
            maxWidth: 560,
            fontWeight: HERO_TYPO.subheadWeight,
          }}
        >
          {t("subhead")}
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
            maxWidth: 320,
            marginTop: 8,
          }}
        >
          <Link
            href="/search"
            className="btn btn-accent"
            style={{ justifyContent: "center", padding: "14px 22px" }}
            onClick={() => syncPublicRouteLocale(locale)}
          >
            {t("findHelp")} <span aria-hidden="true">→</span>
          </Link>
          <LocaleLink
            href="/register"
            className="btn"
            style={{
              justifyContent: "center",
              padding: "14px 22px",
              background: "var(--mustard)",
              color: "var(--evergreen)",
              border: "none",
              fontWeight: 600,
            }}
          >
            {t("becomeWelper")}
          </LocaleLink>
        </div>
      </div>
    </section>
  );
}
