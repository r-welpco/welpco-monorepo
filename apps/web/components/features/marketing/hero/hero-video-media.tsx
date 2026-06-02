"use client";

import { VideoBackground } from "@/components/features/marketing/shared/video-background";
import { HeroVideoTreatment } from "./hero-video-treatment";

/**
 * Shared hero video stack: striped fallback + `<video>` + film treatment.
 * Used by `HeroImmersive` (full-bleed) and `VideoFrame` (fixed aspect + chrome).
 */
export function HeroVideoMedia() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--evergreen)",
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0 18px, rgba(250,241,229,0.06) 18px 19px)",
        }}
      />
      <VideoBackground videoUrl="/hero-background.mp4" lazyLoad />
      <HeroVideoTreatment />
    </>
  );
}
