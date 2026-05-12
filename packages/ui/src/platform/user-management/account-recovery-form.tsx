"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { RadioGroup } from "@welpco/ui/radio-group";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
}

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  recoveryMethod: z.enum(["email", "security_questions"]),
  securityAnswer: z.string().optional(),
});

export type AccountRecoveryValues = z.infer<typeof schema>;

export function AccountRecoveryForm({
  loading,
  error,
  onSubmit,
  onCancel,
  title,
  description,
  hideRecoveryMethod,
  successMessage,
}: AccountRecoveryFormProps) {
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
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="recovery-email" mb={FORM_SPACING.labelGap}>
              Email address
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="recovery-email"
              placeholder="you@example.com"
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

          {!hideRecoveryMethod && (
            <Box mb={FORM_SPACING.fieldGap}>
              <Text size="2" weight="bold" mb={FORM_SPACING.labelGap}>
                Recovery method
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <RadioGroup.Root
                value={recoveryMethod}
                onValueChange={(value) =>
                  form.setValue("recoveryMethod", value as "email" | "security_questions")
                }
                disabled={loading}
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
              <Text as="label" size="2" weight="bold" htmlFor="security-answer" mb={FORM_SPACING.labelGap}>
                Security answer
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <TextField.Root
                id="security-answer"
                placeholder="Enter your security answer"
                disabled={loading}
                size="2"
                {...form.register("securityAnswer")}
              />
              {form.formState.errors.securityAnswer && (
                <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.securityAnswer.message}
                </Text>
              )}
            </Box>
          )}

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
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              color={SEMANTIC_COLOR.primary}
              size="2"
              disabled={loading || Boolean(successMessage)}
              style={{ width: "100%", flex: 1, minWidth: 0 }}
            >
              {loading
                ? "Sending..."
                : hideRecoveryMethod
                  ? "Send reset link"
                  : "Recover account"}
            </Button>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

