"use client";

import { Badge } from "@welpco/ui/badge";
import { Tooltip } from "@welpco/ui/tooltip";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { ShieldCheck } from "lucide-react";

const TOOLTIP_LABEL = "Background check passed";

export interface VerifiedTrustBadgeProps {
  /** Badge size — `1` for compact cards, `2` for full profile cards. */
  size?: "1" | "2";
}

/**
 * Background-check trust signal (bible §20.1). Icon only; hover shows
 * "Background check passed". Render only when the BFF explicitly returns
 * `verified: true` — never default or infer.
 */
export function VerifiedTrustBadge({ size = "2" }: VerifiedTrustBadgeProps) {
  const iconSize = size === "1" ? 14 : 16;

  return (
    <Tooltip content={TOOLTIP_LABEL}>
      <Badge
        color={SEMANTIC_COLOR.success}
        variant="soft"
        highContrast
        size={size}
        aria-label={TOOLTIP_LABEL}
        style={{ cursor: "default", paddingInline: size === "1" ? "4px" : "6px" }}
      >
        <ShieldCheck size={iconSize} aria-hidden="true" />
      </Badge>
    </Tooltip>
  );
}

VerifiedTrustBadge.displayName = "VerifiedTrustBadge";
