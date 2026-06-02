"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export type EmailUpdateFormLabels = {
  title: string;
  description: string;
  emailLabel: string;
  emailPlaceholder: string;
  hint: string;
  submit: string;
  submitting?: string;
  validation: {
    emailInvalid: string;
  };
};

export interface EmailUpdateFormProps {
  defaultEmail?: string;
  loading?: boolean;
  error?: string;
  successMessage?: string;
  onSubmit?: (values: EmailUpdateValues) => void | Promise<void>;
  labels?: EmailUpdateFormLabels;
}

function createSchema(messages: EmailUpdateFormLabels["validation"]) {
  return z.object({
    email: z.string().email(messages.emailInvalid),
  });
}

export type EmailUpdateValues = z.infer<ReturnType<typeof createSchema>>;

const DEFAULT_LABELS: EmailUpdateFormLabels = {
  title: "Update email",
  description:
    "Change the email you sign in with. You'll need to verify the new address before your account is fully secured.",
  emailLabel: "Email Address",
  emailPlaceholder: "your@email.com",
  hint: "Your sign-in email changes right away. We'll ask you to verify the new address from the verification screen.",
  submit: "Update email",
  submitting: "Updating...",
  validation: {
    emailInvalid: "Enter a valid email",
  },
};

export function EmailUpdateForm({
  defaultEmail = "",
  loading,
  error,
  successMessage,
  onSubmit,
  labels: labelsProp,
}: EmailUpdateFormProps) {
  const labels = labelsProp ?? DEFAULT_LABELS;
  const schema = useMemo(() => createSchema(labels.validation), [labels.validation]);

  const form = useForm<EmailUpdateValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: defaultEmail,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {labels.description}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {successMessage && (
          <Callout.Root color={SEMANTIC_COLOR.success} variant="surface">
            <Callout.Text>{successMessage}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="email-update" mb={FORM_SPACING.labelGap}>
              {labels.emailLabel}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="email-update"
              placeholder={labels.emailPlaceholder}
              size="2"
              disabled={loading}
              required
              aria-required="true"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.email.message}
              </Text>
            )}
            <Text size="1" color="gray" mt={FORM_SPACING.helperGap}>
              {labels.hint}
            </Text>
          </Box>

          <Button type="submit" size="2" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? (labels.submitting ?? "Updating...") : labels.submit}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}
