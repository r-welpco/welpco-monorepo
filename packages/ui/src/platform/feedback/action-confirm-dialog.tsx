"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@welpco/ui/alert-dialog";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { TextArea } from "@welpco/ui/text-area";
import { Spinner } from "@welpco/ui/spinner";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";

export interface ActionConfirmDialogProps {
  /** Controlled open state. */
  open: boolean;
  /** Called when the dialog requests to open or close. */
  onOpenChange: (open: boolean) => void;
  /** A clear yes/no question — "Cancel booking?", "Delete payment method?". */
  title: string;
  /** What happens, why it might matter, what to do if unsure. */
  description: string | ReactNode;
  /** The verb-labelled confirm button — "Cancel booking", "Delete", "Discard". */
  confirmLabel: string;
  /** The verb-labelled cancel button — defaults to "Cancel". Override when there's a better verb ("Keep booking", "Continue editing"). */
  cancelLabel?: string;
  /** "primary" for routine confirms, "danger" for destructive. Defaults to "primary". */
  variant?: "primary" | "danger";
  /** While pending, the confirm button shows a Spinner and both buttons are disabled. */
  pending?: boolean;
  /** Optional reason input. When provided, a TextArea is rendered below the description and its value is passed to onConfirm. */
  reasonField?: {
    label: string;
    placeholder?: string;
    required?: boolean;
  };
  /** Called when the user confirms. Receives the trimmed reason when reasonField is provided. */
  onConfirm: (reason?: string) => void | Promise<void>;
}

/**
 * Canonical destructive / commit confirmation dialog (bible §17.6 + §25.4).
 *
 * Renders a Radix `<AlertDialog>` with a verb-labelled action row, async-aware
 * confirm button (Spinner while pending, disabled when a required reason is
 * empty), and an optional reason field for cancel/decline workflows.
 *
 * Replaces every `window.confirm` / `window.prompt` for destructive or
 * irreversible actions across the app.
 */
export function ActionConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "primary",
  pending = false,
  reasonField,
  onConfirm,
}: ActionConfirmDialogProps) {
  const [reason, setReason] = useState("");

  // Reset the reason whenever the dialog closes so the next opening starts clean.
  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const requiredEmpty = Boolean(
    reasonField?.required && reason.trim().length === 0,
  );

  const confirmColor =
    variant === "danger" ? SEMANTIC_COLOR.danger : SEMANTIC_COLOR.primary;

  const handleConfirmClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // AlertDialog.Action closes the dialog automatically. Prevent the
      // default close so the caller can decide when to close (i.e. after
      // the async handler resolves and they flip `open` to false).
      event.preventDefault();
      if (pending || requiredEmpty) return;
      const trimmed = reasonField ? reason.trim() : undefined;
      void onConfirm(trimmed || undefined);
    },
    [onConfirm, pending, reason, reasonField, requiredEmpty],
  );

  const reasonInputId = "action-confirm-reason";
  const reasonLabelId = "action-confirm-reason-label";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="2">
        <Flex direction="column" gap="4">
          <Box>
            <AlertDialogTitle size="5" trim="start" mb={FORM_SPACING.titleGap}>
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription size="2" color="gray" highContrast>
              {description}
            </AlertDialogDescription>
          </Box>

          {reasonField ? (
            <Box>
              <Text
                as="label"
                id={reasonLabelId}
                htmlFor={reasonInputId}
                size="2"
                weight="bold"
                mb={FORM_SPACING.labelGap}
              >
                {reasonField.label}
                {reasonField.required ? (
                  <Text
                    as="span"
                    color={SEMANTIC_COLOR.danger}
                    ml="1"
                    aria-hidden="true"
                  >
                    *
                  </Text>
                ) : null}
              </Text>
              <TextArea
                id={reasonInputId}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={reasonField.placeholder}
                rows={3}
                size="2"
                disabled={pending}
                aria-required={reasonField.required ? true : undefined}
                aria-labelledby={reasonLabelId}
              />
            </Box>
          ) : null}

          <Flex gap="3" justify="end" wrap="wrap" mt={FORM_SPACING.submitGap}>
            <AlertDialogCancel>
              <Button variant="soft" color="gray" disabled={pending}>
                {cancelLabel}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction>
              <Button
                variant="solid"
                color={confirmColor}
                disabled={pending || requiredEmpty}
                onClick={handleConfirmClick}
              >
                {pending ? (
                  <>
                    <Spinner size="2" />
                    <span>{confirmLabel}</span>
                  </>
                ) : (
                  confirmLabel
                )}
              </Button>
            </AlertDialogAction>
          </Flex>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
}

ActionConfirmDialog.displayName = "ActionConfirmDialog";
