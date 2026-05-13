"use client";

import { useCallback, useEffect, useState } from "react";
import { VideoBackground } from "@/components/features/marketing/shared/video-background";
import {
  HeroVideoTreatment,
  HERO_VIDEO_TREATMENT,
  type HeroVideoTreatmentValues,
} from "./hero-video-treatment";

const TREATMENT_STORAGE_KEY = "welpco-hero-video-treatment";

function clampTreatment(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

function loadTreatment(): HeroVideoTreatmentValues {
  if (typeof window === "undefined") return HERO_VIDEO_TREATMENT;
  try {
    const raw = localStorage.getItem(TREATMENT_STORAGE_KEY);
    if (!raw) return HERO_VIDEO_TREATMENT;
    const p = JSON.parse(raw) as Partial<HeroVideoTreatmentValues>;
    return {
      blurPx: clampTreatment(p.blurPx, 0, 24, HERO_VIDEO_TREATMENT.blurPx),
      darken: clampTreatment(p.darken, 0, 0.95, HERO_VIDEO_TREATMENT.darken),
      grain: clampTreatment(p.grain, 0, 1, HERO_VIDEO_TREATMENT.grain),
    };
  } catch {
    return HERO_VIDEO_TREATMENT;
  }
}

function treatmentToTsSnippet(t: HeroVideoTreatmentValues): string {
  return `blurPx: ${t.blurPx},\n  darken: ${t.darken},\n  grain: ${t.grain},`;
}

/**
 * Shared hero video stack: striped fallback + `<video>` + film treatment.
 * Used by `HeroImmersive` (full-bleed) and `VideoFrame` (fixed aspect + chrome).
 *
 * In development, or when the URL contains `heroVideoTuning=1`, a fixed panel
 * lets you tune blur / darken / grain; values persist in localStorage. Use
 * “Copy TS” to paste defaults into `HERO_VIDEO_TREATMENT` in `hero-video-treatment.tsx`.
 */
export function HeroVideoMedia() {
  const [treatment, setTreatment] = useState<HeroVideoTreatmentValues>(HERO_VIDEO_TREATMENT);
  const [tuningOpen, setTuningOpen] = useState(false);
  const [showTuningUi, setShowTuningUi] = useState(false);

  useEffect(() => {
    setTreatment(loadTreatment());
  }, []);

  useEffect(() => {
    localStorage.setItem(TREATMENT_STORAGE_KEY, JSON.stringify(treatment));
  }, [treatment]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setShowTuningUi(true);
      return;
    }
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    setShowTuningUi(q.has("heroVideoTuning"));
  }, []);

  const copyTs = useCallback(async () => {
    const text = treatmentToTsSnippet(treatment);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }, [treatment]);

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
      <VideoBackground videoUrl="/hero-background.mp4" preload="auto" />
      <HeroVideoTreatment values={treatment} />

      {showTuningUi ? (
        <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 100 }}>
          <button
            type="button"
            onClick={() => setTuningOpen((o) => !o)}
            aria-expanded={tuningOpen}
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
            Video look
          </button>
          {tuningOpen ? (
            <div
              role="dialog"
              aria-label="Hero video blur, darken, and grain"
              style={{
                position: "absolute",
                bottom: "100%",
                right: 0,
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
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 10,
                  lineHeight: 1.45,
                  color: "rgba(0,73,47,0.75)",
                }}
              >
                Sliders update live; values persist in localStorage. On production builds this panel is hidden
                unless the URL includes <code style={{ fontSize: 9 }}>?heroVideoTuning=1</code>.
              </p>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--evergreen)",
                  marginBottom: 6,
                }}
              >
                Blur ({treatment.blurPx}px)
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={treatment.blurPx}
                  onChange={(e) =>
                    setTreatment((t) => ({ ...t, blurPx: Number(e.target.value) }))
                  }
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
                Darken ({treatment.darken.toFixed(2)})
                <input
                  type="range"
                  min={0}
                  max={0.95}
                  step={0.01}
                  value={treatment.darken}
                  onChange={(e) =>
                    setTreatment((t) => ({ ...t, darken: Number(e.target.value) }))
                  }
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
                Grain ({treatment.grain.toFixed(2)})
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={treatment.grain}
                  onChange={(e) =>
                    setTreatment((t) => ({ ...t, grain: Number(e.target.value) }))
                  }
                  style={{ width: "100%", marginTop: 6, accentColor: "var(--evergreen)" }}
                />
              </label>
              <button
                type="button"
                onClick={copyTs}
                style={{
                  marginTop: 12,
                  width: "100%",
                  padding: "8px",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "1px solid rgba(0,73,47,0.15)",
                  background: "var(--evergreen)",
                  color: "var(--cream)",
                  cursor: "pointer",
                }}
              >
                Copy TS for HERO_VIDEO_TREATMENT
              </button>
              <button
                type="button"
                onClick={() => {
                  setTreatment(HERO_VIDEO_TREATMENT);
                  localStorage.removeItem(TREATMENT_STORAGE_KEY);
                }}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "8px",
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid rgba(0,73,47,0.15)",
                  background: "#f4f4f2",
                  cursor: "pointer",
                }}
              >
                Reset to shipped defaults
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
