"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { TextArea } from "@welpco/ui/text-area";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

export interface AccountDeletionFormProps {
  loading?: boolean;
  error?: string;
  onSubmit?: (values: AccountDeletionValues) => void | Promise<void>;
  onCancel?: () => void;
}

const schema = z.object({
  reason: z.string().optional(),
  feedback: z.string().max(500, "Feedback must be less than 500 characters").optional(),
});

export type AccountDeletionValues = z.infer<typeof schema>;

const deletionReasons = [
  "No longer need the service",
  "Found a better alternative",
  "Privacy concerns",
  "Too expensive",
  "Technical issues",
  "Other",
];

export function AccountDeletionForm({
  loading,
  error,
  onSubmit,
  onCancel,
}: AccountDeletionFormProps) {
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
            Delete account
          </Heading>
          <Text size="2" color="gray">
            We&apos;ll deactivate your account and sign you out. To restore it, contact support.
          </Text>
        </Box>

        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
          <Callout.Text>
            <Text weight="bold" mb="2">
              What happens when you delete
            </Text>
            <Flex direction="column" gap="1" mt="2" asChild>
              <ul>
                <li>• You&apos;re signed out and your profile is hidden from search.</li>
                <li>• Active bookings stay on the calendar — cancel or hand them off first.</li>
                <li>• Conversations stay on the other person&apos;s side of the thread.</li>
                <li>• Reviews you&apos;ve left or received remain attached to those bookings.</li>
              </ul>
            </Flex>
            <Text size="2" mt="2">
              You can reach out to support to restore your account or request full data removal.
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
            <Text as="label" size="2" weight="bold" htmlFor="reason" mb={FORM_SPACING.labelGap}>
              Reason for deletion (optional)
            </Text>
            <Select
              onValueChange={(value) => form.setValue("reason", value)}
              value={form.watch("reason")}
              disabled={loading}
            >
              <SelectTrigger
                id="reason"
                aria-label="Reason for deletion (optional)"
                placeholder="Select a reason"
              />
              <SelectContent>
                {deletionReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="feedback" mb={FORM_SPACING.labelGap}>
              Additional feedback (optional)
            </Text>
            <TextArea
              id="feedback"
              rows={4}
              placeholder="Tell us how we can improve..."
              disabled={loading}
              size="2"
              {...form.register("feedback")}
            />
            {form.formState.errors.feedback && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.feedback.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="confirm-delete" mb={FORM_SPACING.labelGap}>
              Type &quot;DELETE&quot; to confirm
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="confirm-delete"
              placeholder="DELETE"
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
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              color={SEMANTIC_COLOR.danger}
              size="2"
              disabled={loading || !isConfirmValid}
              style={{ flex: 1, width: "100%", minWidth: 0 }}
            >
              {loading ? "Deleting…" : "Delete my account"}
            </Button>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

