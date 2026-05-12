/**
 * Official Welpco imagotype for marketing chrome.
 * - Header: primary green mark on light backgrounds.
 * - Footer: cream-filled mark (`Primary_Reg_1`) for dark evergreen.
 */

const IMAGOTYPE_PRIMARY = "/logos/Welpco_Imagotype_Primary_Reg.svg";
const IMAGOTYPE_PRIMARY_FOOTER = "/logos/Welpco_Imagotype_Primary_Reg_1.svg";

/** viewBox 0 0 250 100 */
const ASPECT = 250 / 100;

export interface MarketingLogoProps {
  /** CSS pixel height; width follows 2.5:1 imagotype ratio */
  height?: number;
  /** `light` = green mark (nav); `footer` = cream mark on evergreen */
  variant?: "light" | "footer";
  className?: string;
}

export function MarketingLogo({ height = 32, variant = "light", className }: MarketingLogoProps) {
  const src = variant === "footer" ? IMAGOTYPE_PRIMARY_FOOTER : IMAGOTYPE_PRIMARY;
  const w = Math.round(height * ASPECT);

  return (
    <img
      className={className}
      src={src}
      alt="Welpco"
      width={w}
      height={height}
      decoding="async"
      style={{
        height,
        width: w,
        maxWidth: "100%",
        display: "block",
        objectFit: "contain",
      }}
    />
  );
}
