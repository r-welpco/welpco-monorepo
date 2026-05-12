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
export function VideoBackground({ videoUrl, posterUrl, preload = "metadata" }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion
  );

  useLayoutEffect(() => {
    const node = videoRef.current;
    if (!node || reducedMotion) return;

    if (isRoughlyOnScreen(node)) tryPlay(node);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            tryPlay(node);
          } else {
            node.pause();
          }
        }
      },
      { threshold: [0, 0.05, 0.25, 0.5] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    function resumeIfVisible() {
      const node = videoRef.current;
      if (node && isRoughlyOnScreen(node)) tryPlay(node);
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
  }, [reducedMotion]);

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      {...(posterUrl ? { poster: posterUrl } : {})}
      muted
      loop
      playsInline
      preload={preload}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: reducedMotion ? "none" : "block",
      }}
    />
  );
}
