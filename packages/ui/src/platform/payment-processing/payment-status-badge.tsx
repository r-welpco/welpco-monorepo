"use client";

import { Badge } from "@welpco/ui/badge";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "succeeded"
  | "failed"
  | "refunded"
  | "canceled";

const token: Record<
  PaymentStatus,
  { color: "gray" | "blue" | "green" | "red" | "amber"; label: string }
> = {
  pending: { color: "amber", label: "Pending" },
  authorized: { color: "blue", label: "Authorized" },
  succeeded: { color: "green", label: "Succeeded" },
  failed: { color: "red", label: "Failed" },
  refunded: { color: "gray", label: "Refunded" },
  canceled: { color: "red", label: "Canceled" },
};

export interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const { color, label } = token[status];
  return (
    <Badge color={color} variant="soft" highContrast>
      {label}
    </Badge>
  );
}

