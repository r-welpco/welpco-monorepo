"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "./section-header";
import styles from "./testimonials.module.css";

/**
 * Testimonials — a horizontal scroll-snap rail of real quotes supplied by
 * Welpco. Names were not provided, so the people pictured are identified only
 * by their relationship to the platform ("Client" / "Welper").
 *
 * The rail (rather than a grid) keeps four long quotes to one band of the page
 * and matches the scroller already used by {@link WelpersNearYou}.
 */

const PORTRAITS = [
  "/marketing/testimonial-client-neighborhood.jpg",
  "/marketing/testimonial-client-professional.jpg",
  "/marketing/testimonial-welper-flexible.png",
  "/marketing/testimonial-client-fast.png",
] as const;

/** Keep in sync with the rail `gap` in `testimonials.module.css`. */
const CARD_GAP = 20;

interface Testimonial {
  quote: string;
  role: string;
  imageAlt: string;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Testimonials() {
  const t = useTranslations("marketing.home.testimonials");
  const items = t.raw("items") as Testimonial[];

  const railRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  // Card width comes from a clamp(), so measure it rather than assume it.
  const scrollByCards = useCallback((direction: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.firstElementChild;
    const step = card
      ? card.getBoundingClientRect().width + CARD_GAP
      : el.clientWidth * 0.8;
    el.scrollBy({
      left: direction * step,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  return (
    <section className="section" aria-labelledby="testimonials-title">
      <div className="container">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={
            <span id="testimonials-title">
              {t("titleLine1")}{" "}
              <span className="display-italic">{t("titleLine2")}</span>
            </span>
          }
          subtitle={t("subtitle")}
          cta={
            <div className={styles.controls}>
              <button
                type="button"
                className={styles.arrow}
                onClick={() => scrollByCards(-1)}
                disabled={!canPrev}
                aria-label={t("prevAria")}
              >
                <ChevronLeft aria-hidden width={20} height={20} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                className={styles.arrow}
                onClick={() => scrollByCards(1)}
                disabled={!canNext}
                aria-label={t("nextAria")}
              >
                <ChevronRight aria-hidden width={20} height={20} strokeWidth={1.75} />
              </button>
            </div>
          }
        />

        <div
          ref={railRef}
          className={styles.rail}
          role="region"
          aria-label={t("railLabel")}
          tabIndex={0}
        >
          {items.map((item, index) => (
            <figure key={item.quote} className={styles.card}>
              <span aria-hidden="true" className={styles.mark}>
                &ldquo;
              </span>
              <blockquote className={styles.quote}>{item.quote}</blockquote>
              <figcaption className={styles.byline}>
                <Image
                  src={PORTRAITS[index] ?? PORTRAITS[0]}
                  alt={item.imageAlt}
                  width={48}
                  height={48}
                  sizes="48px"
                  className={styles.portrait}
                />
                <span className={styles.role}>{item.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
