"use client";

import { useMemo, useState } from "react";
import { Box } from "@welpco/ui/box";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { Text } from "@welpco/ui/text";
import { TextField } from "@welpco/ui/text-field";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import type { SignupStateLite } from "./types";

/**
 * Day 15 — Phase 2 Dispatch B. Welper-only step 4 of the unified signup wizard.
 *
 * Captures `city + province + country + postalCodes[]` per Wave 1's
 * `serviceAreaInfo` shape. The wizard's BFF DTO accepts at least one alphanumeric
 * postal-code prefix (e.g. "M5V"). The platform `<ServiceAreaSelector>`
 * primitive uses radius+address — different shape — so this step composes
 * basic field primitives directly.
 *
 * Country is currently CA / US (the two markets the wizard ships into);
 * province values follow ISO 3166-2 (e.g. "ON", "CA"). Postal codes are
 * accepted as alphanumeric prefixes (FSA root in Canada, ZIP root in the US).
 */

const COUNTRY_OPTIONS = [
  { code: "CA", label: "Canada" },
  { code: "US", label: "United States" },
] as const;

const POSTAL_PREFIX_REGEX = /^[A-Za-z0-9]{1,10}$/;

export interface WelperServiceAreaStepValues {
  city: string;
  province: string;
  country: string;
  postalCodes: string[];
}

export interface WelperServiceAreaStepProps {
  state: SignupStateLite;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: WelperServiceAreaStepValues) => void | Promise<void>;
  onBack?: () => void;
}

