"use client";

import { Checkbox as RadixCheckbox } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface CheckboxProps extends ComponentPropsWithoutRef<typeof RadixCheckbox> {}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ ...props }, ref) => {
    return <RadixCheckbox ref={ref} {...props} />;
  }
);

Checkbox.displayName = "Checkbox";

