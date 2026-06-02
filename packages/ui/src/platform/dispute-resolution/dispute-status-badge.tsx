"use client";

import { Badge } from "@welpco/ui/badge";
import { SEMANTIC_COLOR, type SemanticColor } from "@welpco/ui/tokens";

/** Wave 2 (BFF): added `withdrawn` for participant-initiated withdrawal. */
export type DisputeStatus =
  | "open"
  | "in-review"
  | "resolved"
  | "closed"
  | "escalated"
  | "withdrawn";

/**
 * Status → semantic-token + label. Per bible §20.4, status badges use soft +
 * highContrast (never solid). All colors flow through SEMANTIC_COLOR — see
 * Day 2 decision 6 (no raw color="red|green|blue|amber" for meaning).
 *
 * Wave 2 (BFF): `withdrawn` reads as a neutral terminal state — the dispute
 * is closed, but it was the participant who closed it (not staff). Distinct
 * label from `closed` so the audit story stays legible at a glance.
 */
const statusMap: Record<DisputeStatus, { color: SemanticColor | "neutral"; label: string }> = {
  open: { color: "warning", label: "Open" },
  "in-review": { color: "info", label: "In review" },
  resolved: { color: "success", label: "Resolved" },
  closed: { color: "neutral", label: "Closed" },
  escalated: { color: "danger", label: "Escalated" },
  withdrawn: { color: "neutral", label: "Withdrawn" },
};

export interface DisputeStatusBadgeProps {
  status: DisputeStatus;
  /** When set, overrides the built-in English label (for i18n). */
  label?: string;
}

export function DisputeStatusBadge({ status, label }: DisputeStatusBadgeProps) {
  const token = statusMap[status];
  return (
    <Badge color={SEMANTIC_COLOR[token.color]} variant="soft" highContrast>
      {label ?? token.label}
    </Badge>
  );
}

