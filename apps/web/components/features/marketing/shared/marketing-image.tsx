import type { CSSProperties } from "react";
import Image from "next/image";

interface MarketingImageProps {
  src: string;
  alt: string;
  /** CSS `aspect-ratio` value, e.g. `4 / 3` or `1 / 1` */
  ratio: string;
  radius?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Full-width photo block for marketing sections — `object-fit: cover` inside a rounded frame.
 */
export function MarketingImage({
  src,
  alt,
  ratio,
  radius = "var(--radius-md)",
  sizes = "(max-width: 900px) 100vw, 50vw",
  priority,
  className,
  style,
}: MarketingImageProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: ratio,
        borderRadius: radius,
        overflow: "hidden",
        ...style,
      }}
    >
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: "cover" }} />
    </div>
  );
}
