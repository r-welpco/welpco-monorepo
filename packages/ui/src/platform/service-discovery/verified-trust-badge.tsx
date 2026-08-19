"use client";

import { Badge } from "@welpco/ui/badge";
import { Tooltip } from "@welpco/ui/tooltip";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Check, ShieldCheck, X } from "lucide-react";

const PASSED_LABEL = "Background check passed";
const NOT_PASSED_LABEL = "No verification badge";

export interface VerifiedTrustBadgeProps {
  /** Badge size — `1` for compact cards, `2` for full profile cards. */
  size?: "1" | "2";
  /**
   * True only when the BFF explicitly returns `verified: true`
   * (background_check_status is Passed). False/undefined shows the grey
   * not-passed treatment — never infer a pass.
   */
  passed?: boolean;
  passedLabel?: string;
  notPassedLabel?: string;
}

/**
 * Background-check trust signal. One chip holding the shield and its verdict:
 * green shield + check when passed, muted grey shield + x when not. Both
 * states share a shape so the hue and the mark carry the whole difference.
 */
export function VerifiedTrustBadge({
  size = "2",
  passed = false,
  passedLabel = PASSED_LABEL,
  notPassedLabel = NOT_PASSED_LABEL,
}: VerifiedTrustBadgeProps) {
  const iconSize = size === "1" ? 14 : 16;
  const label = passed ? passedLabel : notPassedLabel;
  const StatusIcon = passed ? Check : X;

  return (
    <Tooltip content={label}>
      <Badge
        color={passed ? SEMANTIC_COLOR.success : SEMANTIC_COLOR.neutral}
        variant="soft"
        highContrast={passed}
        size={size}
        aria-label={label}
        style={{ cursor: "default" }}
      >
        <ShieldCheck size={iconSize} aria-hidden="true" strokeWidth={2.25} />
        <StatusIcon size={iconSize} aria-hidden="true" strokeWidth={2.5} />
      </Badge>
    </Tooltip>
  );
}

VerifiedTrustBadge.displayName = "VerifiedTrustBadge";
