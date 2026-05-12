"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import { HeroVideoMedia } from "./hero-video-media";
import { HeroImmersiveFloatingNav } from "./hero-immersive-floating-nav";
import {
  IMMERSIVE_HEADLINE_FONT_CSS,
  IMMERSIVE_HEADLINE_FONT_LABEL,
  immersiveHeadlineItalicFont,
  isImmersiveHeadlineFont,
  type ImmersiveHeroHeadlineFont,
} from "./immersive-hero-fonts";
import {
  IMMERSIVE_SHELL_INLINE,
  IMMERSIVE_SHELL_LOGO_PAD_PX,
  IMMERSIVE_SHELL_WIDTH,
} from "./immersive-shell";

const STAT_BUBBLES = [
  { label: "Neighborhoods", value: "240+" },
  { label: "Welpers", value: "Growing" },
  { label: "Avg. rating", value: "4.9" },
];

const TYPO_STORAGE_KEY = "welpco-immersive-hero-typography";

export type ImmersiveHeroTypography = {
  headlineFont: ImmersiveHeroHeadlineFont;
  headlineWeight: number;
  subheadWeight: number;
};

const TYPO_DEFAULT: ImmersiveHeroTypography = {
  headlineFont: "display",
  headlineWeight: 400,
  subheadWeight: 420,
};

const FONT_OPTION_ORDER: ImmersiveHeroHeadlineFont[] = [
  "display",
  "body",
  "mono",
  "plusJakarta",
  "uncutSans",
];

const FONT_OPTIONS = FONT_OPTION_ORDER.map((id) => ({
  id,
  label: IMMERSIVE_HEADLINE_FONT_LABEL[id],
}));

function loadTypography(): ImmersiveHeroTypography {
  if (typeof window === "undefined") return TYPO_DEFAULT;
  try {
    const raw = localStorage.getItem(TYPO_STORAGE_KEY);
    if (!raw) return TYPO_DEFAULT;
    const p = JSON.parse(raw) as Partial<ImmersiveHeroTypography>;
    const headlineFont = isImmersiveHeadlineFont(p.headlineFont) ? p.headlineFont : TYPO_DEFAULT.headlineFont;
    const headlineWeight = clamp(p.headlineWeight, 300, 700, TYPO_DEFAULT.headlineWeight);
    const subheadWeight = clamp(p.subheadWeight, 400, 600, TYPO_DEFAULT.subheadWeight);
    return { headlineFont, headlineWeight, subheadWeight };
  } catch {
    return TYPO_DEFAULT;
  }
}

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

/**
 * Full-viewport hero with floating pill nav, edge-to-edge video, and type tuning.
 */
export function HeroImmersive() {
  const [typography, setTypography] = useState<ImmersiveHeroTypography>(TYPO_DEFAULT);
  const [typePanelOpen, setTypePanelOpen] = useState(false);

  useEffect(() => {
    setTypography(loadTypography());
  }, []);

  useEffect(() => {
    localStorage.setItem(TYPO_STORAGE_KEY, JSON.stringify(typography));
  }, [typography]);

  const headlineFamily = IMMERSIVE_HEADLINE_FONT_CSS[typography.headlineFont];
  const accentLineFont = immersiveHeadlineItalicFont(typography.headlineFont);
  const accentLineUsesDisplayItalic = typography.headlineFont === "display";

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
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          background: "var(--evergreen)",
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
            fontWeight: typography.headlineWeight,
          }}
        >
          Local help.
          <br />
          <span
            className={accentLineUsesDisplayItalic ? "display-italic" : undefined}
            style={{
              color: "var(--accent-soft)",
              fontFamily: accentLineFont,
              fontStyle: accentLineUsesDisplayItalic ? undefined : typography.headlineFont === "plusJakarta" ? "normal" : "italic",
            }}
          >
            Real neighbors.
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
            fontWeight: typography.subheadWeight,
          }}
        >
          Connect with trusted Welpers in your community — childcare, lawn care, tutoring, tech help, and more.
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
          <Link href="/search" className="btn btn-accent" style={{ justifyContent: "center", padding: "14px 22px" }}>
            Find help <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/welper/onboarding"
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
            Become a Welper
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            gap: 12,
            marginTop: 32,
          }}
        >
          {STAT_BUBBLES.map((s) => (
            <div
              key={s.label}
              style={{
                padding: "14px 20px",
                borderRadius: 16,
                background: "rgba(250,241,229,0.14)",
                border: "1px solid rgba(250,241,229,0.22)",
                backdropFilter: "blur(10px)",
                minWidth: 120,
              }}
            >
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--cream)", lineHeight: 1 }}>
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(250,241,229,0.65)",
                  marginTop: 6,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ImmersiveTypePanel
        open={typePanelOpen}
        onToggle={() => setTypePanelOpen((o) => !o)}
        typography={typography}
        setTypography={setTypography}
      />
    </section>
  );
}

function ImmersiveTypePanel({
  open,
  onToggle,
  typography,
  setTypography,
}: {
  open: boolean;
  onToggle: () => void;
  typography: ImmersiveHeroTypography;
  setTypography: Dispatch<SetStateAction<ImmersiveHeroTypography>>;
}) {
  return (
    <div style={{ position: "fixed", left: 16, bottom: 16, zIndex: 99 }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(0,73,47,0.15)",
          background: "rgba(255,255,255,0.95)",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--evergreen)",
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        }}
      >
        Hero type
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Immersive hero typography"
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: 8,
            width: 300,
            maxWidth: "calc(100vw - 32px)",
            padding: 14,
            borderRadius: 12,
            background: "rgba(255,255,255,0.98)",
            border: "1px solid rgba(0,73,47,0.12)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.14)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: "var(--evergreen)" }}>
            Headline font
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={typography.headlineFont === opt.id}
                onClick={() => setTypography((t) => ({ ...t, headlineFont: opt.id }))}
                style={{
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid rgba(0,73,47,0.15)",
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: typography.headlineFont === opt.id ? "var(--evergreen)" : "#fff",
                  color: typography.headlineFont === opt.id ? "var(--cream)" : "var(--evergreen)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--evergreen)", marginBottom: 6 }}>
            Headline weight ({typography.headlineWeight})
            <input
              type="range"
              min={300}
              max={700}
              step={50}
              value={typography.headlineWeight}
              onChange={(e) => setTypography((t) => ({ ...t, headlineWeight: Number(e.target.value) }))}
              style={{ width: "100%", marginTop: 6, accentColor: "var(--evergreen)" }}
            />
          </label>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--evergreen)",
              marginTop: 12,
              marginBottom: 6,
            }}
          >
            Subhead weight ({typography.subheadWeight})
            <input
              type="range"
              min={400}
              max={600}
              step={20}
              value={typography.subheadWeight}
              onChange={(e) => setTypography((t) => ({ ...t, subheadWeight: Number(e.target.value) }))}
              style={{ width: "100%", marginTop: 6, accentColor: "var(--evergreen)" }}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setTypography(TYPO_DEFAULT);
              localStorage.removeItem(TYPO_STORAGE_KEY);
            }}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "8px",
              fontSize: 11,
              borderRadius: 8,
              border: "1px solid rgba(0,73,47,0.15)",
              background: "#f4f4f2",
              cursor: "pointer",
            }}
          >
            Reset type
          </button>
        </div>
      ) : null}
    </div>
  );
}
