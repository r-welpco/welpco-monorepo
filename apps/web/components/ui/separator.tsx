"use client";

import { Separator as RadixSeparator } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface SeparatorProps extends ComponentPropsWithoutRef<typeof RadixSeparator> {}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ size = "4", ...props }, ref) => {
    return <RadixSeparator ref={ref} size={size} {...props} />;
  }
);

Separator.displayName = "Separator";

