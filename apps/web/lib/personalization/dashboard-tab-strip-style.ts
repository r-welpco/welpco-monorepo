import type { CSSProperties } from "react";
import { getBackgroundById } from "@/lib/personalization/backgrounds";

/**
 * Tab nav strip background tinted from the dashboard Appearance background preset.
 */
export function getDashboardTabStripStyle(
  backgroundId: string,
  options?: { accentMixPercent?: number },
): CSSProperties {
  const { cssVariables } = getBackgroundById(backgroundId);
  const accent =
    cssVariables["--color-background-image-accent-1"] ??
    cssVariables["--color-background-image-accent-6"] ??
    "var(--gray-a7)";
  const mix = options?.accentMixPercent ?? 8;

  return {
    width: "100%",
    borderBottom: "1px solid var(--gray-4)",
    backgroundColor: `color-mix(in srgb, ${accent} ${mix}%, var(--color-background))`,
  };
}
