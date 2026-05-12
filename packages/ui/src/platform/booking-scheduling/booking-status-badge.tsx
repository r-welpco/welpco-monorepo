"use client";

import { Badge } from "@welpco/ui/badge";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "in-progress"
  | "completed"
  | "cancelled";

const colorMap: Record<BookingStatus, { color: "gray" | "green" | "amber" | "blue" | "red"; label: string }> = {
  pending: { color: "amber", label: "Pending" },
  accepted: { color: "green", label: "Accepted" },
  "in-progress": { color: "blue", label: "In progress" },
  completed: { color: "gray", label: "Completed" },
  cancelled: { color: "red", label: "Cancelled" },
};

export interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const token = colorMap[status];
  return (
    <Badge color={token.color} variant="soft" highContrast>
      {token.label}
    </Badge>
  );
}
