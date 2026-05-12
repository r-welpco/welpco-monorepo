"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  /** Root margin (e.g. "0px 0px -80px 0px" to trigger when 80px from bottom of viewport) */
  rootMargin?: string;
  /** Threshold 0–1; element is "in view" when this fraction is visible */
  threshold?: number;
  /** Run once (stop observing after visible) or keep observing */
  once?: boolean;
}

/**
 * Returns a ref to attach to an element and whether that element is in view.
 * Use with CSS classes like .reveal-in and .is-visible for scroll-triggered animation.
 */
export function useInView(options: UseInViewOptions = {}) {
  const { rootMargin = "0px 0px -60px 0px", threshold = 0.1, once = true } = options;
  const ref = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once && el) {
            el.classList.add("is-visible");
          }
        } else if (!once) {
          setIsInView(false);
          el.classList.remove("is-visible");
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  // Apply class on state change (for once: true we add is-visible when isInView becomes true)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isInView) el.classList.add("is-visible");
  }, [isInView]);

  return { ref, isInView };
}
