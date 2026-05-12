"use client";

import { Switch as RadixSwitch } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface SwitchProps extends ComponentPropsWithoutRef<typeof RadixSwitch> {}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ ...props }, ref) => {
    return <RadixSwitch ref={ref} {...props} />;
  }
);

Switch.displayName = "Switch";

