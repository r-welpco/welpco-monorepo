"use client";

import { Badge as RadixBadge } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface BadgeProps extends ComponentPropsWithoutRef<typeof RadixBadge> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "soft", color = "blue", ...props }, ref) => {
    return (
      <RadixBadge
        ref={ref}
        variant={variant}
        color={color}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

