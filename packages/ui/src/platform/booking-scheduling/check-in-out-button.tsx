"use client";

import { Button } from "@welpco/ui/button";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { BookingStatus } from "./booking-status-badge";

export interface CheckInOutButtonProps {
  status: BookingStatus;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
}

export function CheckInOutButton({
  status,
  onCheckIn,
  onCheckOut,
}: CheckInOutButtonProps) {
  if (status === "in-progress") {
    return (
      <Button variant="solid" color={SEMANTIC_COLOR.primary} highContrast onClick={onCheckOut}>
        Check out
      </Button>
    );
  }

  if (status === "accepted") {
    return (
      <Button variant="solid" color={SEMANTIC_COLOR.info} highContrast onClick={onCheckIn}>
        Check in
      </Button>
    );
  }

  return (
    <Button variant="soft" color="gray" highContrast disabled>
      {status === "completed" ? "Completed" : "Not ready"}
    </Button>
  );
}

