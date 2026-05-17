import type { CSSProperties, ReactNode } from "react";
import styles from "./marketing-swipe-row.module.css";

interface MarketingSwipeRowProps {
  children: ReactNode;
  /** Inline grid styles for desktop (≥1025px); flex swipe applies below 1024px via CSS */
  style?: CSSProperties;
  className?: string;
  ariaLabel: string;
  swipeHint?: string;
}

/**
 * Card row that becomes a horizontal scroll-snap strip on tablet and mobile.
 */
export function MarketingSwipeRow({
  children,
  style,
  className,
  ariaLabel,
  swipeHint,
}: MarketingSwipeRowProps) {
  return (
    <div>
      <div
        data-swipe-row
        data-marketing-swipe-row
        role="region"
        aria-label={ariaLabel}
        className={[styles.swipeRow, className].filter(Boolean).join(" ")}
        style={style}
      >
        {children}
      </div>
      {swipeHint ? (
        <p className={styles.hint} aria-hidden="true">
          {swipeHint}
        </p>
      ) : null}
    </div>
  );
}
