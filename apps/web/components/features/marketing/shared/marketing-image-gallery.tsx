import { MarketingImage } from "./marketing-image";
import styles from "./marketing-image-gallery.module.css";

export type MarketingGalleryItem = {
  src: string;
  alt: string;
  ratio: string;
  sizes?: string;
};

export type MarketingImageGalleryLayout = "welper-collage" | "stacked-feature";

/** Uniform frame for mobile swipe so every slide matches. */
const MOBILE_SLIDE_RATIO = "4 / 3";

interface MarketingImageGalleryProps {
  items: [MarketingGalleryItem, MarketingGalleryItem, MarketingGalleryItem];
  layout: MarketingImageGalleryLayout;
  /** Accessible name for the swipe region on mobile */
  ariaLabel: string;
  /** Shown under the track on mobile (e.g. “Swipe to explore”) */
  swipeHint?: string;
}

function GallerySlide({
  item,
  ratio,
  className,
}: {
  item: MarketingGalleryItem;
  ratio?: string;
  className?: string;
}) {
  return (
    <div className={[styles.slide, className].filter(Boolean).join(" ")}>
      <MarketingImage
        src={item.src}
        alt={item.alt}
        ratio={ratio ?? item.ratio}
        radius="var(--radius-md)"
        sizes={item.sizes ?? "(max-width: 767px) 82vw, 50vw"}
      />
    </div>
  );
}

/**
 * Three marketing photos: editorial layout on desktop, horizontal scroll-snap on mobile.
 */
export function MarketingImageGallery({
  items,
  layout,
  ariaLabel,
  swipeHint = "Swipe to see more",
}: MarketingImageGalleryProps) {
  return (
    <div className={styles.root}>
      <div
        className={styles.desktop}
        data-layout={layout}
        data-marketing-image-gallery-desktop
      >
        {items.map((item) => (
          <GallerySlide key={item.src} item={item} />
        ))}
      </div>

      <div className={styles.mobile}>
        <div
          className={styles.mobileTrack}
          data-marketing-image-gallery
          role="region"
          aria-label={ariaLabel}
        >
          {items.map((item) => (
            <GallerySlide
              key={`mobile-${item.src}`}
              item={item}
              ratio={MOBILE_SLIDE_RATIO}
              className={styles.mobileSlide}
            />
          ))}
        </div>
        {swipeHint ? (
          <p className={styles.hint} aria-hidden="true">
            {swipeHint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
