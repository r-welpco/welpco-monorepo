"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Checkbox } from "@welpco/ui/checkbox";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Link } from "@welpco/ui/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { Text } from "@welpco/ui/text";
import { TextField } from "@welpco/ui/text-field";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  DEFAULT_IDENTITY_LABELS,
  type IdentityStepLabels,
} from "./labels";
import { SIGNUP_STEP_CARD_STYLE, signupStepNavButtonStyle, type SignupStateLite } from "./types";

/**
 * Day 15 — Phase 2 Dispatch A. Step 3 of the unified signup wizard.
 *
 * Captures identity fields shared by both customer and welper roles:
 *   - first name + last name
 *   - phone (validated client-side via libphonenumber-js; the BFF re-validates)
 *   - date of birth (18+ for customers and Welpers; 14–17 Welpers see a coming-soon modal)
 *   - ToS + Privacy Policy acceptance (both required)
 *
 * Mobile-first single-task layout. Required-field markers per bible §16.3.
 * Phone uses a country-code Select + a national-format TextField; the form
 * concatenates them into an E.164 string at submit time. We avoid the heavy
 * `react-phone-number-input` dep — `libphonenumber-js` alone covers parsing
 * and validation, and a hand-rolled split keeps the visual hierarchy honest
 * with the rest of the wizard.
 */

const SUPPORTED_COUNTRY_CODES = [
  "CA",
  "US",
  "GB",
  "AU",
  "FR",
  "DE",
  "IN",
  "MX",
] as const;

type CountryCode = (typeof SUPPORTED_COUNTRY_CODES)[number];

function calculateAgeUtc(dobIso: string): number | null {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}

function createSchema(labels: IdentityStepLabels) {
  return z.object({
    firstName: z
      .string()
      .trim()
      .min(1, labels.validation.firstNameRequired)
      .max(80, labels.validation.firstNameMax),
    lastName: z
      .string()
      .trim()
      .min(1, labels.validation.lastNameRequired)
      .max(80, labels.validation.lastNameMax),
    countryCode: z.string().min(2, labels.validation.countryRequired) as z.ZodType<CountryCode>,
    phoneNational: z.string().trim().min(1, labels.validation.phoneRequired),
    dateOfBirth: z
      .string()
      .min(1, labels.validation.dobRequired)
      .refine((v) => !Number.isNaN(new Date(v).getTime()), labels.validation.dobInvalid),
    acceptTos: z.boolean().refine((v) => v === true, {
      message: labels.validation.tosRequired,
    }),
    acceptPrivacy: z.boolean().refine((v) => v === true, {
      message: labels.validation.privacyRequired,
    }),
  });
}

type IdentityFormValues = z.infer<ReturnType<typeof createSchema>>;

export interface IdentityStepSubmitValues {
  firstName: string;
  lastName: string;
  /** E.164 — already validated by libphonenumber-js. */
  phone: string;
  /** ISO 8601 date (YYYY-MM-DD). */
  dateOfBirth: string;
  /** ISO datetime captured at submit time. */
  tosAcceptedAt: string;
  /** ISO datetime captured at submit time. */
  privacyAcceptedAt: string;
}

export interface IdentityStepProps {
  state: SignupStateLite;
  loading?: boolean;
  error?: string | null;
  labels?: IdentityStepLabels;
  onSubmit: (values: IdentityStepSubmitValues) => void | Promise<void>;
  onBack?: () => void;
  /** Hrefs for the legal documents — defaults to the canonical paths. */
  termsHref?: string;
  privacyHref?: string;
}