export function WelperServiceAreaStep({
  state,
  loading,
  error,
  onSubmit,
  onBack,
}: WelperServiceAreaStepProps) {
  const filled = state.filledData.welperServiceArea as
    | Partial<WelperServiceAreaStepValues>
    | undefined;
  const [city, setCity] = useState(filled?.city ?? "");
  const [province, setProvince] = useState(filled?.province ?? "");
  const [country, setCountry] = useState(filled?.country ?? "CA");
  const [postalCodes, setPostalCodes] = useState<string[]>(filled?.postalCodes ?? []);
  const [postalDraft, setPostalDraft] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [postalError, setPostalError] = useState<string | null>(null);

  const errors = useMemo(() => {
    return {
      city: city.trim().length === 0 ? "City is required" : null,
      province: province.trim().length < 2 ? "Province / state is required" : null,
      country: country.trim().length !== 2 ? "Pick a country" : null,
      postalCodes:
        postalCodes.length === 0
          ? "Add at least one postal-code prefix you serve"
          : null,
    };
  }, [city, province, country, postalCodes]);

  const formInvalid =
    !!errors.city || !!errors.province || !!errors.country || !!errors.postalCodes;

  const addPostal = () => {
    const trimmed = postalDraft.trim().toUpperCase();
    if (!trimmed) return;
    if (!POSTAL_PREFIX_REGEX.test(trimmed)) {
      setPostalError("Use 1–10 letters or digits, no spaces or punctuation");
      return;
    }
    if (postalCodes.includes(trimmed)) {
      setPostalError("That prefix is already in your list");
      return;
    }
    if (postalCodes.length >= 50) {
      setPostalError("That's the cap — 50 prefixes max");
      return;
    }
    setPostalCodes([...postalCodes, trimmed]);
    setPostalDraft("");
    setPostalError(null);
  };

  const removePostal = (code: string) => {
    setPostalCodes(postalCodes.filter((c) => c !== code));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (formInvalid) return;
    await onSubmit({
      city: city.trim(),
      province: province.trim().toUpperCase(),
      country: country.trim().toUpperCase(),
      postalCodes,
    });
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Where do you work?
          </Heading>
          <Text size="2" color="gray">
            Tell us the city you&apos;re based in and the postal-code areas you
            cover. Customers in those areas see you in search; those outside
            don&apos;t.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Flex direction={{ initial: "column", sm: "row" }} gap="3">
            <Box mb={FORM_SPACING.fieldGap} style={{ flex: 2, minWidth: 0 }}>
              <Text
                as="label"
                size="2"
                weight="bold"
                htmlFor="signup-city"
                mb={FORM_SPACING.labelGap}
              >
                City
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  *
                </Text>
              </Text>
              <TextField.Root
                id="signup-city"
                placeholder="Toronto"
                autoComplete="address-level2"
                size="2"
                disabled={loading}
                required
                aria-required="true"
                aria-invalid={submitted && errors.city ? true : undefined}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              {submitted && errors.city && (
                <Text
                  role="alert"
                  size="1"
                  color={SEMANTIC_COLOR.danger}
                  mt={FORM_SPACING.helperGap}
                >
                  {errors.city}
                </Text>
              )}
            </Box>

            <Box mb={FORM_SPACING.fieldGap} style={{ flex: 1, minWidth: 0 }}>
              <Text
                as="label"
                size="2"
                weight="bold"
                htmlFor="signup-province"
                mb={FORM_SPACING.labelGap}
              >
                Province / State
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  *
                </Text>
              </Text>
              <TextField.Root
                id="signup-province"
                placeholder="ON"
                autoComplete="address-level1"
                size="2"
                disabled={loading}
                required
                aria-required="true"
                aria-invalid={submitted && errors.province ? true : undefined}
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              />
              {submitted && errors.province && (
                <Text
                  role="alert"
                  size="1"
                  color={SEMANTIC_COLOR.danger}
                  mt={FORM_SPACING.helperGap}
                >
                  {errors.province}
                </Text>
              )}
            </Box>
          </Flex>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              id="signup-country-label"
              size="2"
              weight="bold"
              mb={FORM_SPACING.labelGap}
            >
              Country
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            </Text>
            <Select
              size="2"
              value={country}
              disabled={loading}
              onValueChange={setCountry}
            >
              <SelectTrigger
                aria-labelledby="signup-country-label"
                placeholder="Country"
                style={{ width: "100%" }}
              />
              <SelectContent>
                {COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="signup-postal"
              mb={FORM_SPACING.labelGap}
            >
              Postal-code prefixes you serve
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            </Text>
            <Flex gap="2">
              <Box style={{ flex: 1, minWidth: 0 }}>
                <TextField.Root
                  id="signup-postal"
                  placeholder="M5V"
                  size="2"
                  disabled={loading}
                  aria-required="true"
                  aria-invalid={
                    (submitted && errors.postalCodes) || postalError ? true : undefined
                  }
                  value={postalDraft}
                  onChange={(e) => {
                    setPostalDraft(e.target.value);
                    if (postalError) setPostalError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPostal();
                    }
                  }}
                />
              </Box>
              <Button
                type="button"
                size="2"
                variant="soft"
                color={SEMANTIC_COLOR.primary}
                disabled={loading || postalDraft.trim().length === 0}
                onClick={addPostal}
              >
                Add
              </Button>
            </Flex>
            {(postalError || (submitted && errors.postalCodes)) && (
              <Text
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {postalError ?? errors.postalCodes}
              </Text>
            )}
            {postalCodes.length > 0 && (
              <Flex gap="2" wrap="wrap" mt={FORM_SPACING.fieldGap}>
                {postalCodes.map((code) => (
                  <Badge
                    key={code}
                    color={SEMANTIC_COLOR.primary}
                    size="2"
                    variant="soft"
                  >
                    {code}
                    <Button
                      type="button"
                      variant="ghost"
                      color="gray"
                      size="1"
                      onClick={() => removePostal(code)}
                      aria-label={`Remove ${code}`}
                      disabled={loading}
                      ml="1"
                    >
                      ×
                    </Button>
                  </Badge>
                ))}
              </Flex>
            )}
            <Text size="1" color="gray" mt={FORM_SPACING.helperGap}>
              Add the first 3 characters of each postal code you cover (e.g.
              &quot;M5V&quot; in Toronto, &quot;90210&quot; in LA).
            </Text>
          </Box>

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
              {loading ? "Saving..." : "Continue"}
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
                Back
              </Button>
            )}
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
