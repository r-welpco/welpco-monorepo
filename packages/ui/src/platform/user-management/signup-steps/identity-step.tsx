"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import type { SignupStateLite } from "./types";

/**
 * Day 15 — Phase 2 Dispatch A. Step 3 of the unified signup wizard.
 *
 * Captures identity fields shared by both customer and welper roles:
 *   - first name + last name
 *   - phone (validated client-side via libphonenumber-js; the BFF re-validates)
 *   - date of birth (≥ 13)
 *   - ToS + Privacy Policy acceptance (both required)
 *
 * Mobile-first single-task layout. Required-field markers per bible §16.3.
 * Phone uses a country-code Select + a national-format TextField; the form
 * concatenates them into an E.164 string at submit time. We avoid the heavy
 * `react-phone-number-input` dep — `libphonenumber-js` alone covers parsing
 * and validation, and a hand-rolled split keeps the visual hierarchy honest
 * with the rest of the wizard.
 */

const COUNTRY_CODES = [
  { code: "CA", label: "Canada (+1)", dial: "+1" },
  { code: "US", label: "United States (+1)", dial: "+1" },
  { code: "GB", label: "United Kingdom (+44)", dial: "+44" },
  { code: "AU", label: "Australia (+61)", dial: "+61" },
  { code: "FR", label: "France (+33)", dial: "+33" },
  { code: "DE", label: "Germany (+49)", dial: "+49" },
  { code: "IN", label: "India (+91)", dial: "+91" },
  { code: "MX", label: "Mexico (+52)", dial: "+52" },
] as const;

type CountryCode = (typeof COUNTRY_CODES)[number]["code"];

function isAtLeast13(dobIso: string): boolean {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 13;
}

const schema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(80, "First name must be 80 characters or fewer"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(80, "Last name must be 80 characters or fewer"),
  countryCode: z.string().min(2, "Pick a country") as z.ZodType<CountryCode>,
  phoneNational: z
    .string()
    .trim()
    .min(1, "Phone number is required"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Enter a valid date")
    .refine(isAtLeast13, "You must be at least 13 to sign up"),
  acceptTos: z.boolean().refine((v) => v === true, {
    message: "Accept the Terms of Service to continue",
  }),
  acceptPrivacy: z.boolean().refine((v) => v === true, {
    message: "Accept the Privacy Policy to continue",
  }),
});

type IdentityFormValues = z.infer<typeof schema>;

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
  onSubmit,
  onBack,
  termsHref = "/legal/terms",
  privacyHref = "/legal/privacy",
}: IdentityStepProps) {
  const filled = state.filledData.identity;
  // Best-effort split of a pre-filled phone into country + national format.
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

  const handleSubmit = form.handleSubmit(async (values) => {
    // Combine country + national into E.164 and re-validate before submitting.
    const phoneInput = `${values.phoneNational}`;
    const parsed = parsePhoneNumberFromString(
      phoneInput,
      values.countryCode as CountryCode,
    );
    if (!parsed?.isValid()) {
      form.setError("phoneNational", {
        type: "manual",
        message: "Enter a valid phone number for the selected country",
      });
      return;
    }
    const now = new Date().toISOString();
    await onSubmit({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: parsed.number, // E.164
      dateOfBirth: values.dateOfBirth,
      tosAcceptedAt: filled?.tosAcceptedAt ?? now,
      privacyAcceptedAt: filled?.privacyAcceptedAt ?? now,
    });
  });

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "560px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Tell us who you are
          </Heading>
          <Text size="2" color="gray">
            We use these details to confirm bookings and reach you about your
            account. They&apos;re never shown publicly without your say-so.
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
                First name
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  *
                </Text>
              </Text>
              <TextField.Root
                id="signup-first-name"
                placeholder="Jordan"
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
                Last name
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  *
                </Text>
              </Text>
              <TextField.Root
                id="signup-last-name"
                placeholder="Lee"
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
              Phone
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
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
                    placeholder="Country"
                    style={{ width: "100%" }}
                  />
                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
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
                  placeholder="416 555 1234"
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
              Date of birth
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
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
                You must be at least 13.
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
                I agree to the{" "}
                <Link href={termsHref} target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </Link>
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  *
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
                I&apos;ve read the{" "}
                <Link href={privacyHref} target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </Link>
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  *
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
