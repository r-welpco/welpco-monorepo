"use client";

import { Strong as RadixStrong } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface StrongProps extends ComponentPropsWithoutRef<typeof RadixStrong> {}

export const Strong = forwardRef<HTMLElement, StrongProps>(
  ({ ...props }, ref) => {
    return <RadixStrong ref={ref} {...props} />;
  }
);

Strong.displayName = "Strong";

