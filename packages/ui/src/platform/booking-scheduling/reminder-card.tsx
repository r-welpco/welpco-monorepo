"use client";

import { Card } from "@welpco/ui/card";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

export interface ReminderCardProps {
  title: string;
  scheduledFor: string;
  location?: string;
  notes?: string;
  warning?: string;
  onView?: () => void;
  onReschedule?: () => void;
  onDismiss?: () => void;
}

export function ReminderCard({
  title,
  scheduledFor,
  location,
  notes,
  warning,
  onView,
  onReschedule,
  onDismiss,
}: ReminderCardProps) {
  return (
    <Card size="3" variant="surface" style={{ width: "100%" }}>
      <Flex direction="column" gap="3">
        <Box>
          <Heading size="4" trim="start" mb="1">
            {title}
          </Heading>
          <Text size="2" color="gray" highContrast>
            {scheduledFor}
            {location ? ` \u00B7 ${location}` : ""}
          </Text>
        </Box>

        {notes && (
          <Text size="2" color="gray" highContrast>
            {notes}
          </Text>
        )}

        {warning && (
          <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface">
            <Callout.Text>{warning}</Callout.Text>
          </Callout.Root>
        )}

        {(onView || onReschedule || onDismiss) && (
          <Flex gap="2" justify="end" wrap="wrap">
            {onDismiss && (
              <Button onClick={onDismiss} variant="ghost" color="gray" size="2">
                Dismiss
              </Button>
            )}
            {onReschedule && (
              <Button onClick={onReschedule} variant="ghost" color="gray" size="2">
                Reschedule
              </Button>
            )}
            {onView && (
              <Button onClick={onView} variant="solid" color={SEMANTIC_COLOR.primary} size="2">
                View booking
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

