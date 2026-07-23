"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchServices } from "@/lib/hooks/use-service-discovery";
import { useSearchDestination } from "@/lib/hooks/use-search-destination";
import { useCategoryDisplayName } from "@/lib/i18n/category-display-name";
import { syncPublicRouteLocale } from "@/lib/i18n/sync-public-route-locale";
import { maskCustomerWelperName } from "@/lib/display-name";
import type { SearchResultItem } from "@/types";
import { SectionHeader } from "./section-header";
import styles from "./welpers-near-you.module.css";

/**
 * WelpersNearYou — real platform social proof on the marketing homepage.
 *
 * A horizontal scroll-snap rail of actual Welper profiles from the public
 * search endpoint (`GET /api/search/services`, unauthenticated), defaulting
 * to the launch region (`NEXT_PUBLIC_DEFAULT_SEARCH_POSTAL`). This replaces
 * fabricated testimonial content — every card is a live profile that links
 * to `/welper/[id]`.
 *
 * HONESTY THRESHOLD: with the default region, the section renders NOTHING
 * (returns null) while loading, on error, or with fewer than
 * {@link MIN_RESULTS} results — no skeletons, no fake padding cards. Once a
 * visitor personalizes with their own postal code, we show whatever real
 * results exist (even 1–3 — real data is honest data) or a quiet empty note;
 * the section never vanishes mid-interaction.
 *
 * Links go to the non-localized public routes (`/search`, `/welper/[id]`)
 * via plain `next/link`. Those routes read `NEXT_LOCALE` (cookie / geo) —
 * sync the marketing locale onto the cookie before navigating so FR sticks.
 */

const DEFAULT_POSTAL = (process.env.NEXT_PUBLIC_DEFAULT_SEARCH_POSTAL ?? "").trim() || "H2X 1Y4";
/** Postal disambiguation only (matches `/search`'s convention). */
const DEFAULT_COUNTRY_CODE =
  (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE ?? "").trim() || "CA";
const LIMIT = 8;
const MIN_RESULTS = 4;
const CARD_WIDTH = 300;
const CARD_GAP = 18;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function formatRate(rate: number): string {
  return Number.isInteger(rate) ? String(rate) : rate.toFixed(2);
}

