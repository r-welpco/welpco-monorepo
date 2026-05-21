"use client";

import { Dialog as RadixDialog, IconButton, Flex, Box } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import { type ComponentPropsWithoutRef, type ReactNode } from "react";

export interface DialogProps extends ComponentPropsWithoutRef<typeof RadixDialog.Root> {
  title?: string;
  description?: string;
}

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;
export const DialogClose = RadixDialog.Close;

/** Raw Radix `Dialog.Content` without the `title`/`description`/close-button conveniences. */
export const DialogContentRaw = RadixDialog.Content;

type DialogContentProps = DialogProps &
  ComponentPropsWithoutRef<typeof RadixDialog.Content> & {
    children: ReactNode;
    /** Hide the header close-button. Defaults to `true`. */
    showCloseButton?: boolean;
  };

/**
 * Dialog content with an optional header row (title, description, close button).
 * The close button lives in a header Flex — no absolute positioning — so the
 * dialog body never has to reserve space for it.
 */
export function DialogContent({
  title,
  description,
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const hasHeader = Boolean(title || description || showCloseButton);

  return (
    <RadixDialog.Content size="4" {...props}>
      <Flex direction="column" gap="4">
        {hasHeader && (
          <Flex justify="between" align="start" gap="3">
            <Box flexGrow="1">
              {title && (
                <RadixDialog.Title size="5" trim="start">
                  {title}
                </RadixDialog.Title>
              )}
              {description && (
                <RadixDialog.Description size="2" color="gray" mt={title ? "2" : "0"}>
                  {description}
                </RadixDialog.Description>
              )}
            </Box>
            {showCloseButton && (
              <RadixDialog.Close>
                <IconButton variant="ghost" color="gray" size="2" aria-label="Close dialog">
                  <Cross2Icon />
                </IconButton>
              </RadixDialog.Close>
            )}
          </Flex>
        )}
        {children}
      </Flex>
    </RadixDialog.Content>
  );
}

DialogContent.displayName = "DialogContent";
