"use client";

import { Dialog as RadixDialog, Heading, Text, IconButton, Flex, Box } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import { type ComponentPropsWithoutRef } from "react";

export interface DialogProps extends ComponentPropsWithoutRef<typeof RadixDialog.Root> {
  title?: string;
  description?: string;
}

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
  title,
  description,
  children,
  ...props
}: DialogProps & { children: React.ReactNode }) {
  return (
    <RadixDialog.Content size="4" {...props}>
      <Flex direction="column" gap="4">
        {(title || description) && (
          <Box>
            {title && (
              <RadixDialog.Title>
                <Heading size="5">{title}</Heading>
              </RadixDialog.Title>
            )}
            {description && (
              <RadixDialog.Description>
                <Text size="2" color="gray" mt="2">
                  {description}
                </Text>
              </RadixDialog.Description>
            )}
          </Box>
        )}
        {children}
      </Flex>
      <RadixDialog.Close>
        <IconButton variant="ghost" color="gray" size="2" style={{ position: "absolute", top: "16px", right: "16px" }}>
          <Cross2Icon />
        </IconButton>
      </RadixDialog.Close>
    </RadixDialog.Content>
  );
}

