"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { TextArea } from "@welpco/ui/text-area";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { Spinner } from "@welpco/ui/spinner";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export type AccountDeletionReason = {
  value: string;
  label: string;
};

export type AccountDeletionFormLabels = {
  title: string;
  description: string;
  whatHappensTitle: string;
  bulletSignedOut: string;
  bulletBookings: string;
  bulletMessages: string;
  bulletReviews: string;
  supportNote: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  feedbackLabel: string;
  feedbackPlaceholder: string;
  confirmLabel: string;
  confirmPlaceholder: string;
  submit: string;
  submitting: string;
  cancel: string;
  reasons: AccountDeletionReason[];
  validation: {
    feedbackMax: string;
  };
};

export interface AccountDeletionFormProps {
  loading?: boolean;
  error?: string;
  onSubmit?: (values: AccountDeletionValues) => void | Promise<void>;
  onCancel?: () => void;
  labels?: AccountDeletionFormLabels;
}

function createSchema(v: AccountDeletionFormLabels["validation"]) {
  return z.object({
    reason: z.string().optional(),
    feedback: z.string().max(500, v.feedbackMax).optional(),
  });
}

export type AccountDeletionValues = z.infer<ReturnType<typeof createSchema>>;

const DEFAULT_REASONS: AccountDeletionReason[] = [
  { value: "no_longer_need", label: "No longer need the service" },
  { value: "better_alternative", label: "Found a better alternative" },
  { value: "privacy", label: "Privacy concerns" },
  { value: "too_expensive", label: "Too expensive" },
  { value: "technical", label: "Technical issues" },
  { value: "other", label: "Other" },
];

const DEFAULT_LABELS: AccountDeletionFormLabels = {
  title: "Delete account",
  description:
    "We'll deactivate your account and sign you out. To restore it, contact support.",
  whatHappensTitle: "What happens when you delete",
  bulletSignedOut: "You're signed out and your profile is hidden from search.",
  bulletBookings: "Active bookings stay on the calendar — cancel or hand them off first.",
  bulletMessages: "Conversations stay on the other person's side of the thread.",
  bulletReviews: "Reviews you've left or received remain attached to those bookings.",
  supportNote:
    "You can reach out to support to restore your account or request full data removal.",
  reasonLabel: "Reason for deletion (optional)",
  reasonPlaceholder: "Select a reason",
  feedbackLabel: "Additional feedback (optional)",
  feedbackPlaceholder: "Tell us how we can improve...",
  confirmLabel: 'Type "DELETE" to confirm',
  confirmPlaceholder: "DELETE",
  submit: "Delete my account",
  submitting: "Deleting…",
  cancel: "Cancel",
  reasons: DEFAULT_REASONS,
  validation: {
    feedbackMax: "Feedback must be less than 500 characters",
  },
};

export function AccountDeletionForm({
  loading,
  error,
  onSubmit,
  onCancel,
  labels: labelsProp,
}: AccountDeletionFormProps) {
  const labels = labelsProp ?? DEFAULT_LABELS;
  const schema = useMemo(() => createSchema(labels.validation), [labels.validation]);
  const [confirmText, setConfirmText] = useState("");
  const form = useForm<AccountDeletionValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reason: "",
      feedback: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  const isConfirmValid = confirmText.toLowerCase() === "delete";

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {labels.description}
          </Text>
        </Box>

        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
          <Callout.Text>
            <Text weight="bold" mb="2">
              {labels.whatHappensTitle}
            </Text>
            <Flex direction="column" gap="1" mt="2" asChild>
              <ul>
                <li>• {labels.bulletSignedOut}</li>
                <li>• {labels.bulletBookings}</li>
                <li>• {labels.bulletMessages}</li>
                <li>• {labels.bulletReviews}</li>
              </ul>
            </Flex>
            <Text size="2" mt="2">
              {labels.supportNote}
            </Text>
          </Callout.Text>
        </Callout.Root>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" id="reason-label" size="2" weight="medium" mb={FORM_SPACING.labelGap} style={{ display: "block" }}>
              {labels.reasonLabel}
            </Text>
            <Select
              onValueChange={(value) => form.setValue("reason", value)}
              value={form.watch("reason")}
              disabled={loading}
            >
              <SelectTrigger
                id="reason"
                aria-labelledby="reason-label"
                placeholder={labels.reasonPlaceholder}
                style={{ width: "100%" }}
              />
              <SelectContent>
                {labels.reasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="medium" htmlFor="feedback" mb={FORM_SPACING.labelGap}>
              {labels.feedbackLabel}
            </Text>
            <TextArea
              id="feedback"
              rows={4}
              placeholder={labels.feedbackPlaceholder}
              disabled={loading}
              size="2"
              aria-invalid={form.formState.errors.feedback ? true : undefined}
              aria-describedby={
                form.formState.errors.feedback ? "feedback-error" : undefined
              }
              {...form.register("feedback")}
            />
            {form.formState.errors.feedback && (
              <Text id="feedback-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.feedback.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="medium" htmlFor="confirm-delete" mb={FORM_SPACING.labelGap}>
              {labels.confirmLabel}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="confirm-delete"
              placeholder={labels.confirmPlaceholder}
              disabled={loading}
              size="2"
              aria-required="true"
              value={confirmText}
              onChange={(e) =>
                setConfirmText((e.target as HTMLInputElement).value)
              }
            />
          </Box>

          <Flex
            gap="3"
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
                style={{ flex: 1, width: "100%", minWidth: 0 }}
              >
                {labels.cancel}
              </Button>
            )}
            <Button
              type="submit"
              color={SEMANTIC_COLOR.danger}
              size="2"
              disabled={loading || !isConfirmValid}
              style={{ flex: 1, width: "100%", minWidth: 0 }}
            >
              {loading ? <Spinner /> : labels.submit}
            </Button>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
