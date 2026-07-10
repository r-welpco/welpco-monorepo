"use client";

import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  CANADA_COUNTRY_CODE,
  CANADIAN_PROVINCES,
  normalizeCanadianProvinceCode,
} from "./canadian-provinces";

export interface AddressValues {
  streetAddress: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country?: string;
}

export interface AddressInputLabels {
  streetAddress: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  streetPlaceholder: string;
  cityPlaceholder?: string;
  zipPlaceholder?: string;
  provincePlaceholder?: string;
  country?: string;
  countryValue?: string;
}

const DEFAULT_ADDRESS_INPUT_LABELS: AddressInputLabels = {
  streetAddress: "Street address",
  city: "City",
  stateProvince: "Province",
  zipPostalCode: "Postal code",
  streetPlaceholder: "123 Main Street",
  cityPlaceholder: "Toronto",
  zipPlaceholder: "M5H 1A1",
  provincePlaceholder: "Select province",
  country: "Country",
};

export interface AddressInputProps {
  values?: AddressValues;
  labels?: AddressInputLabels;
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
  provinceLabels?: Record<string, string>;
  /** @deprecated Country is always Canada; kept for API compatibility. */
  showCountry?: boolean;
  /** Force city/province/postal into a single column (e.g. narrow modals). */
  layout?: "responsive" | "stacked" | "split";
}

function withCanada(values: AddressValues): AddressValues {
  return {
    ...values,
    country: CANADA_COUNTRY_CODE,
    stateProvince: normalizeCanadianProvinceCode(values.stateProvince) || values.stateProvince,
  };
}