export function WelpersNearYou() {
  const t = useTranslations("marketing.home.nearYou");
  const locale = useLocale();

  // null → default launch region; string → visitor-typed postal code.
  const [activePostal, setActivePostal] = useState<string | null>(null);
  const [postalInput, setPostalInput] = useState("");

  const postalCode = activePostal ?? DEFAULT_POSTAL;

  const params = useMemo(
    () => ({
      postalCode,
      countryCode: DEFAULT_COUNTRY_CODE,
      page: 1,
      limit: LIMIT,
      sort: "relevance" as const,
    }),
    [postalCode],
  );

  const { data, isLoading, isFetching, isError } = useSearchServices(params);
  const items: SearchResultItem[] = useMemo(() => data?.items ?? [], [data?.items]);

  // --- Rail scrolling (desktop arrows) ---
  // Initial position: scrolled to the end so the "See all" card sits on the
  // right, flush with the page container. Visitors browse welpers by scrolling left.
  const railRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scrollRailToEnd = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth - el.clientWidth;
    updateArrows();
  }, [updateArrows]);

  useLayoutEffect(() => {
    scrollRailToEnd();
  }, [scrollRailToEnd, items.length, postalCode]);

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
  }, [updateArrows, items.length]);

  const scrollByCards = useCallback((direction: 1 | -1) => {
    railRef.current?.scrollBy({
      left: direction * (CARD_WIDTH + CARD_GAP) * 2,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  const handlePostalSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = postalInput.trim();
      setActivePostal(trimmed || null);
    },
    [postalInput],
  );

  const searchHref = useSearchDestination(
    `/search?postalCode=${encodeURIComponent(postalCode)}`,
  );
  const usingDefault = activePostal === null;

  // HONESTY THRESHOLD — default region: render nothing rather than a sparse,
  // stuck, or padded rail. No skeleton either (avoids a stuck-skeleton state;
  // the section simply appears once ≥4 real profiles are confirmed).
  if (usingDefault && (isLoading || isError || items.length < MIN_RESULTS)) {
    return null;
  }

  const showEmptyNote =
    !usingDefault && !isFetching && (isError || items.length === 0);

  return (
    <section className={`section ${styles.section}`} id="near-you">
      <div className="container">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={
            <>
              {t("titleLine1")}{" "}
              <span className="display-italic">{t("titleLine2")}</span>
            </>
          }
          subtitle={t("subtitle")}
          cta={
            <form className={styles.postalForm} onSubmit={handlePostalSubmit}>
              <label className={styles.postalLabel} htmlFor="near-you-postal">
                {t("postalLabel")}
              </label>
              <div className={styles.postalRow}>
                <input
                  id="near-you-postal"
                  className={styles.postalInput}
                  type="text"
                  value={postalInput}
                  onChange={(e) => setPostalInput(e.target.value)}
                  placeholder={t("postalPlaceholder")}
                  autoComplete="postal-code"
                  inputMode="text"
                  enterKeyHint="search"
                  maxLength={10}
                />
                <button type="submit" className="btn btn-ghost">
                  {t("postalSubmit")}
                </button>
              </div>
            </form>
          }
        />

        {showEmptyNote ? (
          <p className={styles.emptyNote}>
            {t("emptyForPostal")}{" "}
            <Link href={searchHref} onClick={() => syncPublicRouteLocale(locale)}>
              {t("browseAll")}
            </Link>
          </p>
        ) : (
          <div className={styles.railWrap}>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              onClick={() => scrollByCards(-1)}
              disabled={!canPrev}
              aria-label={t("prevAria")}
            >
              <ChevronLeft aria-hidden width={20} height={20} strokeWidth={1.75} />
            </button>

            <div
              ref={railRef}
              className={styles.rail}
              role="region"
              aria-label={t("railLabel")}
              aria-busy={isFetching}
              tabIndex={0}
            >
              {items.map((item) => (
                <WelperRailCard key={item.welperId} item={item} locale={locale} />
              ))}
              <Link
                href={searchHref}
                className={`${styles.card} ${styles.endCard}`}
                onClick={() => syncPublicRouteLocale(locale)}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 24,
                    lineHeight: 1.15,
                  }}
                >
                  {t("seeAll")}
                </span>
                <ArrowRight aria-hidden width={22} height={22} strokeWidth={1.75} />
              </Link>
            </div>

            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              onClick={() => scrollByCards(1)}
              disabled={!canNext}
              aria-label={t("nextAria")}
            >
              <ChevronRight aria-hidden width={20} height={20} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function WelperRailCard({
  item,
  locale,
}: {
  item: SearchResultItem;
  locale: string;
}) {
  const t = useTranslations("marketing.home.nearYou");
  const categoryDisplayName = useCategoryDisplayName();
  const name = maskCustomerWelperName(item.name);
  const rawCategory = item.categories?.[0] ?? item.title;
  const category = categoryDisplayName(rawCategory);
  const hasRating =
    typeof item.rating === "number" &&
    typeof item.reviewCount === "number" &&
    item.reviewCount > 0;

  return (
    <Link
      href={`/welper/${encodeURIComponent(item.welperId)}`}
      className={styles.card}
      onClick={() => syncPublicRouteLocale(locale)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {item.profilePhotoUrl ? (
          // Remote BFF-hosted profile photo — plain <img> like the platform cards.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.profilePhotoUrl}
            alt=""
            width={64}
            height={64}
            loading="lazy"
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              objectFit: "cover",
              flexShrink: 0,
              background: "var(--bg-soft)",
            }}
          />
        ) : (
          <div
            aria-hidden
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              flexShrink: 0,
              background: "var(--spring-soft)",
              color: "var(--evergreen)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontSize: 26,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              lineHeight: 1.1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </h3>
          <div
            style={{
              fontSize: 13,
              color: "var(--fg-muted)",
              marginTop: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {category}
          </div>
        </div>
      </div>

      {item.bioSnippet?.trim() ? (
        <p className={styles.bioPreview}>{item.bioSnippet.trim()}</p>
      ) : null}

      {/* Honest empty: the rating line is simply omitted below 1 review. */}
      {hasRating ? (
        <div
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}
          aria-label={t("ratingAria", {
            rating: (item.rating as number).toLocaleString(locale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }),
            count: item.reviewCount as number,
          })}
        >
          <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M6 1l1.5 3 3.5.5-2.5 2.4.6 3.4L6 8.6 2.9 10.3l.6-3.4L1 4.5 4.5 4z"
              fill="var(--accent)"
              stroke="var(--evergreen)"
              strokeWidth="0.6"
            />
          </svg>
          <span style={{ fontWeight: 600 }} aria-hidden>
            {(item.rating as number).toLocaleString(locale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
          <span style={{ color: "var(--fg-muted)" }} aria-hidden>
            {t("reviewCount", { count: item.reviewCount as number })}
          </span>
        </div>
      ) : null}

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--evergreen)",
            letterSpacing: "0.02em",
          }}
        >
          {t("fromRate", { rate: formatRate(item.hourlyRate) })}
        </span>
        {item.verified === true ? (
          <span
            className={styles.verifiedIcon}
            title={t("verified")}
            aria-label={t("verified")}
          >
            <ShieldCheck aria-hidden width={18} height={18} strokeWidth={2.25} />
          </span>
        ) : null}
      </div>
    </Link>
  );
}
