"use client";

import { useEffect, useMemo, useState } from "react";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Separator } from "@welpco/ui/separator";
import { Switch } from "@welpco/ui/switch";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/lib/hooks/use-notifications";

const CATEGORY_COPY: Record<string, { label: string; description: string }> = {
  booking: {
    label: "Bookings",
    description: "Requests, confirmations, schedule changes, cancellations.",
  },
  payment: {
    label: "Payments",
    description: "Receipts, payouts, refunds.",
  },
  review: {
    label: "Reviews",
    description: "When someone leaves you a review or replies.",
  },
  message: {
    label: "Messages",
    description: "Chat and message alerts.",
  },
  dispute: {
    label: "Disputes",
    description: "Dispute updates and resolutions.",
  },
  job: {
    label: "Jobs",
    description: "Job posting and application updates.",
  },
  security: {
    label: "Account & security",
    description: "Sign-in alerts and account changes.",
  },
  system: {
    label: "Product news",
    description: "Occasional updates about new Welpco features.",
  },
};

/**
 * Settings panel for SMS notification opt-out (default on).
 * Email / in-app continue to be managed via signup defaults and API;
 * this surface focuses on SMS as requested for the Twilio foundation.
 */
export function SmsNotificationSettings() {
  const { data, isLoading, error } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();
  const [smsByCategory, setSmsByCategory] = useState<Record<string, boolean>>(
    {},
  );
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!data) return;
    const next: Record<string, boolean> = {};
    for (const row of data) {
      next[row.category] = row.smsEnabled ?? true;
    }
    setSmsByCategory(next);
  }, [data]);

  const rows = useMemo(() => {
    if (!data?.length) return [];
    return data.map((row) => ({
      category: row.category,
      label: CATEGORY_COPY[row.category]?.label ?? row.category,
      description: CATEGORY_COPY[row.category]?.description,
      smsEnabled: smsByCategory[row.category] ?? row.smsEnabled ?? true,
    }));
  }, [data, smsByCategory]);

  const handleSave = async () => {
    if (!data?.length) return;
    setSavedFlash(false);
    await updateMutation.mutateAsync(
      data.map((row) => ({
        category: row.category,
        smsEnabled: smsByCategory[row.category] ?? row.smsEnabled ?? true,
      })),
    );
    setSavedFlash(true);
  };

  return (
    <Card size="3" variant="surface">
      <Flex direction="column" gap="4">
        <Box>
          <Heading as="h2" size="5" trim="start" mb="2">
            SMS notifications
          </Heading>
          <Text size="2" color="gray">
            SMS is on by default. Turn off any category you do not want by text.
            You need a phone number on your profile for SMS to deliver.
          </Text>
        </Box>

        {error ? (
          <Callout.Root color={SEMANTIC_COLOR.danger} role="alert">
            <Callout.Text>
              {error instanceof Error
                ? error.message
                : "Failed to load notification preferences"}
            </Callout.Text>
          </Callout.Root>
        ) : null}

        {updateMutation.isError ? (
          <Callout.Root color={SEMANTIC_COLOR.danger} role="alert">
            <Callout.Text>
              {updateMutation.error instanceof Error
                ? updateMutation.error.message
                : "Failed to save SMS preferences"}
            </Callout.Text>
          </Callout.Root>
        ) : null}

        {savedFlash ? (
          <Callout.Root color="green">
            <Callout.Text>SMS preferences saved.</Callout.Text>
          </Callout.Root>
        ) : null}

        <Flex direction="column" gap="3">
          {isLoading && !data ? (
            <Text size="2" color="gray">
              Loading preferences…
            </Text>
          ) : null}
          {rows.map((row, idx) => (
            <Box key={row.category}>
              {idx > 0 ? <Separator size="4" mb="3" /> : null}
              <Flex justify="between" align="start" gap="3">
                <Box style={{ flex: 1 }}>
                  <Text size="2" weight="medium" id={`sms-pref-${row.category}`}>
                    {row.label}
                  </Text>
                  {row.description ? (
                    <Text size="1" color="gray" as="div" mt="1">
                      {row.description}
                    </Text>
                  ) : null}
                </Box>
                <Switch
                  aria-labelledby={`sms-pref-${row.category}`}
                  checked={row.smsEnabled}
                  disabled={isLoading || updateMutation.isPending}
                  onCheckedChange={(checked) =>
                    setSmsByCategory((prev) => ({
                      ...prev,
                      [row.category]: Boolean(checked),
                    }))
                  }
                  size="2"
                />
              </Flex>
            </Box>
          ))}
        </Flex>

        <Flex justify="end">
          <Button
            color={SEMANTIC_COLOR.primary}
            disabled={isLoading || updateMutation.isPending || rows.length === 0}
            onClick={() => void handleSave()}
            size="2"
          >
            {updateMutation.isPending ? "Saving…" : "Save SMS preferences"}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
