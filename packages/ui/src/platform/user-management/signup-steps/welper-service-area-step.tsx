"use client";

import { useMemo, useState } from "react";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  ServiceAreaSelector,
  type ServiceArea,
} from "@welpco/ui/platform/profile-management";
import {
  DEFAULT_WELPER_SERVICE_AREA_LABELS,
  type WelperServiceAreaStepLabels,
} from "./labels";
import { SIGNUP_STEP_CARD_STYLE, type SignupStateLite } from "./types";

/**
 * Welper-only signup step: center address + service radius (matches dashboard ServiceAreaCard).
 */

export interface WelperServiceAreaStepValues {
  serviceArea: ServiceArea;
}

export interface WelperServiceAreaStepProps {
  state: SignupStateLite;
  loading?: boolean;
  error?: string | null;
  labels?: WelperServiceAreaStepLabels;
  onSubmit: (values: WelperServiceAreaStepValues) => void | Promise<void>;
  onBack?: () => void;
}

function filledToDefaultArea(
  filled: Record<string, unknown> | undefined,
): ServiceArea | undefined {
  if (!filled) return undefined;
  const nested = filled.serviceArea as ServiceArea | undefined;
  if (nested?.type === "radius") return nested;
  const city = typeof filled.city === "string" ? filled.city : "";
  const province = typeof filled.province === "string" ? filled.province : "";
  const country = typeof filled.country === "string" ? filled.country : "CA";
  if (!city || !province) return undefined;
  return {
    type: "radius",
    centerAddress: {
      streetAddress: "",
      city,
      stateProvince: province,
      zipPostalCode: "",
      country,
    },
    radiusMiles:
      typeof filled.radiusMiles === "number" ? filled.radiusMiles : 25,
  };
}

function validateServiceArea(
  area: ServiceArea | undefined,
  v: WelperServiceAreaStepLabels["validation"],
): string | null {
  if (!area || area.type !== "radius") {
    return v.required;
  }
  const city = area.centerAddress?.city?.trim() ?? "";
  const province = area.centerAddress?.stateProvince?.trim() ?? "";
  const zip = area.centerAddress?.zipPostalCode?.trim() ?? "";
  const miles = area.radiusMiles ?? 0;
  if (!city) return v.cityRequired;
  if (province.length < 2) return v.provinceRequired;
  if (!zip) return v.postalRequired;
  if (miles < 1 || miles > 100) return v.radiusRange;
  return null;
}

export function WelperServiceAreaStep({
  state,
  loading,
  error,
  labels: labelsProp,
  onSubmit,
  onBack,
}: WelperServiceAreaStepProps) {
  const labels = labelsProp ?? DEFAULT_WELPER_SERVICE_AREA_LABELS;

  const filled = state.filledData.welperServiceArea as
    | Record<string, unknown>
    | undefined;

  const [serviceArea, setServiceArea] = useState<ServiceArea>(() => {
    return (
      filledToDefaultArea(filled) ?? {
        type: "radius",
        centerAddress: {
          streetAddress: "",
          city: "",
          stateProvince: "",
          zipPostalCode: "",
          country: "CA",
        },
        radiusMiles: 25,
      }
    );
  });
  const [submitted, setSubmitted] = useState(false);

  const validationError = useMemo(
    () => validateServiceArea(serviceArea, labels.validation),
    [serviceArea, labels.validation],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (validationError) return;
    await onSubmit({ serviceArea });
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={SIGNUP_STEP_CARD_STYLE}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {labels.description}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {submitted && validationError && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{validationError}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <ServiceAreaSelector
            noCard
            showSaveButton={false}
            showCenterAddressLabel={false}
            defaultArea={serviceArea}
            loading={loading}
            selectorLabels={labels.selector}
            addressLabels={labels.address}
            showAddressCountry={false}
            onSave={(area) =>
              setServiceArea({
                ...area,
                centerAddress: area.centerAddress
                  ? { ...area.centerAddress, country: "CA" }
                  : area.centerAddress,
              })
            }
          />

          <Flex
            direction={{ initial: "column", sm: "row-reverse" }}
            gap="3"
            mt={FORM_SPACING.submitGap}
          >
            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? labels.saving : labels.continue}
            </Button>
            {onBack && (
              <Button
                type="button"
                size="3"
                variant="soft"
                color="gray"
                disabled={loading}
                onClick={onBack}
                style={{ width: "100%" }}
              >
                {labels.back}
              </Button>
            )}
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
