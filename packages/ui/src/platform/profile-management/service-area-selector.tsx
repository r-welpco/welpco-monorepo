"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { RadioGroup } from "@welpco/ui/radio-group";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  AddressInput,
  type AddressInputLabels,
  type AddressValues,
} from "./address-input";
import {
  radiusInputFromServiceArea,
  resolveServiceAreaRadiusKm,
  SERVICE_AREA_RADIUS_KM_DEFAULT,
} from "./service-area-utils";
import { useState, useEffect } from "react";

export interface ServiceArea {
  type: "radius";
  centerAddress?: AddressValues;
  radiusKm?: number;
  /** @deprecated Legacy payloads; converted on read */
  radiusMiles?: number;
  description?: string;
}

export type ServiceAreaSelectorOverrideLabels = {
  overrideDescription: string;
  useDefault: string;
  defineCustom: string;
  usingDefault: (km: number, city: string) => string;
  save?: string;
  saving?: string;
};

export interface ServiceAreaSelectorLabels {
  centerAddress: string;
  serviceRadius: string;
  radiusPlaceholder: string;
  radiusHint: string;
  /** Per-offering override UI when `allowOverride` and `defaultServiceArea` are set. */
  override?: ServiceAreaSelectorOverrideLabels;
}

const DEFAULT_SELECTOR_LABELS: ServiceAreaSelectorLabels = {
  centerAddress: "Center address",
  serviceRadius: "Service radius (km)",
  radiusPlaceholder: "25",
  radiusHint:
    "Services will be available within {km} km of the center address.",
};

