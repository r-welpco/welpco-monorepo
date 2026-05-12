"use client";

import { Badge } from "@welpco/ui/badge";

export type JobStatus =
  | "draft"
  | "open"
  | "reviewing"
  | "shortlisted"
  | "interviewing"
  | "offer"
  | "filled"
  | "cancelled";

const token: Record<
  JobStatus,
  { color: "gray" | "blue" | "amber" | "green" | "red"; label: string }
> = {
  draft: { color: "gray", label: "Draft" },
  open: { color: "blue", label: "Open" },
  reviewing: { color: "amber", label: "Reviewing" },
  shortlisted: { color: "blue", label: "Shortlisted" },
  interviewing: { color: "blue", label: "Interviewing" },
  offer: { color: "green", label: "Offer" },
  filled: { color: "green", label: "Filled" },
  cancelled: { color: "red", label: "Cancelled" },
};

export interface JobStatusBadgeProps {
  status: JobStatus;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const statusToken = token[status];
  if (!statusToken) {
    return null;
  }
  const { color, label } = statusToken;
  return (
    <Badge color={color} variant="soft" highContrast>
      {label}
    </Badge>
  );
}

