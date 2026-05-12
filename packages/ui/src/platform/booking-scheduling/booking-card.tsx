"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { BookingStatusBadge, BookingStatus } from "./booking-status-badge";
import { CheckInOutButton } from "./check-in-out-button";
import { Calendar, MapPin, DollarSign } from "lucide-react";

export interface BookingCardProps {
  serviceTitle: string;
  customerName: string;
  welperName: string;
  scheduledFor: string;
  location?: string;
  status: BookingStatus;
  totalAmount?: string;
  onView?: () => void;
  onCancel?: () => void;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
}

/**
 * Booking summary card used in lists and detail overviews. Canonical card
 * pattern (bible §6.1): title + status in the header row, inline metadata
 * (customer · welper), icon-led detail rows, right-aligned actions.
 */
export function BookingCard({
  serviceTitle,
  customerName,
  welperName,
  scheduledFor,
  location,
  status,
  totalAmount,
  onView,
  onCancel,
  onCheckIn,
  onCheckOut,
}: BookingCardProps) {
  const isCancellable =
    !!onCancel && status !== "cancelled" && status !== "completed";

  return (
    <Card size="3" variant="surface" style={{ width: "100%" }}>
      <Flex direction="column" gap="3">
        {/* Header: title + status */}
        <Flex justify="between" align="start" gap="3">
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Heading size="4" mb="1" trim="start">
              {serviceTitle}
            </Heading>
            <Text size="2" color="gray" highContrast>
              {customerName} · {welperName}
            </Text>
          </Box>
          <Box flexShrink="0">
            <BookingStatusBadge status={status} />
          </Box>
        </Flex>

        {/* Detail rows — icon + value */}
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <Calendar
              size={16}
              aria-hidden="true"
              style={{ color: "var(--gray-10)", flexShrink: 0 }}
            />
            <Text size="2">{scheduledFor}</Text>
          </Flex>
          {location && (
            <Flex align="center" gap="2">
              <MapPin
                size={16}
                aria-hidden="true"
                style={{ color: "var(--gray-10)", flexShrink: 0 }}
              />
              <Text size="2">{location}</Text>
            </Flex>
          )}
          {totalAmount && (
            <Flex align="center" gap="2">
              <DollarSign
                size={16}
                aria-hidden="true"
                style={{ color: "var(--gray-10)", flexShrink: 0 }}
              />
              <Text size="2" weight="bold">
                {totalAmount}
              </Text>
            </Flex>
          )}
        </Flex>

        {/* Actions — right-aligned, secondary → destructive → primary */}
        {(onView || isCancellable || onCheckIn || onCheckOut) && (
          <Flex gap="2" justify="end" wrap="wrap">
            {onView && (
              <Button onClick={onView} variant="soft" color="gray" size="2">
                View details
              </Button>
            )}
            {isCancellable && (
              <Button
                onClick={onCancel}
                color={SEMANTIC_COLOR.danger}
                variant="ghost"
                size="2"
              >
                Cancel
              </Button>
            )}
            <CheckInOutButton
              status={status}
              onCheckIn={onCheckIn}
              onCheckOut={onCheckOut}
            />
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

BookingCard.displayName = "BookingCard";
