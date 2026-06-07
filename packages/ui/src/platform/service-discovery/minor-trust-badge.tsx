"use client";

import { Badge } from "@welpco/ui/badge";
import { Tooltip } from "@welpco/ui/tooltip";

export interface MinorTrustBadgeProps {
  /** Badge size — `1` for compact cards, `2` for profile dialog. */
  size?: "1" | "2";
  /** Visible label (e.g. "Minor" / "Mineur"). */
  label?: string;
  /** Tooltip on hover. */
  tooltip?: string;
}

/**
 * Minor welper trust signal. Render only when the BFF explicitly returns
 * `isMinor: true` — never default or infer.
 */
export function MinorTrustBadge({
  size = "2",
  label = "Minor",
  tooltip = "Welper is under 18",
}: MinorTrustBadgeProps) {
  return (
    <Tooltip content={tooltip}>
      <Badge
        color="amber"
        variant="soft"
        highContrast
        size={size}
        aria-label={tooltip}
        style={{ cursor: "default" }}
      >
        {label}
      </Badge>
    </Tooltip>
  );
}

MinorTrustBadge.displayName = "MinorTrustBadge";
