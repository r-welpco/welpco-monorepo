"use client";

import { Button } from "@welpco/ui/button";
import { Checkbox } from "@welpco/ui/checkbox";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState } from "react";

export interface PreferencesStepProps {
  defaultValues?: Partial<PreferencesValues>;
  onNext?: (values: PreferencesValues) => void;
  onBack?: () => void;
  loading?: boolean;
}

export interface PreferencesValues {
  preferredServices?: string[];
  notificationEmail?: boolean;
  notificationPush?: boolean;
}

export function PreferencesStep({
  defaultValues,
  onNext,
  onBack,
  loading,
}: PreferencesStepProps) {
  const [preferences, setPreferences] = useState<PreferencesValues>({
    preferredServices: defaultValues?.preferredServices || [],
    notificationEmail: defaultValues?.notificationEmail ?? true,
    notificationPush: defaultValues?.notificationPush ?? true,
  });

  const services = [
    "Cleaning",
    "Moving",
    "Repairs",
    "Yard Work",
    "Pet Care",
    "Tutoring",
  ];

  const toggleService = (service: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferredServices: prev.preferredServices?.includes(service)
        ? prev.preferredServices.filter((s) => s !== service)
        : [...(prev.preferredServices || []), service],
    }));
  };

  const handleNext = () => {
    onNext?.(preferences);
  };

  return (
    <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
      <Box>
        <Heading as="h3" size="3" mb="3" trim="start">
          Your preferences
        </Heading>
        <Text size="2" color="gray" highContrast>
          Help us personalize your experience.
        </Text>
      </Box>

      <Box>
        <Text size="2" weight="bold" mb="3">
          Services you're interested in
        </Text>
        <Flex direction="column" gap="2">
          {services.map((service) => (
            <Flex key={service} align="center" gap="2">
              <Checkbox
                id={`service-${service}`}
                checked={preferences.preferredServices?.includes(service)}
                onCheckedChange={() => toggleService(service)}
                disabled={loading}
                size="2"
              />
              <Text as="label" size="2" htmlFor={`service-${service}`}>
                {service}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      <Box>
        <Text size="2" weight="bold" mb="3">
          Notification preferences
        </Text>
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <Checkbox
              id="notify-email"
              checked={preferences.notificationEmail}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({
                  ...prev,
                  notificationEmail: Boolean(checked),
                }))
              }
              disabled={loading}
              size="2"
            />
            <Text as="label" size="2" htmlFor="notify-email">
              Email notifications
            </Text>
          </Flex>
          <Flex align="center" gap="2">
            <Checkbox
              id="notify-push"
              checked={preferences.notificationPush}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({
                  ...prev,
                  notificationPush: Boolean(checked),
                }))
              }
              disabled={loading}
              size="2"
            />
            <Text as="label" size="2" htmlFor="notify-push">
              Push notifications
            </Text>
          </Flex>
        </Flex>
      </Box>

      <Flex
        gap="2"
        justify="end"
        wrap="wrap"
        direction={{ initial: "column", sm: "row" }}
      >
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            color="gray"
            size="2"
            onClick={onBack}
            style={{ flex: 1, width: "100%", minWidth: 0 }}
          >
            Back
          </Button>
        )}
        <Button
          type="button"
          color={SEMANTIC_COLOR.primary}
          size="2"
          disabled={loading}
          onClick={handleNext}
          style={{ flex: 1, width: "100%", minWidth: 0 }}
        >
          Continue
        </Button>
      </Flex>
    </Flex>
  );
}

