"use client";

import { Badge } from "@welpco/ui/badge";

export type JobStatus =
  | "published"
  | "applications_open"
  | "converted_to_booking"
  | "completed"
  | "expired"
  | "cancelled"
  | "draft"
  | "open"
  | "reviewing"
  | "shortlisted"
  | "interviewing"
  | "offer"
  | "filled";

const token: Record<
  JobStatus,
  { color: "gray" | "blue" | "amber" | "green" | "red"; label: string }
> = {
  published: { color: "blue", label: "Open" },
  applications_open: { color: "blue", label: "Applications open" },
  converted_to_booking: { color: "green", label: "Booking sent" },
  completed: { color: "green", label: "Completed" },
  expired: { color: "gray", label: "Expired" },
  cancelled: { color: "red", label: "Cancelled" },
  draft: { color: "gray", label: "Draft" },
  open: { color: "blue", label: "Open" },
  reviewing: { color: "amber", label: "Reviewing" },
  shortlisted: { color: "blue", label: "Shortlisted" },
  interviewing: { color: "blue", label: "Interviewing" },
  offer: { color: "green", label: "Offer" },
  filled: { color: "green", label: "Filled" },
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
    <Badge color={color} variant="soft" radius="full" highContrast>
      <span
        aria-hidden
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "9999px",
          backgroundColor: `var(--${color}-9)`,
        }}
      />
      {label}
    </Badge>
  );
}
