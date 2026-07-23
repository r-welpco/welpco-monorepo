"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const AUTO_ADVANCE_MS = 7000;

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

export interface EduCarousel {
  index: number;
  /**
   * True whenever auto-advance is not running (manual variant, hover,
   * focus-within, hidden tab, or reduced motion). Drives `aria-live`:
   * `"off"` while auto-advancing, `"polite"` when paused.
   */
  paused: boolean;
  reducedMotion: boolean;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  setHovered: (hovered: boolean) => void;
  setFocusWithin: (focusWithin: boolean) => void;
}

/**
 * Carousel engine for the register education panel.
 *
 * Auto-advances every 7s when `auto`, pausing while hovered, while focus is
 * inside the carousel, while the document is hidden (`visibilitychange`), and
 * under `prefers-reduced-motion` (same `useSyncExternalStore` + matchMedia
 * pattern as the marketing `VideoBackground`). Manual prev/next/dots always
 * work. `resetKey` (the active slide set, i.e. the role) snaps the carousel
 * back to slide 0 when it changes. The interval is cleared on unmount and on
 * every pause-path change via the effect cleanup.
 */
export function useEduCarousel(
  count: number,
  auto: boolean,
  resetKey: string,
): EduCarousel {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );

  // Role change → restart from the first slide.
  useEffect(() => {
    void resetKey;
    setIndex(0);
  }, [resetKey]);

  useEffect(() => {
    const onVisibilityChange = () =>
      setTabHidden(document.visibilityState === "hidden");
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const paused = !auto || hovered || focusWithin || tabHidden || reducedMotion;

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % count),
    [count],
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + count) % count),
    [count],
  );
  const goTo = useCallback(
    (i: number) => setIndex(((i % count) + count) % count),
    [count],
  );

  return {
    index,
    paused,
    reducedMotion,
    next,
    prev,
    goTo,
    setHovered,
    setFocusWithin,
  };
}
