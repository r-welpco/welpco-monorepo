"use client";

import { IconButton as RadixIconButton } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface IconButtonProps extends ComponentPropsWithoutRef<typeof RadixIconButton> {}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "soft", size = "2", ...props }, ref) => {
    return <RadixIconButton ref={ref} variant={variant} size={size} {...props} />;
  }
);

IconButton.displayName = "IconButton";

