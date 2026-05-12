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
import { AddressInput, type AddressValues } from "./address-input";
import { useState, useEffect } from "react";

export interface ServiceArea {
  type: "radius";
  centerAddress?: AddressValues;
  radiusMiles?: number;
  description?: string;
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
}

export function ServiceAreaSelector({
  defaultArea,
  loading,
  onSave,
  allowOverride = false,
  defaultServiceArea,
  noCard = false,
  showSaveButton = true,
}: ServiceAreaSelectorProps) {
  const [centerAddress, setCenterAddress] = useState<AddressValues>(
    defaultArea?.centerAddress || {
      streetAddress: "",
      city: "",
      stateProvince: "",
      zipPostalCode: "",
      country: "",
    }
  );
  const [radiusMiles, setRadiusMiles] = useState<number>(
    defaultArea?.radiusMiles || 10
  );
  const [useDefault, setUseDefault] = useState(allowOverride && !defaultArea);
  const [isDirty, setIsDirty] = useState(false);

  // Reset state when defaultArea changes (e.g. after async profile fetch)
  useEffect(() => {
    if (defaultArea) {
      setCenterAddress(
        defaultArea.centerAddress || {
          streetAddress: "",
          city: "",
          stateProvince: "",
          zipPostalCode: "",
          country: "",
        }
      );
      setRadiusMiles(defaultArea.radiusMiles || 10);
      setIsDirty(false);
    }
  }, [defaultArea]);

  /** Fire onSave immediately (used when showSaveButton is false, e.g. inside a form) */
  const fireImmediate = (area: ServiceArea) => {
    if (!showSaveButton) {
      onSave?.(area);
    } else {
      setIsDirty(true);
    }
  };

  const handleAddressChange = (address: AddressValues) => {
    setCenterAddress(address);
    fireImmediate({ type: "radius", centerAddress: address, radiusMiles });
  };

  const handleRadiusChange = (value: string) => {
    const radius = parseInt(value, 10) || 0;
    setRadiusMiles(radius);
    fireImmediate({ type: "radius", centerAddress, radiusMiles: radius });
  };

  const handleSave = () => {
    if (useDefault && defaultServiceArea) {
      onSave?.(defaultServiceArea);
    } else {
      onSave?.({
        type: "radius",
        centerAddress,
        radiusMiles,
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
        onSave?.({ type: "radius", centerAddress, radiusMiles });
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
              ? "Use default service area or define a custom area for this service."
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
                  <Text weight="medium">Use default service area</Text>
                </Flex>
              </Text>
              <Text as="label" size="2">
                <Flex align="center" gap="2">
                  <RadioGroup.Item value="custom" />
                  <Text weight="medium">Define custom service area</Text>
                </Flex>
              </Text>
            </Flex>
          </RadioGroup.Root>

          {useDefault && defaultServiceArea && (
            <Callout.Root color={SEMANTIC_COLOR.success} variant="soft">
              <Callout.Text>
                Using default service area: {defaultServiceArea.radiusMiles} miles from{" "}
                {defaultServiceArea.centerAddress?.city || "your location"}
              </Callout.Text>
            </Callout.Root>
          )}

          {!useDefault && (
            <>
              <Box mb="3">
                <Text as="label" size="2" weight="bold" mb="1">
                  Center address
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                </Text>
                <AddressInput
                  values={centerAddress}
                  onChange={handleAddressChange}
                  loading={loading}
                  required
                />
              </Box>

              <Box mb="3">
                <Text as="label" size="2" weight="bold" htmlFor="service-radius" mb="1">
                  Service radius (miles)
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                </Text>
                <TextField.Root
                  id="service-radius"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  size="2"
                  disabled={loading}
                  aria-required="true"
                  value={radiusMiles.toString()}
                  onChange={(e) => handleRadiusChange(e.target.value)}
                />
                <Text size="1" color="gray" highContrast mt="2">
                  Services will be available within {radiusMiles} miles of the center address.
                </Text>
              </Box>
            </>
          )}
        </>
      ) : (
        <>
          <Box mb="3">
            <Text as="label" size="2" weight="bold" mb="1">
              Center address
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <AddressInput
              values={centerAddress}
              onChange={handleAddressChange}
              loading={loading}
              required
            />
          </Box>

          <Box mb="3">
            <Text as="label" size="2" weight="bold" htmlFor="service-radius" mb="1">
              Service radius (miles)
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="service-radius"
              type="number"
              min={1}
              max={100}
              step={1}
              size="2"
              disabled={loading}
              value={radiusMiles.toString()}
              onChange={(e) => handleRadiusChange(e.target.value)}
            />
            <Text size="1" color="gray" mt="2">
              Services will be available within {radiusMiles} miles of the center address.
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
            {loading ? "Saving…" : "Save service area"}
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

