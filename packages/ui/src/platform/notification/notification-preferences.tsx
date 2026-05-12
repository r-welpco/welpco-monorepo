"use client";

import { Card } from "@welpco/ui/card";
import { Switch } from "@welpco/ui/switch";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Separator } from "@welpco/ui/separator";
import { Button } from "@welpco/ui/button";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

export interface NotificationPreference {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
  category: "email" | "push" | "sms";
}

export interface NotificationPreferencesProps {
  preferences: NotificationPreference[];
  loading?: boolean;
  onPreferenceChange?: (id: string, enabled: boolean) => void;
  onSave?: () => void | Promise<void>;
}

const categoryLabels: Record<"email" | "push" | "sms", string> = {
  email: "Email",
  push: "Push notifications",
  sms: "SMS",
};

export function NotificationPreferences({
  preferences,
  loading,
  onPreferenceChange,
  onSave,
}: NotificationPreferencesProps) {
  // SMS is intentionally hidden per product call (Day 9 Wave 3). If/when SMS
  // ships, drop this filter and the BFF will start emitting `category: "sms"`
  // rows that render through the same Switch row machinery.
  const categories = ["email", "push"] as const;

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: "100%" }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="7" trim="start" mb="2">
            Notification preferences
          </Heading>
          <Text size="2" color="gray">
            Choose how you want to receive notifications about bookings, payments, and messages.
          </Text>
        </Box>
        <Separator />

        <Flex direction="column" gap="6">
          {categories.map((category) => {
            const categoryPrefs = preferences.filter((p) => p.category === category);
            if (categoryPrefs.length === 0) return null;

            return (
              <Box key={category}>
                <Box mb="3">
                  <Text size="2" weight="bold">
                    {categoryLabels[category]}
                  </Text>
                </Box>
                <Flex direction="column" gap="3">
                  {categoryPrefs.map((pref) => (
                    <Card key={pref.id} size="2" variant="surface">
                      <Flex justify="between" align="start" gap="3">
                        <Box style={{ flex: 1 }}>
                          <Text size="2" weight="bold" mb="1" id={`pref-${pref.id}-label`}>
                            {pref.label}
                          </Text>
                          {pref.description && (
                            <Text size="1" color="gray">
                              {pref.description}
                            </Text>
                          )}
                        </Box>
                        <Switch
                          aria-labelledby={`pref-${pref.id}-label`}
                          checked={pref.enabled}
                          onCheckedChange={(checked) =>
                            onPreferenceChange?.(pref.id, checked)
                          }
                          disabled={loading}
                          size="2"
                        />
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              </Box>
            );
          })}
        </Flex>

        {onSave && (
          <>
            <Separator />
            <Flex justify="end" mt="3">
              <Button
                color={SEMANTIC_COLOR.primary}
                onClick={onSave}
                disabled={loading}
                size="2"
              >
                {loading ? "Saving…" : "Save preferences"}
              </Button>
            </Flex>
          </>
        )}
      </Flex>
    </Card>
  );
}

