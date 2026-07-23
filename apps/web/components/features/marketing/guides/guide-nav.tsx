"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GuideNavItem } from "@/lib/guides/types";
import styles from "./guides.module.css";

/**
 * Guide in-page navigation — the sticky "On this page" sidebar (desktop),
 * the `<details>` "Contents" disclosure (mobile), and the overview rows that
 * double as a visual table of contents.
 *
 * All three share one anchor behaviour: smooth-scroll to the section, move
 * focus there (so keyboard/screen-reader users land where sighted users look),
 * and update the URL hash without a history entry. `prefers-reduced-motion`
 * downgrades the smooth scroll to an instant jump.
 *
 * The sidebar's active row is driven by an IntersectionObserver scroll-spy:
 * sections are observed against a band just under the sticky marketing header
 * (`-108px` top, `-62%` bottom), and the topmost section inside that band wins.
 * When no section is inside it (e.g. mid-way through a long section, or at the
 * very bottom of the page) we fall back to the last section that has already
 * scrolled past the band's top edge.
 */

/** Matches `scroll-margin-top` on `.section` — the sticky header (76px) + breathing room. */
const SCROLL_SPY_TOP_OFFSET = 108;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
  // Sections carry tabIndex={-1}, so this is a focus move, not a tab stop.
  target.focus({ preventScroll: true });
  window.history.replaceState(null, "", `#${id}`);
  return true;
}

function useSectionAnchor(onNavigate?: () => void) {
  return useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      // Let modified clicks (new tab/window) behave natively.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!scrollToSection(id)) return;
      event.preventDefault();
      onNavigate?.();
    },
    [onNavigate],
  );
}

/* ---------- Scroll-spy ---------- */

function useScrollSpy(items: GuideNavItem[]) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const ids = items.map((item) => item.id);
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;

    const inBand = new Set<string>();

    const resolveActive = () => {
      const topmost = ids.find((id) => inBand.has(id));
      if (topmost) {
        setActiveId(topmost);
        return;
      }
      // Nothing in the band: highlight the last section whose top has passed it.
      let passed = "";
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= SCROLL_SPY_TOP_OFFSET) passed = node.id;
      }
      setActiveId(passed || ids[0]);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        }
        resolveActive();
      },
      { rootMargin: `-${SCROLL_SPY_TOP_OFFSET}px 0px -62% 0px`, threshold: 0 },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [items]);

  return activeId;
}

/* ---------- Sticky sidebar (desktop) ---------- */

export function GuideSectionNav({
  items,
  label,
}: {
  items: GuideNavItem[];
  label: string;
}) {
  const activeId = useScrollSpy(items);
  const handleClick = useSectionAnchor();

  return (
    <nav className={styles.sideNav} aria-label={label}>
      <p className={styles.sideNavLabel}>{label}</p>
      <ul className={styles.sideNavList}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={isActive ? styles.sideNavLinkActive : styles.sideNavLink}
                aria-current={isActive ? "true" : undefined}
                onClick={(event) => handleClick(event, item.id)}
              >
                <span className={styles.sideNavNumeral}>{item.numeral}</span>
                <span className={styles.sideNavText}>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ---------- Contents disclosure (mobile) ---------- */

export function GuideMobileNav({
  items,
  label,
}: {
  items: GuideNavItem[];
  label: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const close = useCallback(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, []);
  const handleClick = useSectionAnchor(close);

  return (
    <details ref={detailsRef} className={styles.mobileNav}>
      <summary className={styles.mobileNavSummary}>
        <span>{label}</span>
        <span className={styles.mobileNavChevron} aria-hidden="true" />
      </summary>
      <ul className={styles.mobileNavList}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={styles.mobileNavLink}
              onClick={(event) => handleClick(event, item.id)}
            >
              <span className={styles.sideNavNumeral}>{item.numeral}</span>
              <span className={styles.sideNavText}>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* ---------- Overview rows (content column) ---------- */

export function GuideOverviewLinks({ items }: { items: GuideNavItem[] }) {
  const handleClick = useSectionAnchor();

  return (
    <ul className={styles.overviewList}>
      {items.map((item, index) => (
        <li key={`${item.id}-${index}`}>
          <a
            href={`#${item.id}`}
            className={styles.overviewLink}
            onClick={(event) => handleClick(event, item.id)}
          >
            <span className={styles.overviewNumeral}>{item.numeral}</span>
            <span className={styles.overviewLabel}>{item.label}</span>
            <span className={styles.overviewArrow} aria-hidden="true">
              →
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
