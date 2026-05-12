"use client";

import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

export interface AddressValues {
  streetAddress: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country?: string;
}

export interface AddressInputProps {
  values?: AddressValues;
  onChange?: (values: AddressValues) => void;
  errors?: {
    streetAddress?: string;
    city?: string;
    stateProvince?: string;
    zipPostalCode?: string;
    country?: string;
  };
  loading?: boolean;
  required?: boolean;
}

export function AddressInput({
  values = {
    streetAddress: "",
    city: "",
    stateProvince: "",
    zipPostalCode: "",
    country: "",
  },
  onChange,
  errors,
  loading,
  required = true,
}: AddressInputProps) {
  const handleChange = (field: keyof AddressValues, value: string) => {
    onChange?.({
      ...values,
      [field]: value,
    });
  };

  return (
    <Flex direction="column" gap="3">
      <Box>
        <Text as="label" size="2" weight="bold" htmlFor="address-street" mb="1">
          Street address
          {required && <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>}
        </Text>
        <TextField.Root
          id="address-street"
          placeholder="123 Main Street"
          autoComplete="street-address"
          size="2"
          disabled={loading}
          aria-required={required || undefined}
          aria-invalid={errors?.streetAddress ? "true" : undefined}
          aria-describedby={errors?.streetAddress ? "address-street-error" : undefined}
          value={values.streetAddress}
          onChange={(e) => handleChange("streetAddress", e.target.value)}
        />
        {errors?.streetAddress && (
          <Text id="address-street-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt="2">
            {errors.streetAddress}
          </Text>
        )}
      </Box>

      <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
        <Box style={{ flex: 2 }}>
          <Text as="label" size="2" weight="bold" htmlFor="address-city" mb="1">
            City
            {required && <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>}
          </Text>
          <TextField.Root
            id="address-city"
            placeholder="San Francisco"
            autoComplete="address-level2"
            size="2"
            disabled={loading}
            aria-required={required || undefined}
            aria-invalid={errors?.city ? "true" : undefined}
            aria-describedby={errors?.city ? "address-city-error" : undefined}
            value={values.city}
            onChange={(e) => handleChange("city", e.target.value)}
          />
          {errors?.city && (
            <Text id="address-city-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt="2">
              {errors.city}
            </Text>
          )}
        </Box>

        <Box style={{ flex: 1 }}>
          <Text as="label" size="2" weight="bold" htmlFor="address-state" mb="1">
            State/Province
            {required && <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>}
          </Text>
          <TextField.Root
            id="address-state"
            placeholder="CA"
            autoComplete="address-level1"
            size="2"
            disabled={loading}
            aria-required={required || undefined}
            aria-invalid={errors?.stateProvince ? "true" : undefined}
            aria-describedby={errors?.stateProvince ? "address-state-error" : undefined}
            value={values.stateProvince}
            onChange={(e) => handleChange("stateProvince", e.target.value)}
          />
          {errors?.stateProvince && (
            <Text id="address-state-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt="2">
              {errors.stateProvince}
            </Text>
          )}
        </Box>

        <Box style={{ flex: 1 }}>
          <Text as="label" size="2" weight="bold" htmlFor="address-zip" mb="1">
            ZIP/Postal code
            {required && <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>}
          </Text>
          <TextField.Root
            id="address-zip"
            placeholder="94102"
            autoComplete="postal-code"
            size="2"
            disabled={loading}
            aria-required={required || undefined}
            aria-invalid={errors?.zipPostalCode ? "true" : undefined}
            aria-describedby={errors?.zipPostalCode ? "address-zip-error" : undefined}
            value={values.zipPostalCode}
            onChange={(e) => handleChange("zipPostalCode", e.target.value)}
          />
          {errors?.zipPostalCode && (
            <Text id="address-zip-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt="2">
              {errors.zipPostalCode}
            </Text>
          )}
        </Box>
      </Flex>

      <Box>
        <Text as="label" size="2" weight="bold" htmlFor="address-country" mb="1">
          Country (optional)
        </Text>
        <TextField.Root
          id="address-country"
          placeholder="United States"
          autoComplete="country-name"
          size="2"
          disabled={loading}
          value={values.country || ""}
          onChange={(e) => handleChange("country", e.target.value)}
        />
      </Box>
    </Flex>
  );
}
