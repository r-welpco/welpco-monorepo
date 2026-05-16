"use client";

import { useId, useMemo } from "react";

/** Fixed hero video look — blur, darken, grain (marketing only). */
export type HeroVideoTreatmentValues = {
  blurPx: number;
  darken: number;
  grain: number;
};

export const HERO_VIDEO_TREATMENT: HeroVideoTreatmentValues = {
  blurPx: 3,
  darken: 0.05,
  grain: 0.5,
};

export type HeroVideoTreatmentProps = {
  /** When omitted, uses {@link HERO_VIDEO_TREATMENT} (shipped defaults). */
  values?: HeroVideoTreatmentValues;
};

/**
 * Absolute overlays on the hero media stack: blur → darken → grain.
 */
export function HeroVideoTreatment({ values: vProp }: HeroVideoTreatmentProps) {
  const v = vProp ?? HERO_VIDEO_TREATMENT;
  const reactId = useId();
  const grainFilterId = useMemo(
    () => `welpcoHeroGrain-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [reactId],
  );

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backdropFilter: v.blurPx > 0 ? `blur(${v.blurPx}px)` : undefined,
          WebkitBackdropFilter: v.blurPx > 0 ? `blur(${v.blurPx}px)` : undefined,
          background: v.blurPx > 0 ? "rgba(255,255,255,0.02)" : undefined,
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background: `rgba(0,0,0,${v.darken})`,
        }}
      />

      {v.grain > 0 ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            pointerEvents: "none",
            opacity: v.grain,
            mixBlendMode: "overlay",
          }}
        >
          <svg width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block" }} aria-hidden>
            <defs>
              <filter id={grainFilterId} x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" result="n" />
                <feColorMatrix in="n" type="saturate" values="0" result="g" />
              </filter>
            </defs>
            <rect width="100%" height="100%" filter={`url(#${grainFilterId})`} fill="rgba(128,128,128,0.5)" />
          </svg>
        </div>
      ) : null}
    </>
  );
}