export function AddressInput({
  values = {
    streetAddress: "",
    city: "",
    stateProvince: "",
    zipPostalCode: "",
    country: CANADA_COUNTRY_CODE,
  },
  labels: labelsProp,
  onChange,
  errors,
  loading,
  required = true,
  provinceLabels,
  layout = "responsive",
}: AddressInputProps) {
  const labels = labelsProp ?? DEFAULT_ADDRESS_INPUT_LABELS;
  const provinceValue = normalizeCanadianProvinceCode(values.stateProvince);

  const handleChange = (field: keyof AddressValues, value: string) => {
    onChange?.(
      withCanada({
        ...values,
        [field]: value,
      }),
    );
  };

  return (
    <Flex direction="column" gap="3">
      <Box>
        <Text as="label" size="2" weight="medium" htmlFor="address-street" mb={FORM_SPACING.labelGap}>
          {labels.streetAddress}
          {required && (
            <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
              *
            </Text>
          )}
        </Text>
        <TextField.Root
          id="address-street"
          placeholder={labels.streetPlaceholder}
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
          <Text id="address-street-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
            {errors.streetAddress}
          </Text>
        )}
      </Box>

      {layout === "split" ? (
        <Flex direction="column" gap="3">
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
              gap: "var(--space-3)",
              alignItems: "start",
            }}
          >
            <Box style={{ minWidth: 0 }}>
              <Text as="label" size="2" weight="medium" htmlFor="address-city" mb={FORM_SPACING.labelGap}>
                {labels.city}
                {required && (
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                    *
                  </Text>
                )}
              </Text>
              <TextField.Root
                id="address-city"
                placeholder={labels.cityPlaceholder ?? DEFAULT_ADDRESS_INPUT_LABELS.cityPlaceholder}
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
                <Text id="address-city-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {errors.city}
                </Text>
              )}
            </Box>

            <Box style={{ minWidth: 0 }}>
              <Text as="label" size="2" weight="medium" id="address-state-label" mb={FORM_SPACING.labelGap} style={{ display: "block" }}>
                {labels.stateProvince}
                {required && (
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                    *
                  </Text>
                )}
              </Text>
              <Select
                size="2"
                value={provinceValue || undefined}
                onValueChange={(value) => handleChange("stateProvince", value)}
                disabled={loading}
              >
                <SelectTrigger
                  id="address-state"
                  aria-labelledby="address-state-label"
                  style={{ width: "100%" }}
                  aria-required={required || undefined}
                  aria-invalid={errors?.stateProvince ? "true" : undefined}
                  aria-describedby={errors?.stateProvince ? "address-state-error" : undefined}
                  placeholder={labels.provincePlaceholder ?? "Select province"}
                />
                <SelectContent>
                  {CANADIAN_PROVINCES.map((province) => (
                    <SelectItem key={province.code} value={province.code}>
                      {provinceLabels?.[province.code] ?? province.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors?.stateProvince && (
                <Text id="address-state-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {errors.stateProvince}
                </Text>
              )}
            </Box>
          </Box>

          <Box>
            <Text as="label" size="2" weight="medium" htmlFor="address-zip" mb={FORM_SPACING.labelGap}>
              {labels.zipPostalCode}
              {required && (
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  *
                </Text>
              )}
            </Text>
            <TextField.Root
              id="address-zip"
              placeholder={labels.zipPlaceholder ?? DEFAULT_ADDRESS_INPUT_LABELS.zipPlaceholder}
              autoComplete="postal-code"
              size="2"
              disabled={loading}
              aria-required={required || undefined}
              aria-invalid={errors?.zipPostalCode ? "true" : undefined}
              aria-describedby={errors?.zipPostalCode ? "address-zip-error" : undefined}
              value={values.zipPostalCode}
              onChange={(e) => handleChange("zipPostalCode", e.target.value.toUpperCase())}
            />
            {errors?.zipPostalCode && (
              <Text id="address-zip-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {errors.zipPostalCode}
              </Text>
            )}
          </Box>
        </Flex>
      ) : (
      <Box
        style={{
          display: "grid",
          gridTemplateColumns:
            layout === "stacked" ? "1fr" : "repeat(auto-fit, minmax(8.5rem, 1fr))",
          gap: "var(--space-3)",
          alignItems: "start",
        }}
      >
        <Box style={{ minWidth: 0 }}>
          <Text as="label" size="2" weight="medium" htmlFor="address-city" mb={FORM_SPACING.labelGap}>
            {labels.city}
            {required && (
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            )}
          </Text>
          <TextField.Root
            id="address-city"
            placeholder={labels.cityPlaceholder ?? DEFAULT_ADDRESS_INPUT_LABELS.cityPlaceholder}
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
            <Text id="address-city-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
              {errors.city}
            </Text>
          )}
        </Box>

        <Box style={{ minWidth: 0 }}>
          <Text as="label" size="2" weight="medium" id="address-state-label" mb={FORM_SPACING.labelGap} style={{ display: "block" }}>
            {labels.stateProvince}
            {required && (
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            )}
          </Text>
          <Select
            size="2"
            value={provinceValue || undefined}
            onValueChange={(value) => handleChange("stateProvince", value)}
            disabled={loading}
          >
            <SelectTrigger
              id="address-state"
              aria-labelledby="address-state-label"
              style={{ width: "100%" }}
              aria-required={required || undefined}
              aria-invalid={errors?.stateProvince ? "true" : undefined}
              aria-describedby={errors?.stateProvince ? "address-state-error" : undefined}
              placeholder={labels.provincePlaceholder ?? "Select province"}
            />
            <SelectContent>
              {CANADIAN_PROVINCES.map((province) => (
                <SelectItem key={province.code} value={province.code}>
                  {provinceLabels?.[province.code] ?? province.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.stateProvince && (
            <Text id="address-state-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
              {errors.stateProvince}
            </Text>
          )}
        </Box>

        <Box style={{ minWidth: 0 }}>
          <Text as="label" size="2" weight="medium" htmlFor="address-zip" mb={FORM_SPACING.labelGap}>
            {labels.zipPostalCode}
            {required && (
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            )}
          </Text>
          <TextField.Root
            id="address-zip"
            placeholder={labels.zipPlaceholder ?? DEFAULT_ADDRESS_INPUT_LABELS.zipPlaceholder}
            autoComplete="postal-code"
            size="2"
            disabled={loading}
            aria-required={required || undefined}
            aria-invalid={errors?.zipPostalCode ? "true" : undefined}
            aria-describedby={errors?.zipPostalCode ? "address-zip-error" : undefined}
            value={values.zipPostalCode}
            onChange={(e) => handleChange("zipPostalCode", e.target.value.toUpperCase())}
          />
          {errors?.zipPostalCode && (
            <Text id="address-zip-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
              {errors.zipPostalCode}
            </Text>
          )}
        </Box>
      </Box>
      )}

      <Text size="1" color="gray">
        {labels.country ?? "Country"}: {labels.countryValue ?? "Canada"}
      </Text>
    </Flex>
  );
}
