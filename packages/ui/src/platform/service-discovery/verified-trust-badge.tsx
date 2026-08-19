"use client";

import { Badge } from "@welpco/ui/badge";
import { Tooltip } from "@welpco/ui/tooltip";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Check, ShieldCheck, X } from "lucide-react";

const PASSED_LABEL = "Background check passed";
const NOT_PASSED_LABEL = "No background check";

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
 * Background-check trust signal. Shield badge plus a status mark: green
 * check when passed, light-grey x when not.
 */
export function VerifiedTrustBadge({
  size = "2",
  passed = false,
  passedLabel = PASSED_LABEL,
  notPassedLabel = NOT_PASSED_LABEL,
}: VerifiedTrustBadgeProps) {
  const iconSize = size === "1" ? 16 : 18;
  const statusIconSize = size === "1" ? 14 : 16;
  const label = passed ? passedLabel : notPassedLabel;
  const StatusIcon = passed ? Check : X;

  return (
    <Tooltip content={label}>
      <span
        aria-label={label}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-1)",
          cursor: "default",
        }}
      >
        <Badge
          color={passed ? SEMANTIC_COLOR.success : SEMANTIC_COLOR.neutral}
          variant={passed ? "solid" : "soft"}
          highContrast={passed}
          size={size}
          style={{
            paddingInline: size === "1" ? "var(--space-1)" : "var(--space-2)",
          }}
        >
          <ShieldCheck size={iconSize} aria-hidden="true" strokeWidth={2.25} />
        </Badge>
        <StatusIcon
          size={statusIconSize}
          aria-hidden="true"
          strokeWidth={2.5}
          style={{
            color: passed ? "var(--green-9)" : "var(--gray-8)",
            flexShrink: 0,
          }}
        />
      </span>
    </Tooltip>
  );
}

VerifiedTrustBadge.displayName = "VerifiedTrustBadge";
