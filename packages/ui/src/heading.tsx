"use client";

import { Heading as RadixHeading } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface HeadingProps extends ComponentPropsWithoutRef<typeof RadixHeading> {}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ size = "4", ...props }, ref) => {
    return <RadixHeading ref={ref} size={size} {...props} />;
  }
);

Heading.displayName = "Heading";

