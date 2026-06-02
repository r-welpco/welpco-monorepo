"use client";

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";

interface VideoBackgroundProps {
  videoUrl: string;
  posterUrl?: string;
  /**
   * `"auto"` buffers more of the file so the hero shows motion quickly after
   * client navigations / bfcache; `"metadata"` is lighter when the clip is decorative.
   */
  preload?: "none" | "metadata" | "auto";
  /** Defer fetching the MP4 until the element is on-screen (recommended for full-viewport heroes). */
  lazyLoad?: boolean;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function getReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotion(): boolean {
  return false;
}

function tryPlay(node: HTMLVideoElement) {
  void node.play().catch(() => {
    // Autoplay blocked — evergreen / striped layers behind the video remain visible.
  });
}

function isRoughlyOnScreen(node: HTMLVideoElement): boolean {
  if (typeof window === "undefined") return false;
  const r = node.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

function prefersLightVideoLoad(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  const type = conn.effectiveType;
  return type === "slow-2g" || type === "2g";
}

function resolvePreload(
  preload: VideoBackgroundProps["preload"],
  lazyLoad: boolean,
): "none" | "metadata" | "auto" {
  if (lazyLoad || prefersLightVideoLoad()) return "none";
  return preload ?? "metadata";
}

function ensureVideoSrc(node: HTMLVideoElement, videoUrl: string) {
  if (node.getAttribute("src") === videoUrl) return;
  node.src = videoUrl;
  node.load();
}

/**
 * Background video player. Plays while the element is on-screen (IntersectionObserver).
 * With `prefers-reduced-motion`, the `<video>` is not shown so underlying layers
 * (e.g. hero stripes) stay visible. Optional `posterUrl` adds a `<video poster>` only
 * when provided — the marketing hero does not use a poster (video only).
 *
 * Mounted inside `HeroVideoMedia` (immersive hero and similar surfaces). The video element
 * itself is `aria-hidden` because the surrounding heading carries the
 * page's semantic title; the video is atmosphere.
 */
export function VideoBackground({
  videoUrl,
  posterUrl,
  preload = "metadata",
  lazyLoad = false,
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion
  );
  const effectivePreload = resolvePreload(preload, lazyLoad);

  useLayoutEffect(() => {
    const node = videoRef.current;
    if (!node || reducedMotion) return;

    function onVisible() {
      const current = videoRef.current;
      if (!current) return;
      if (lazyLoad) ensureVideoSrc(current, videoUrl);
      tryPlay(current);
    }

    if (isRoughlyOnScreen(node)) onVisible();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onVisible();
          } else {
            node.pause();
          }
        }
      },
      { threshold: [0, 0.05, 0.25, 0.5] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion, lazyLoad, videoUrl]);

  useEffect(() => {
    if (reducedMotion) return;

    function resumeIfVisible() {
      const node = videoRef.current;
      if (!node || !isRoughlyOnScreen(node)) return;
      if (lazyLoad) ensureVideoSrc(node, videoUrl);
      tryPlay(node);
    }

    function onPageShow() {
      resumeIfVisible();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") resumeIfVisible();
    }

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reducedMotion, lazyLoad, videoUrl]);

  return (
    <video
      ref={videoRef}
      {...(lazyLoad ? {} : { src: videoUrl })}
      {...(posterUrl ? { poster: posterUrl } : {})}
      muted
      loop
      playsInline
      preload={effectivePreload}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: reducedMotion ? "none" : "block",
        pointerEvents: "none",
      }}
    />
  );
}
