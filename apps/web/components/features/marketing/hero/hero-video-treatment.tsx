"use client";

/** Fixed hero video look — blur, darken, grain (marketing only). */
export type HeroVideoTreatmentValues = {
  blurPx: number;
  darken: number;
  grain: number;
};

export const HERO_VIDEO_TREATMENT: HeroVideoTreatmentValues = {
  blurPx: 10,
  darken: 0.3,
  grain: 0.50,
};

const GRAIN_FILTER_ID = "welpcoHeroGrainFilter";

/**
 * Absolute overlays on the hero media stack: blur → darken → grain.
 * Does not include any tuning UI.
 */
export function HeroVideoTreatment() {
  const v = HERO_VIDEO_TREATMENT;

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
              <filter id={GRAIN_FILTER_ID} x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" result="n" />
                <feColorMatrix in="n" type="saturate" values="0" result="g" />
              </filter>
            </defs>
            <rect width="100%" height="100%" filter={`url(#${GRAIN_FILTER_ID})`} fill="rgba(128,128,128,0.5)" />
          </svg>
        </div>
      ) : null}
    </>
  );
}
