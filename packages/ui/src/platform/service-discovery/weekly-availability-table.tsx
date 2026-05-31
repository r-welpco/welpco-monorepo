"use client";

import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import {
  formatDaySlots,
  type WeeklyAvailabilityDisplayLabels,
  type WeeklyAvailabilitySummary,
} from "./weekly-availability-utils";

export interface WeeklyAvailabilityTableProps {
  availability: WeeklyAvailabilitySummary;
  labels: WeeklyAvailabilityDisplayLabels;
  locale?: string;
}

/**
 * Full-week availability table for booking — all days and hours at a glance.
 */
export function WeeklyAvailabilityTable({
  availability,
  labels,
  locale = "en",
}: WeeklyAvailabilityTableProps) {
  if (availability.adHocOnly) {
    return (
      <Flex direction="column" gap="1">
        <Text size="1" weight="medium" color="gray" highContrast>
          {labels.label}
        </Text>
        <Text size="2" color="gray" highContrast>
          {labels.adHocOnly}
        </Text>
      </Flex>
    );
  }

  const schedule = availability.schedule ?? [];

  return (
    <Box style={{ width: "100%", minWidth: 0 }}>
      <Text size="1" weight="medium" color="gray" highContrast mb="2" as="div">
        {labels.label}
      </Text>
      <Box
        style={{
          border: "1px solid var(--gray-a6)",
          borderRadius: "var(--radius-3)",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "var(--font-size-2)",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "var(--gray-a2)" }}>
              <th
                scope="col"
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  fontWeight: 600,
                  color: "var(--gray-11)",
                  width: "38%",
                }}
              >
                {labels.dayColumn}
              </th>
              <th
                scope="col"
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  fontWeight: 600,
                  color: "var(--gray-11)",
                }}
              >
                {labels.hoursColumn}
              </th>
            </tr>
          </thead>
          <tbody>
            {labels.dayNames.map((dayName, index) => {
              const slots = schedule[index]?.slots ?? [];
              const hasSlots = slots.length > 0;
              return (
                <tr
                  key={dayName}
                  style={{
                    borderTop: "1px solid var(--gray-a4)",
                    backgroundColor: hasSlots ? "transparent" : "var(--gray-a1)",
                  }}
                >
                  <th
                    scope="row"
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      fontWeight: 500,
                      color: hasSlots ? "var(--gray-12)" : "var(--gray-9)",
                      verticalAlign: "top",
                    }}
                  >
                    {dayName}
                  </th>
                  <td
                    style={{
                      padding: "8px 12px",
                      color: hasSlots ? "var(--gray-12)" : "var(--gray-9)",
                      verticalAlign: "top",
                    }}
                  >
                    {hasSlots ? formatDaySlots(slots, locale) : labels.unavailable}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}

WeeklyAvailabilityTable.displayName = "WeeklyAvailabilityTable";
