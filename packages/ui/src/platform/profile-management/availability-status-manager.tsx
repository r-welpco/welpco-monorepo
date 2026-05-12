"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Badge } from "@welpco/ui/badge";
import { Callout } from "@welpco/ui/callout";
import { RadioGroup } from "@welpco/ui/radio-group";
import { type TimeSlot } from "./time-slot-availability";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState } from "react";

export type AvailabilityStatus = "available" | "busy" | "unavailable";

export interface TimeSlotWithStatus extends TimeSlot {
  status: AvailabilityStatus;
}

export interface AvailabilityStatusManagerProps {
  timeSlots: TimeSlot[];
  defaultStatus?: AvailabilityStatus;
  loading?: boolean;
  onChange?: (slots: TimeSlotWithStatus[]) => void;
}

const STATUS_OPTIONS: Array<{ value: AvailabilityStatus; label: string; color: "green" | "red" | "gray"; icon: React.ReactNode }> = [
  {
    value: "available",
    label: "Available",
    color: "green",
    icon: <CheckCircle2 style={{ width: "16px", height: "16px" }} />,
  },
  {
    value: "busy",
    label: "Busy",
    color: "gray",
    icon: <Clock style={{ width: "16px", height: "16px" }} />,
  },
  {
    value: "unavailable",
    label: "Unavailable",
    color: "red",
    icon: <XCircle style={{ width: "16px", height: "16px" }} />,
  },
];

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function AvailabilityStatusManager({
  timeSlots,
  defaultStatus = "available",
  loading,
  onChange,
}: AvailabilityStatusManagerProps) {
  const [slotsWithStatus, setSlotsWithStatus] = useState<TimeSlotWithStatus[]>(
    timeSlots.map((slot) => ({
      ...slot,
      status: defaultStatus,
    }))
  );

  const handleStatusChange = (index: number, status: AvailabilityStatus) => {
    const updated = [...slotsWithStatus];
    updated[index] = {
      ...updated[index],
      status,
    };
    setSlotsWithStatus(updated);
    onChange?.(updated);
  };

  const handleBulkStatusChange = (status: AvailabilityStatus) => {
    const updated = slotsWithStatus.map((slot) => ({
      ...slot,
      status,
    }));
    setSlotsWithStatus(updated);
    onChange?.(updated);
  };

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK[dayOfWeek] || "Unknown";
  };

  const getStatusInfo = (status: AvailabilityStatus) => {
    return STATUS_OPTIONS.find((opt) => opt.value === status) || STATUS_OPTIONS[0];
  };

  if (timeSlots.length === 0) {
    return (
      <Card size="3" variant="surface" style={{ width: "100%", minWidth: 0 }}>
        <Callout.Root color="gray" variant="surface">
          <Callout.Text>
            No time slots defined. Add time slots first to manage availability status.
          </Callout.Text>
        </Callout.Root>
      </Card>
    );
  }

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "720px", minWidth: 0 }}
    >
      <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="4" mb="1">
            Availability status
          </Heading>
          <Text size="2" color="gray" highContrast>
            Set the availability status for each time slot.
          </Text>
        </Box>

        <Box>
          <Flex align="center" justify="between" mb="3">
            <Heading as="h3" size="3">
              Bulk actions
            </Heading>
            <Flex gap="2">
              {STATUS_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  size="2"
                  color={option.color}
                  onClick={() => handleBulkStatusChange(option.value)}
                  disabled={loading}
                >
                  <Flex align="center" gap="1">
                    {option.icon}
                    Set all {option.label}
                  </Flex>
                </Button>
              ))}
            </Flex>
          </Flex>
        </Box>

        <Flex direction="column" gap="3">
          {slotsWithStatus.map((slot, index) => {
            const statusInfo = getStatusInfo(slot.status);
            return (
              <Card key={index} size="2" variant="surface">
                <Flex align="center" justify="between" gap="4">
                  <Box style={{ flex: 1 }}>
                    <Flex align="center" gap="3">
                      <Text size="2" weight="bold" style={{ minWidth: "100px" }}>
                        {getDayLabel(slot.dayOfWeek)}
                      </Text>
                      <Text size="2" color="gray" highContrast>
                        {slot.startTime} - {slot.endTime}
                      </Text>
                      <Badge color={statusInfo.color} variant="soft" size="2">
                        <Flex align="center" gap="1">
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Flex>
                      </Badge>
                    </Flex>
                  </Box>

                  <RadioGroup.Root
                    value={slot.status}
                    onValueChange={(value) =>
                      handleStatusChange(index, value as AvailabilityStatus)
                    }
                    disabled={loading}
                  >
                    <Flex gap="3">
                      {STATUS_OPTIONS.map((option) => (
                        <Text key={option.value} as="label" size="2">
                          <Flex align="center" gap="3">
                            <RadioGroup.Item value={option.value} />
                            <Text size="1">{option.label}</Text>
                          </Flex>
                        </Text>
                      ))}
                    </Flex>
                  </RadioGroup.Root>
                </Flex>
              </Card>
            );
          })}
        </Flex>
      </Flex>
    </Card>
  );
}

