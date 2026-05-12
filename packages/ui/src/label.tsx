"use client";

import { Label as RadixLabel } from "@radix-ui/react-label";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface LabelProps
  extends ComponentPropsWithoutRef<typeof RadixLabel> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  (props, ref) => {
    return <RadixLabel ref={ref} {...props} />;
  }
);

Label.displayName = "Label";

