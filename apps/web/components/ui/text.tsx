"use client";

import { Text as RadixText } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export type TextProps = ComponentPropsWithoutRef<typeof RadixText>;

export const Text = forwardRef<HTMLElement, TextProps>(
  ({ size = "2", ...props }, ref) => {
    return <RadixText ref={ref} size={size} {...props} />;
  }
);

Text.displayName = "Text";

