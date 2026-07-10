"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { PasswordField } from "@welpco/ui/password-field";
import { TextField } from "@welpco/ui/text-field";
import { Checkbox } from "@welpco/ui/checkbox";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { Link } from "@welpco/ui/link";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ReferralCodeInput } from "./referral-code-input";
import { useState } from "react";

export interface WelperRegisterFormProps {
  defaultValues?: Partial<WelperRegisterFormValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: WelperRegisterFormValues) => void | Promise<void>;
  onSignIn?: () => void;
  showReferralCode?: boolean;
  isMinor?: boolean;
  onGuardianRequired?: () => void;
}

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
    acknowledgeBackgroundCheck: z.boolean().optional(),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type WelperRegisterFormValues = z.infer<typeof schema>;

export function WelperRegisterForm({
  defaultValues,
  loading,
  error,
  onSubmit,
  onSignIn,
  showReferralCode = true,
  isMinor = false,
  onGuardianRequired,
}: WelperRegisterFormProps) {
  const [showReferral, setShowReferral] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const form = useForm<WelperRegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
      acknowledgeBackgroundCheck: false,
      referralCode: "",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (isMinor && onGuardianRequired) {
      onGuardianRequired();
      return;
    }

    const submitValues = {
      ...values,
      referralCode: showReferral ? referralCode : undefined,
    };
    await onSubmit?.(submitValues);
  });

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Become a Welper
          </Heading>
          <Text size="2" color="gray">
            {isMinor
              ? "A guardian account is required for minors (14-17)."
              : "Join Welpco to offer your services and grow your business."}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {isMinor && (
          <Callout.Root color={SEMANTIC_COLOR.info} variant="surface">
            <Callout.Text>
              Minors (14-17) require a guardian account. You'll be prompted to
              set up guardian information after registration.
            </Callout.Text>
          </Callout.Root>
        )}

        {!isMinor && (
          <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface">
            <Callout.Text>
              Adult Welpers (18+) must complete a background check before
              account activation. This will be initiated after email
              verification.
            </Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="medium" htmlFor="welper-email" mb={FORM_SPACING.labelGap}>
              {isMinor ? "Minor email" : "Email"}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="welper-email"
              placeholder="you@example.com"
              type="email"
              inputMode="email"
              autoComplete="email"
              disabled={loading}
              size="2"
              aria-required="true"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.email.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              size="2"
              weight="medium"
              htmlFor="welper-password"
              mb={FORM_SPACING.labelGap}
            >
              Password
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <PasswordField
              id="welper-password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              size="2"
              aria-required="true"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.password.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              size="2"
              weight="medium"
              htmlFor="welper-confirm"
              mb={FORM_SPACING.labelGap}
            >
              Confirm password
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <PasswordField
              id="welper-confirm"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              size="2"
              aria-required="true"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.confirmPassword.message}
              </Text>
            )}
          </Box>

          {showReferralCode && (
            <Box mb={FORM_SPACING.fieldGap}>
              {!showReferral ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="2"
                  color="gray"
                  onClick={() => setShowReferral(true)}
                >
                  Have a referral code?
                </Button>
              ) : (
                <ReferralCodeInput
                  defaultCode={referralCode}
                  onApply={(code) => {
                    setReferralCode(code);
                    form.setValue("referralCode", code);
                  }}
                />
              )}
            </Box>
          )}

          {!isMinor && (
            <Box mb={FORM_SPACING.fieldGap}>
              <Flex align="start" gap="3">
                <Checkbox
                  id="acknowledge-bg-check"
                  checked={form.watch("acknowledgeBackgroundCheck")}
                  onCheckedChange={(checked) =>
                    form.setValue("acknowledgeBackgroundCheck", Boolean(checked))
                  }
                  disabled={loading}
                  size="2"
                />
                <Text as="label" size="2" htmlFor="acknowledge-bg-check">
                  I understand that a background check is required for adult
                  Welpers and will be initiated after email verification.
                </Text>
              </Flex>
            </Box>
          )}

          <Box mb={FORM_SPACING.fieldGap}>
            <Flex align="start" gap="3">
              <Checkbox
                id="accept-terms-welper"
                checked={form.watch("acceptTerms")}
                onCheckedChange={(checked) =>
                  form.setValue("acceptTerms", Boolean(checked))
                }
                disabled={loading}
                size="2"
              />
              <Text as="label" size="2" htmlFor="accept-terms-welper">
                I agree to the{" "}
                <Link href="/terms" target="_blank">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank">
                  Privacy Policy
                </Link>
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
            </Flex>
            {form.formState.errors.acceptTerms && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.acceptTerms.message}
              </Text>
            )}
          </Box>

          <Button
            type="submit"
            size="2"
            color={SEMANTIC_COLOR.primary}
            disabled={loading}
            mt={FORM_SPACING.submitGap}
          >
            {loading
              ? "Creating account..."
              : isMinor
                ? "Continue to guardian setup"
                : "Create Welper account"}
          </Button>
        </form>

        {onSignIn && (
          <Flex align="center" justify="center" gap="2">
            <Text size="2" color="gray">
              Already have an account?
            </Text>
            <Link
              size="2"
              onClick={(e) => {
                e.preventDefault();
                onSignIn();
              }}
              style={{ cursor: "pointer" }}
            >
              Sign in
            </Link>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

