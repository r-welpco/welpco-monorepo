"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WelpcoLogo } from "@welpco/ui/platform/layout";
import type { SelectedRole } from "@welpco/types";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/i18n/locale-routes";
import { EDU_SLIDE_FALLBACK_ICON, EDU_SLIDE_ICONS } from "./edu-slide-icons";
import { useEduCarousel } from "./use-edu-carousel";
import styles from "./register-edu-panel.module.css";

interface EduSlide {
  icon: string;
  title: string;
  body: string;
}

export interface RegisterEduPanelProps {
  /** Effective role — `null` before a pick shows the generic slide set. */
  role: SelectedRole | null;
  /**
   * `full` = desktop split column (auto-advance, waves, logo).
   * `compact` = slim mobile card above the wizard chrome (manual only —
   * never auto-advances).
   */
  variant: "full" | "compact";
  className?: string;
}

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Split-screen educational panel for the register flow. Slides distill the
 * official onboarding guides; the set swaps instantly with the (previewed or
 * committed) role. A11y follows the WAI-APG carousel pattern.
 */
export function RegisterEduPanel({
  role,
  variant,
  className,
}: RegisterEduPanelProps) {
  const t = useTranslations("auth.register.eduPanel");
  const locale = useLocale() as Locale;
  const setKey = role ?? "generic";
  const slides = t.raw(`sets.${setKey}`) as EduSlide[];
  const isFull = variant === "full";
  const carousel = useEduCarousel(slides.length, isFull, setKey);
  const { index, paused } = carousel;
  const liveMode: "off" | "polite" = paused ? "polite" : "off";

  const dots = (
    <div className={styles.dots}>
      {slides.map((_, i) => (
        <button
          key={i}
          type="button"
          className={cx(styles.dot, i === index && styles.dotActive)}
          aria-label={t("goToSlide", { index: i + 1 })}
          aria-current={i === index ? "true" : undefined}
          onClick={() => carousel.goTo(i)}
        />
      ))}
    </div>
  );

  const prevButton = (
    <button
      type="button"
      className={styles.navButton}
      aria-label={t("prev")}
      onClick={carousel.prev}
    >
      <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
    </button>
  );

  const nextButton = (
    <button
      type="button"
      className={styles.navButton}
      aria-label={t("next")}
      onClick={carousel.next}
    >
      <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
    </button>
  );

  const carouselInteractionProps = {
    onMouseEnter: () => carousel.setHovered(true),
    onMouseLeave: () => carousel.setHovered(false),
    onFocus: () => carousel.setFocusWithin(true),
    onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        carousel.setFocusWithin(false);
      }
    },
  };

  if (!isFull) {
    const slide = slides[index] ?? slides[0];
    const Icon = EDU_SLIDE_ICONS[slide.icon] ?? EDU_SLIDE_FALLBACK_ICON;
    return (
      <aside
        className={cx(styles.panel, styles.compact, className)}
        aria-label={t("ariaLabel")}
      >
        <div
          role="group"
          aria-roledescription="carousel"
          aria-label={t("ariaLabel")}
          className={styles.compactCarousel}
          {...carouselInteractionProps}
        >
          <span className={styles.compactChip} aria-hidden="true">
            <Icon size={22} strokeWidth={1.75} className={styles.icon} />
          </span>
          <div className={styles.compactMain} aria-live="polite">
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={t("slideOf", {
                current: index + 1,
                total: slides.length,
              })}
            >
              <h2 className={styles.compactTitle}>{slide.title}</h2>
              <p className={styles.compactBody}>{slide.body}</p>
            </div>
            {dots}
          </div>
          <div className={styles.compactNav}>
            {prevButton}
            {nextButton}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cx(styles.panel, styles.full, className)}
      aria-label={t("ariaLabel")}
    >
      {/* Decorative cream waves echoing the guide covers. */}
      <svg
        className={cx(styles.wave, styles.waveTop)}
        viewBox="0 0 600 300"
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="none"
      >
        <path
          d="M600 0 L600 96 C 470 168, 340 44, 210 92 C 120 126, 50 92, 0 22 L 0 0 Z"
          fill="currentColor"
        />
      </svg>
      <svg
        className={cx(styles.wave, styles.waveBottom)}
        viewBox="0 0 600 300"
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="none"
      >
        <path
          d="M0 210 C 120 120, 250 290, 390 190 C 490 122, 560 170, 600 220 L 600 300 L 0 300 Z"
          fill="currentColor"
        />
      </svg>

      <Link
        href={localizedPath("/", locale)}
        className={styles.logoLink}
        aria-label="Welpco"
      >
        <WelpcoLogo variant="cream" height={36} decorative />
      </Link>

      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={t("ariaLabel")}
        className={styles.carousel}
        {...carouselInteractionProps}
      >
        <div className={styles.slides} aria-live={liveMode}>
          {slides.map((slide, i) => {
            const Icon = EDU_SLIDE_ICONS[slide.icon] ?? EDU_SLIDE_FALLBACK_ICON;
            const isActive = i === index;
            return (
              <div
                key={`${setKey}-${i}`}
                className={cx(styles.slide, isActive && styles.slideActive)}
                role="group"
                aria-roledescription="slide"
                aria-label={t("slideOf", {
                  current: i + 1,
                  total: slides.length,
                })}
                aria-hidden={isActive ? undefined : true}
              >
                <span className={styles.iconChip} aria-hidden="true">
                  <Icon size={26} strokeWidth={1.75} className={styles.icon} />
                </span>
                <h2 className={styles.title}>{slide.title}</h2>
                <p className={styles.body}>{slide.body}</p>
              </div>
            );
          })}
        </div>
        <div className={styles.controls}>
          {prevButton}
          {dots}
          {nextButton}
        </div>
      </div>
    </aside>
  );
}
