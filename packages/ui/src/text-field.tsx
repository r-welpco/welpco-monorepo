"use client";

import { TextField as RadixTextField } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface TextFieldProps
  extends ComponentPropsWithoutRef<typeof RadixTextField.Root> {}

/**
 * `TextField` is the **raw Radix primitive** — `Root` for the input and
 * `Slot` for leading/trailing adornments. Use this when you need full
 * composition control.
 *
 * For the common case of a labeled field with error text, use
 * {@link ./input.Input `Input`} from `@welpco/ui/input` instead.
 */
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
