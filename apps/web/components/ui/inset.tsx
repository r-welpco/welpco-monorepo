"use client";

import { Inset as RadixInset } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface InsetProps extends ComponentPropsWithoutRef<typeof RadixInset> {}

export const Inset = forwardRef<HTMLDivElement, InsetProps>(
  ({ ...props }, ref) => {
    return <RadixInset ref={ref} {...props} />;
  }
);

Inset.displayName = "Inset";

