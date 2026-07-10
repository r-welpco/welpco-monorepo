"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, type ReactNode } from "react";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { RadioGroup } from "@welpco/ui/radio-group";
import { Spinner } from "@welpco/ui/spinner";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  DEFAULT_ACCOUNT_RECOVERY_LABELS,
  type AccountRecoveryFormLabels,
} from "./signup-steps/labels";

export type { AccountRecoveryFormLabels } from "./signup-steps/labels";

export interface AccountRecoveryFormProps {
  loading?: boolean;
  error?: string;
  onSubmit?: (values: AccountRecoveryValues) => void | Promise<void>;
  onCancel?: () => void;
  /** Title shown at the top of the card. Defaults to "Recover account". */
  title?: string;
  /** Description below the title. Defaults to a generic recovery copy. */
  description?: string;
  /**
   * Hide the recovery-method radio group (email vs security questions). Use
   * this when only the email recovery flow is wired up. The submit button
   * label switches to a forgot-password verb when hidden.
   */
  hideRecoveryMethod?: boolean;
  /** Optional success state — replaces the form when truthy. */
  successMessage?: string;
  /** Rendered inside the form above the submit row (e.g. Turnstile). */
  footer?: ReactNode;
  /** Extra disable condition for submit (e.g. pending human verification). */
  submitDisabled?: boolean;
  /** Optional native title on submit when disabled (accessibility hint). */
  submitTitle?: string;
  labels?: AccountRecoveryFormLabels;
}

function createSchema(labels: AccountRecoveryFormLabels) {
  return z.object({
    email: z.string().email(labels.validation.emailInvalid),
    recoveryMethod: z.enum(["email", "security_questions"]),
    securityAnswer: z.string().optional(),
    website: z.string().max(200).optional(),
  });
}

export type AccountRecoveryValues = z.infer<ReturnType<typeof createSchema>>;

export function AccountRecoveryForm({
  loading,
  error,
  onSubmit,
  onCancel,
  title,
  description,
  hideRecoveryMethod,
  successMessage,
  footer,
  submitDisabled,
  submitTitle,
  labels: labelsProp,
}: AccountRecoveryFormProps) {
  const labels = labelsProp ?? DEFAULT_ACCOUNT_RECOVERY_LABELS;
  const schema = useMemo(() => createSchema(labels), [labels]);

  const form = useForm<AccountRecoveryValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      recoveryMethod: "email",
      securityAnswer: "",
    },
  });

  const recoveryMethod = form.watch("recoveryMethod");

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "520px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {title ?? "Recover account"}
          </Heading>
          <Text size="2" color="gray">
            {description ??
              (hideRecoveryMethod
                ? "Enter the email on your account. We'll send you a link to set a new password."
                : "Choose a recovery method to regain access to your account.")}
          </Text>
        </Box>

        {successMessage && (
          <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
            <Callout.Text>{successMessage}</Callout.Text>
          </Callout.Root>
        )}

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
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
            <label htmlFor="recovery-website">Leave this field blank</label>
            <input
              id="recovery-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...form.register("website")}
            />
          </div>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="medium" htmlFor="recovery-email" mb={FORM_SPACING.labelGap}>
              {labels.email}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="recovery-email"
              type="email"
              inputMode="email"
              placeholder={labels.emailPlaceholder}
              autoComplete="email"
              disabled={loading}
              size="2"
              aria-required="true"
              aria-invalid={form.formState.errors.email ? true : undefined}
              aria-describedby={
                form.formState.errors.email ? "recovery-email-error" : undefined
              }
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <Text id="recovery-email-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.email.message}
              </Text>
            )}
          </Box>

          {!hideRecoveryMethod && (
            <Box mb={FORM_SPACING.fieldGap}>
              <Text id="recovery-method-label" size="2" weight="medium" mb={FORM_SPACING.labelGap}>
                Recovery method
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <RadioGroup.Root
                value={recoveryMethod}
                onValueChange={(value) =>
                  form.setValue("recoveryMethod", value as "email" | "security_questions")
                }
                disabled={loading}
                aria-labelledby="recovery-method-label"
              >
                <Flex direction="column" gap="3">
                  <Text as="label" size="2">
                    <Flex direction="column" gap="1">
                      <Flex align="center" gap="2">
                        <RadioGroup.Item value="email" />
                        <Text weight="medium">Email recovery</Text>
                      </Flex>
                      <Text size="1" color="gray" ml="7">
                        Receive a recovery link via email
                      </Text>
                    </Flex>
                  </Text>
                  <Text as="label" size="2">
                    <Flex direction="column" gap="1">
                      <Flex align="center" gap="2">
                        <RadioGroup.Item value="security_questions" />
                        <Text weight="medium">Security questions</Text>
                      </Flex>
                      <Text size="1" color="gray" ml="7">
                        Answer your security questions
                      </Text>
                    </Flex>
                  </Text>
                </Flex>
              </RadioGroup.Root>
            </Box>
          )}

          {!hideRecoveryMethod && recoveryMethod === "security_questions" && (
            <Box mb={FORM_SPACING.fieldGap}>
              <Text as="label" size="2" weight="medium" htmlFor="security-answer" mb={FORM_SPACING.labelGap}>
                Security answer
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <TextField.Root
                id="security-answer"
                placeholder="Enter your security answer"
                disabled={loading}
                size="2"
                aria-invalid={form.formState.errors.securityAnswer ? true : undefined}
                aria-describedby={
                  form.formState.errors.securityAnswer
                    ? "security-answer-error"
                    : undefined
                }
                {...form.register("securityAnswer")}
              />
              {form.formState.errors.securityAnswer && (
                <Text id="security-answer-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.securityAnswer.message}
                </Text>
              )}
            </Box>
          )}

          {footer ? <Box mb={FORM_SPACING.fieldGap}>{footer}</Box> : null}

          <Flex
            gap="3"
            align="center"
            justify="end"
            mt={FORM_SPACING.submitGap}
            direction={{ initial: "column", sm: "row" }}
          >
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                color="gray"
                size="2"
                onClick={onCancel}
                style={{ width: "100%", flex: 1, minWidth: 0 }}
              >
                {labels.cancel}
              </Button>
            )}
            <Button
              type="submit"
              color={SEMANTIC_COLOR.primary}
              size="2"
              disabled={loading || Boolean(successMessage) || Boolean(submitDisabled)}
              title={submitDisabled ? submitTitle : undefined}
              style={{ width: "100%", flex: 1, minWidth: 0 }}
            >
              {loading ? (
                <Spinner />
              ) : hideRecoveryMethod ? (
                labels.sendResetLink
              ) : (
                labels.recoverAccount
              )}
            </Button>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
