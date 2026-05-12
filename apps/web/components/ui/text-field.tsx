"use client";

import { TextField as RadixTextField } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface TextFieldProps
  extends ComponentPropsWithoutRef<typeof RadixTextField.Root> {}

export const TextField = {
  Root: forwardRef<
    React.ElementRef<typeof RadixTextField.Root>,
    TextFieldProps
  >(({ size = "2", ...props }, ref) => {
    return <RadixTextField.Root ref={ref} size={size} {...props} />;
  }),
  Slot: RadixTextField.Slot,
};

TextField.Root.displayName = "TextField.Root";