function formatLabel(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export interface ServiceAreaSelectorProps {
  defaultArea?: ServiceArea;
  loading?: boolean;
  onSave?: (area: ServiceArea) => void;
  allowOverride?: boolean;
  defaultServiceArea?: ServiceArea;
  noCard?: boolean; // If true, don't render the card wrapper
  /** When false, calls onSave on every change (for use inside forms). Default true. */
  showSaveButton?: boolean;
  /** When false, omits the redundant "Center address" group label (e.g. signup step). */
  showCenterAddressLabel?: boolean;
  selectorLabels?: ServiceAreaSelectorLabels;
  addressLabels?: AddressInputLabels;
  /** When false, hides country on the address fields (Canada-only for now). */
  showAddressCountry?: boolean;
}

export function ServiceAreaSelector({
  defaultArea,
  loading,
  onSave,
  allowOverride = false,
  defaultServiceArea,
  noCard = false,
  showSaveButton = true,
  showCenterAddressLabel = true,
  selectorLabels: selectorLabelsProp,
  addressLabels,
  showAddressCountry = true,
}: ServiceAreaSelectorProps) {
  const selectorLabels = selectorLabelsProp ?? DEFAULT_SELECTOR_LABELS;
  const [centerAddress, setCenterAddress] = useState<AddressValues>(
    defaultArea?.centerAddress || {
      streetAddress: "",
      city: "",
      stateProvince: "",
      zipPostalCode: "",
      country: "",
    }
  );
  const [radiusInput, setRadiusInput] = useState(() =>
    radiusInputFromServiceArea(defaultArea),
  );
  const [useDefault, setUseDefault] = useState(allowOverride && !defaultArea);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!showSaveButton || !defaultArea) return;
    setCenterAddress(
      defaultArea.centerAddress || {
        streetAddress: "",
        city: "",
        stateProvince: "",
        zipPostalCode: "",
        country: "",
      },
    );
    setRadiusInput(radiusInputFromServiceArea(defaultArea));
    setIsDirty(false);
  }, [defaultArea, showSaveButton]);

  /** Fire onSave immediately (used when showSaveButton is false, e.g. inside a form) */
  const fireImmediate = (area: ServiceArea) => {
    if (!showSaveButton) {
      onSave?.(area);
    } else {
      setIsDirty(true);
    }
  };

  const parseRadiusKm = (value: string): number | undefined => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return undefined;
    const n = parseInt(digits, 10);
    return Number.isNaN(n) ? undefined : n;
  };

  const withDefaultCountry = (address: AddressValues): AddressValues => ({
    ...address,
    country: address.country?.trim() || "CA",
  });

  const handleAddressChange = (address: AddressValues) => {
    const normalized = withDefaultCountry(address);
    setCenterAddress(normalized);
    const radiusKm = parseRadiusKm(radiusInput);
    if (radiusKm !== undefined) {
      fireImmediate({ type: "radius", centerAddress: normalized, radiusKm });
    }
  };

  const handleRadiusChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setRadiusInput(digits);
    const radiusKm = parseRadiusKm(digits);
    if (radiusKm !== undefined) {
      fireImmediate({
        type: "radius",
        centerAddress: withDefaultCountry(centerAddress),
        radiusKm,
      });
    }
  };

  const handleSave = () => {
    if (useDefault && defaultServiceArea) {
      onSave?.({
        ...defaultServiceArea,
        centerAddress: defaultServiceArea.centerAddress
          ? withDefaultCountry(defaultServiceArea.centerAddress)
          : undefined,
      });
    } else {
      onSave?.({
        type: "radius",
        centerAddress: withDefaultCountry(centerAddress),
        radiusKm: parseRadiusKm(radiusInput) ?? SERVICE_AREA_RADIUS_KM_DEFAULT,
      });
    }
    setIsDirty(false);
  };

  const handleUseDefaultToggle = (checked: boolean) => {
    setUseDefault(checked);
    if (!showSaveButton) {
      if (checked && defaultServiceArea) {
        onSave?.(defaultServiceArea);
      } else {
        onSave?.({
          type: "radius",
          centerAddress,
          radiusKm: parseRadiusKm(radiusInput) ?? SERVICE_AREA_RADIUS_KM_DEFAULT,
        });
      }
    } else {
      setIsDirty(true);
    }
  };

  const content = (
    <Flex direction="column" gap="4">
      {!noCard && (
        <Box>
          <Heading size="4" mb="1" trim="start">
            Service area
          </Heading>
          <Text size="2" color="gray" highContrast>
            {allowOverride && useDefault && defaultServiceArea
              ? (selectorLabels.override?.overrideDescription ??
                "Use default service area or define a custom area for this service.")
              : "Define the geographic area where you provide services."}
          </Text>
        </Box>
      )}

      {allowOverride && defaultServiceArea ? (
        <>
          <RadioGroup.Root
            value={useDefault ? "default" : "custom"}
            onValueChange={(value) => handleUseDefaultToggle(value === "default")}
          >
            <Flex direction="column" gap="2">
              <Text as="label" size="2">
                <Flex align="center" gap="2">
                  <RadioGroup.Item value="default" />
                  <Text weight="medium">
                    {selectorLabels.override?.useDefault ?? "Use default service area"}
                  </Text>
                </Flex>
              </Text>
              <Text as="label" size="2">
                <Flex align="center" gap="2">
                  <RadioGroup.Item value="custom" />
                  <Text weight="medium">
                    {selectorLabels.override?.defineCustom ?? "Define custom service area"}
                  </Text>
                </Flex>
              </Text>
            </Flex>
          </RadioGroup.Root>

          {useDefault && defaultServiceArea && (
            <Callout.Root color={SEMANTIC_COLOR.success} variant="soft">
              <Callout.Text>
                {selectorLabels.override?.usingDefault
                  ? selectorLabels.override.usingDefault(
                      resolveServiceAreaRadiusKm(defaultServiceArea),
                      defaultServiceArea.centerAddress?.city || "your location",
                    )
                  : `Using default service area: ${resolveServiceAreaRadiusKm(defaultServiceArea)} km from ${defaultServiceArea.centerAddress?.city || "your location"}`}
              </Callout.Text>
            </Callout.Root>
          )}

          {!useDefault && (
            <>
              <Box mb="3">
                {showCenterAddressLabel ? (
                  <Text as="label" size="2" weight="bold" mb="1">
                    {selectorLabels.centerAddress}
                    <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                  </Text>
                ) : null}
                <AddressInput
                  values={centerAddress}
                  labels={addressLabels}
                  onChange={(address) =>
                    handleAddressChange({ ...address, country: address.country || "CA" })
                  }
                  loading={loading}
                  required
                  showCountry={showAddressCountry}
                />
              </Box>

              <Box mb="3">
                <Text as="label" size="2" weight="bold" htmlFor="service-radius" mb="1">
                  {selectorLabels.serviceRadius}
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                </Text>
                <TextField.Root
                  id="service-radius"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  size="2"
                  disabled={loading}
                  aria-required="true"
                  placeholder={selectorLabels.radiusPlaceholder}
                  value={radiusInput}
                  onChange={(e) => handleRadiusChange(e.target.value)}
                />
                <Text size="1" color="gray" highContrast mt="2">
                  {formatLabel(selectorLabels.radiusHint, {
                    km:
                      parseRadiusKm(radiusInput) ??
                      parseInt(selectorLabels.radiusPlaceholder, 10) ??
                      SERVICE_AREA_RADIUS_KM_DEFAULT,
                  })}
                </Text>
              </Box>
            </>
          )}
        </>
      ) : (
        <>
          <Box mb="3">
            {showCenterAddressLabel ? (
              <Text as="label" size="2" weight="bold" mb="1">
                {selectorLabels.centerAddress}
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
            ) : null}
            <AddressInput
              values={centerAddress}
              labels={addressLabels}
              onChange={(address) =>
                handleAddressChange({ ...address, country: address.country || "CA" })
              }
              loading={loading}
              required
              showCountry={showAddressCountry}
            />
          </Box>

          <Box mb="3">
            <Text as="label" size="2" weight="bold" htmlFor="service-radius" mb="1">
              {selectorLabels.serviceRadius}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="service-radius"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              size="2"
              disabled={loading}
              placeholder={selectorLabels.radiusPlaceholder}
              value={radiusInput}
              onChange={(e) => handleRadiusChange(e.target.value)}
            />
            <Text size="1" color="gray" mt="2">
              {formatLabel(selectorLabels.radiusHint, {
                km:
                  parseRadiusKm(radiusInput) ??
                  parseInt(selectorLabels.radiusPlaceholder, 10) ??
                  SERVICE_AREA_RADIUS_KM_DEFAULT,
              })}
            </Text>
          </Box>
        </>
      )}

      {/* Save button — only fires API call when clicked */}
      {showSaveButton && (
        <Flex justify="end">
          <Button
            type="button"
            size="2"
            color={SEMANTIC_COLOR.primary}
            disabled={loading || !isDirty}
            onClick={handleSave}
          >
            {loading
              ? (selectorLabels.override?.saving ?? "Saving…")
              : (selectorLabels.override?.save ?? "Save service area")}
          </Button>
        </Flex>
      )}
    </Flex>
  );

  // If noCard is true, return content without Card wrapper
  if (noCard) {
    return content;
  }

  // Otherwise, wrap in Card
  return (
    <Card size="3" variant="surface" style={{ width: "100%", minWidth: 0 }}>
      {content}
    </Card>
  );
}
