"use client";

import { Button } from "@welpco/ui/button";
import { Checkbox } from "@welpco/ui/checkbox";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState, useMemo } from "react";

export interface OnboardingCustomerPreferencesValues {
  preferredCategories: string[];
}

export interface OnboardingCustomerPreferencesStepProps {
  categories: Array<{ id: string; name: string }>;
  defaultValues?: Partial<OnboardingCustomerPreferencesValues>;
  onNext?: (values: OnboardingCustomerPreferencesValues) => void | Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  categoriesLoading?: boolean;
}

export function OnboardingCustomerPreferencesStep({
  categories,
  defaultValues,
  onNext,
  onBack,
  loading,
  categoriesLoading,
}: OnboardingCustomerPreferencesStepProps) {
  const [preferredCategories, setPreferredCategories] = useState<string[]>(
    defaultValues?.preferredCategories ?? [],
  );
  const [touched, setTouched] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const toggleCategory = (id: string) => {
    setTouched(true);
    setPreferredCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    onNext?.({ preferredCategories });
  };

  const showError = touched && preferredCategories.length === 0 && sortedCategories.length > 0;

  if (categoriesLoading) {
    return (
      <Flex direction="column" gap="4" style={{ minWidth: 0 }}>
        <Text size="2" color="gray" highContrast>
          Loading categories…
        </Text>
      </Flex>
    );
  }

  if (sortedCategories.length === 0) {
    return (
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h3" size="3" mb="3" trim="start">
            Service preferences
          </Heading>
          <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface">
            <Callout.Text>
              Service categories are not available yet. You can set preferences later from your profile.
            </Callout.Text>
          </Callout.Root>
        </Box>
        <Flex gap="2" justify="end" wrap="wrap">
          {onBack && (
            <Button type="button" variant="ghost" color="gray" size="2" onClick={onBack} style={{ flex: 1 }}>
              Back
            </Button>
          )}
          <Button
            type="button"
            color={SEMANTIC_COLOR.primary}
            size="2"
            disabled={loading}
            onClick={() => onNext?.({ preferredCategories: [] })}
            style={{ flex: 1 }}
          >
            Continue
          </Button>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
      <Box>
        <Heading as="h3" size="3" mb="3" trim="start">
          Service preferences
        </Heading>
        <Text size="2" color="gray" highContrast>
          Choose the types of services you care about. You can change this anytime in your profile.
        </Text>
      </Box>

      <Box>
        <Text size="2" weight="bold" mb="3" id="onb-pref-group-label">
          Categories you are interested in (required)
          <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
            *
          </Text>
        </Text>
        <Flex
          direction="column"
          gap="2"
          role="group"
          aria-labelledby="onb-pref-group-label"
          aria-required="true"
        >
          {sortedCategories.map((cat) => (
            <Flex key={cat.id} align="center" gap="2">
              <Checkbox
                id={`onb-pref-${cat.id}`}
                checked={preferredCategories.includes(cat.id)}
                onCheckedChange={() => toggleCategory(cat.id)}
                disabled={loading}
                size="2"
              />
              <Text as="label" size="2" htmlFor={`onb-pref-${cat.id}`}>
                {cat.name}
              </Text>
            </Flex>
          ))}
        </Flex>
        {showError && (
          <Text size="1" color={SEMANTIC_COLOR.danger} mt="2">
            Select at least one category to continue.
          </Text>
        )}
      </Box>

      <Flex gap="2" justify="end" wrap="wrap" direction={{ initial: "column", sm: "row" }}>
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
          disabled={loading || preferredCategories.length === 0}
          onClick={() => {
            setTouched(true);
            if (preferredCategories.length === 0) return;
            void handleNext();
          }}
          style={{ flex: 1, width: "100%", minWidth: 0 }}
        >
          Continue
        </Button>
      </Flex>
    </Flex>
  );
}
