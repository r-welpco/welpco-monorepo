"use client";

import { Label as RadixLabel } from "@radix-ui/react-label";
import { cn } from "@/lib/utils/cn";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface LabelProps
  extends ComponentPropsWithoutRef<typeof RadixLabel> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <RadixLabel
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      />
    );
  }
);

Label.displayName = "Label";

