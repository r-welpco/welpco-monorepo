"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Link } from "@welpco/ui/link";
import { Progress } from "@welpco/ui/progress";
import { Text } from "@welpco/ui/text";
import { PasswordField } from "@welpco/ui/password-field";
import { TextField } from "@welpco/ui/text-field";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  DEFAULT_EMAIL_PASSWORD_LABELS,
  type EmailPasswordStepLabels,
} from "./labels";
import { SIGNUP_STEP_CARD_STYLE } from "./types";

/**
 * Day 15 — Phase 2 Dispatch A. Step 1 of the unified signup wizard.
 *
 * The first step the user sees. Captures email + password and submits to
 * `POST /auth/signup/begin`. The wizard auto-signs the user in on success
 * and routes them to `/register/step/select-role`.
 *
 * Mobile-first single-task layout per bible §2.4. Required-field markers per
 * §16.3 (`*` + `aria-required` + danger-coloured asterisk). Submit verb is
 * "Continue" — bible §22 prefers a directional verb to "Submit".
 *
 * Password strength is communicated visually (Progress bar) plus a short
 * helper line — never as a hard gate beyond the 8-char minimum the BFF
 * accepts. We don't reject "weak" passwords; we tell the user how to
 * strengthen one.
 */
export interface EmailPasswordStepValues {
  email: string;
  password: string;
  website?: string;
}

export interface EmailPasswordStepProps {
  defaultValues?: Partial<EmailPasswordStepValues>;
  loading?: boolean;
  /**
   * Structured server error. The wizard maps `ACCOUNT_EXISTS` (409) to a
   * dedicated message with a "Sign in" link; all other errors flow through
   * here verbatim.
   */
  error?: string | null;
  labels?: EmailPasswordStepLabels;
  onSubmit: (values: EmailPasswordStepValues) => void | Promise<void>;
  /** Optional callback for the "Sign in" link in the secondary CTA row. */
  onSignIn?: () => void;
}

function createSchema(labels: EmailPasswordStepLabels) {
  return z.object({
    email: z.string().trim().toLowerCase().email(labels.validation.emailInvalid),
    password: z
      .string()
      .min(8, labels.validation.passwordMinLength)
      .max(128, labels.validation.passwordMaxLength),
    website: z.string().max(200).optional(),
  });
}

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

function scorePassword(
  password: string,
  labels: EmailPasswordStepLabels,
): PasswordStrength {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const strengthLabels = [
    labels.strengthTooShort,
    labels.strengthWeak,
    labels.strengthFair,
    labels.strengthGood,
    labels.strengthStrong,
  ] as const;
  return { score: clamped, label: strengthLabels[clamped] };
}

export function EmailPasswordStep({
  defaultValues,
  loading,
  error,
  labels: labelsProp,
  onSubmit,
  onSignIn,
}: EmailPasswordStepProps) {
  const labels = labelsProp ?? DEFAULT_EMAIL_PASSWORD_LABELS;
  const schema = useMemo(() => createSchema(labels), [labels]);

  const form = useForm<EmailPasswordStepValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      ...defaultValues,
    },
  });

  const passwordValue = form.watch("password");
  const strength = useMemo(
    () => scorePassword(passwordValue ?? "", labels),
    [passwordValue, labels],
  );
  const strengthPct = (strength.score / 4) * 100;

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
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
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-10000px",
              top: "auto",
              width: 1,
              height: 1,
              overflow: "hidden",
            }}
          >
            <label htmlFor="signup-website">Leave this field blank</label>
            <input
              id="signup-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...form.register("website")}
            />
          </div>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="signup-email"
              mb={FORM_SPACING.labelGap}
            >
              {labels.email}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                {labels.requiredMarker}
              </Text>
            </Text>
            <TextField.Root
              id="signup-email"
              type="email"
              placeholder={labels.emailPlaceholder}
              autoComplete="email"
              inputMode="email"
              disabled={loading}
              size="2"
              required
              aria-required="true"
              aria-invalid={form.formState.errors.email ? true : undefined}
              aria-describedby={
                form.formState.errors.email ? "signup-email-error" : undefined
              }
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <Text
                id="signup-email-error"
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {form.formState.errors.email.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="signup-password"
              mb={FORM_SPACING.labelGap}
            >
              {labels.password}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                {labels.requiredMarker}
              </Text>
            </Text>
            <PasswordField
              id="signup-password"
              placeholder={labels.passwordPlaceholder}
              autoComplete="new-password"
              disabled={loading}
              size="2"
              required
              aria-required="true"
              aria-invalid={form.formState.errors.password ? true : undefined}
              aria-describedby={
                form.formState.errors.password
                  ? "signup-password-error"
                  : "signup-password-strength"
              }
              {...form.register("password")}
            />
            {passwordValue && passwordValue.length > 0 && (
              <Box mt={FORM_SPACING.helperGap}>
                <Progress
                  value={strengthPct}
                  size="1"
                  color={
                    strength.score >= 3
                      ? SEMANTIC_COLOR.success
                      : strength.score === 2
                      ? SEMANTIC_COLOR.warning
                      : SEMANTIC_COLOR.danger
                  }
                  aria-label={labels.passwordStrengthAria}
                />
                <Text
                  id="signup-password-strength"
                  size="1"
                  color="gray"
                  mt={FORM_SPACING.labelGap}
                >
                  {strength.label}
                  {strength.score < 3 && labels.strengthHint}
                </Text>
              </Box>
            )}
            {form.formState.errors.password && (
              <Text
                id="signup-password-error"
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {form.formState.errors.password.message}
              </Text>
            )}
          </Box>

          <Button
            type="submit"
            size="3"
            color={SEMANTIC_COLOR.primary}
            disabled={loading}
            mt={FORM_SPACING.submitGap}
            style={{ width: "100%" }}
          >
            {loading ? labels.creatingAccount : labels.continue}
          </Button>
        </form>

        {onSignIn && (
          <Flex align="center" justify="center" gap="2">
            <Text size="2" color="gray">
              {labels.alreadyHaveAccount}
            </Text>
            <Link
              size="2"
              weight="medium"
              onClick={(e) => {
                e.preventDefault();
                onSignIn();
              }}
              style={{ cursor: "pointer" }}
            >
              {labels.signIn}
            </Link>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
