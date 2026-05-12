"use client";

import { HeroVideoMedia } from "./hero-video-media";

/**
 * VideoFrame — striped video chrome + corner mono ornament.
 *
 * Faithful port of `.design-reference/project/components/hero.jsx` `VideoFrame`,
 * with one substitution documented in `components/features/marketing/CLAUDE.md`:
 * the bundle's striped placeholder + green play button is replaced by the
 * existing `<VideoBackground>` (intersection-observer driven, reduced-motion
 * safe) playing `apps/web/public/hero-background.mp4`. The bundle's
 * bottom-left mono timestamp / file label is kept as design ornament.
 */

interface VideoFrameProps {
  ratio?: string;
  radius?: string | number;
}

export function VideoFrame({ ratio = "4 / 5", radius = "var(--radius-lg)" }: VideoFrameProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: ratio,
        borderRadius: radius,
        overflow: "hidden",
        background: "var(--evergreen)",
        /* Keep blur / grain / darken from compositing with hero copy outside this frame */
        isolation: "isolate",
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <HeroVideoMedia />
      </div>

      {/* Bottom-left timestamp / file label — design ornament from the bundle */}
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          zIndex: 10,
          display: "flex",
          gap: 8,
          alignItems: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(250,241,229,0.55)",
          mixBlendMode: "difference",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