export function IdentityStep({
  state,
  loading,
  error,
  labels: labelsProp,
  onSubmit,
  onBack,
  termsHref = "/legal/terms",
  privacyHref = "/legal/privacy",
}: IdentityStepProps) {
  const labels = labelsProp ?? DEFAULT_IDENTITY_LABELS;
  const schema = useMemo(() => createSchema(labels), [labels]);
  const selectedRole = state.selectedRole;

  const filled = state.filledData.identity;
  const parsedExisting = filled?.phone
    ? parsePhoneNumberFromString(filled.phone)
    : undefined;

  const form = useForm<IdentityFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: filled?.firstName ?? "",
      lastName: filled?.lastName ?? "",
      countryCode: (parsedExisting?.country as CountryCode) ?? "CA",
      phoneNational: parsedExisting?.nationalNumber
        ? String(parsedExisting.nationalNumber)
        : "",
      dateOfBirth: filled?.dateOfBirth ?? "",
      acceptTos: Boolean(filled?.tosAcceptedAt),
      acceptPrivacy: Boolean(filled?.privacyAcceptedAt),
    },
  });

  const countryCode = form.watch("countryCode");
  const navButtonStyle = signupStepNavButtonStyle(Boolean(onBack));

  const handleSubmit = form.handleSubmit(async (values) => {
    const phoneInput = `${values.phoneNational}`;
    const parsed = parsePhoneNumberFromString(
      phoneInput,
      values.countryCode as CountryCode,
    );
    if (!parsed?.isValid()) {
      form.setError("phoneNational", {
        type: "manual",
        message: labels.validation.phoneInvalid,
      });
      return;
    }

    const age = calculateAgeUtc(values.dateOfBirth);
    if (age === null) {
      form.setError("dateOfBirth", {
        type: "manual",
        message: labels.validation.dobInvalid,
      });
      return;
    }

    if (selectedRole === "welper" && age < 14) {
      form.setError("dateOfBirth", {
        type: "manual",
        message: labels.validation.dobTooYoung,
      });
      return;
    }

    if (selectedRole === "customer" && age < 18) {
      form.setError("dateOfBirth", {
        type: "manual",
        message: labels.validation.dobMinAge,
      });
      return;
    }

    const now = new Date().toISOString();
    await onSubmit({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: parsed.number,
      dateOfBirth: values.dateOfBirth,
      tosAcceptedAt: filled?.tosAcceptedAt ?? now,
      privacyAcceptedAt: filled?.privacyAcceptedAt ?? now,
    });
  });

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

        <form onSubmit={handleSubmit} noValidate>
          <Flex direction={{ initial: "column", sm: "row" }} gap="3">
            <Box mb={FORM_SPACING.fieldGap} style={{ flex: 1, minWidth: 0 }}>
              <Text
                as="label"
                size="2"
                weight="bold"
                htmlFor="signup-first-name"
                mb={FORM_SPACING.labelGap}
              >
                {labels.firstName}
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  {labels.requiredMarker}
                </Text>
              </Text>
              <TextField.Root
                id="signup-first-name"
                placeholder={labels.firstNamePlaceholder}
                autoComplete="given-name"
                disabled={loading}
                size="2"
                required
                aria-required="true"
                aria-invalid={form.formState.errors.firstName ? true : undefined}
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName && (
                <Text
                  role="alert"
                  size="1"
                  color={SEMANTIC_COLOR.danger}
                  mt={FORM_SPACING.helperGap}
                >
                  {form.formState.errors.firstName.message}
                </Text>
              )}
            </Box>

            <Box mb={FORM_SPACING.fieldGap} style={{ flex: 1, minWidth: 0 }}>
              <Text
                as="label"
                size="2"
                weight="bold"
                htmlFor="signup-last-name"
                mb={FORM_SPACING.labelGap}
              >
                {labels.lastName}
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  {labels.requiredMarker}
                </Text>
              </Text>
              <TextField.Root
                id="signup-last-name"
                placeholder={labels.lastNamePlaceholder}
                autoComplete="family-name"
                disabled={loading}
                size="2"
                required
                aria-required="true"
                aria-invalid={form.formState.errors.lastName ? true : undefined}
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName && (
                <Text
                  role="alert"
                  size="1"
                  color={SEMANTIC_COLOR.danger}
                  mt={FORM_SPACING.helperGap}
                >
                  {form.formState.errors.lastName.message}
                </Text>
              )}
            </Box>
          </Flex>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              id="signup-phone-label"
              size="2"
              weight="bold"
              mb={FORM_SPACING.labelGap}
            >
              {labels.phone}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                {labels.requiredMarker}
              </Text>
            </Text>
            <Flex direction={{ initial: "column", sm: "row" }} gap="2">
              <Box style={{ minWidth: "180px" }}>
                <Select
                  size="2"
                  value={countryCode}
                  disabled={loading}
                  onValueChange={(value) =>
                    form.setValue("countryCode", value as CountryCode, {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger
                    aria-labelledby="signup-phone-label"
                    placeholder={labels.countryPlaceholder}
                    style={{ width: "100%" }}
                  />
                  <SelectContent>
                    {labels.countryOptions.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Box>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <TextField.Root
                  id="signup-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder={labels.phonePlaceholder}
                  autoComplete="tel-national"
                  disabled={loading}
                  size="2"
                  required
                  aria-required="true"
                  aria-invalid={
                    form.formState.errors.phoneNational ? true : undefined
                  }
                  {...form.register("phoneNational")}
                />
              </Box>
            </Flex>
            {form.formState.errors.phoneNational && (
              <Text
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {form.formState.errors.phoneNational.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="signup-dob"
              mb={FORM_SPACING.labelGap}
            >
              {labels.dateOfBirth}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                {labels.requiredMarker}
              </Text>
            </Text>
            <TextField.Root
              id="signup-dob"
              type="date"
              inputMode="numeric"
              autoComplete="bday"
              disabled={loading}
              size="2"
              required
              aria-required="true"
              aria-invalid={form.formState.errors.dateOfBirth ? true : undefined}
              {...form.register("dateOfBirth")}
            />
            {form.formState.errors.dateOfBirth ? (
              <Text
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {form.formState.errors.dateOfBirth.message}
              </Text>
            ) : (
              <Text size="1" color="gray" mt={FORM_SPACING.helperGap}>
                {labels.dobHint}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Flex align="start" gap="3">
              <Checkbox
                id="signup-tos"
                checked={form.watch("acceptTos")}
                onCheckedChange={(c) =>
                  form.setValue("acceptTos", Boolean(c), { shouldValidate: true })
                }
                disabled={loading}
                size="2"
                aria-required="true"
              />
              <Text as="label" size="2" htmlFor="signup-tos">
                {labels.tosPrefix}{" "}
                <Link href={termsHref} target="_blank" rel="noopener noreferrer">
                  {labels.tosLink}
                </Link>
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  {labels.requiredMarker}
                </Text>
              </Text>
            </Flex>
            {form.formState.errors.acceptTos && (
              <Text
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {form.formState.errors.acceptTos.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Flex align="start" gap="3">
              <Checkbox
                id="signup-privacy"
                checked={form.watch("acceptPrivacy")}
                onCheckedChange={(c) =>
                  form.setValue("acceptPrivacy", Boolean(c), {
                    shouldValidate: true,
                  })
                }
                disabled={loading}
                size="2"
                aria-required="true"
              />
              <Text as="label" size="2" htmlFor="signup-privacy">
                {labels.privacyPrefix}{" "}
                <Link href={privacyHref} target="_blank" rel="noopener noreferrer">
                  {labels.privacyLink}
                </Link>
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  {labels.requiredMarker}
                </Text>
              </Text>
            </Flex>
            {form.formState.errors.acceptPrivacy && (
              <Text
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {form.formState.errors.acceptPrivacy.message}
              </Text>
            )}
          </Box>

          <Flex
            direction={{ initial: "column", sm: "row-reverse" }}
            gap="3"
            mt={FORM_SPACING.submitGap}
            style={{ width: "100%" }}
          >
            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading}
              style={navButtonStyle}
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
                style={navButtonStyle}
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
