"use client";

import { Link as RadixLink } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface LinkProps extends ComponentPropsWithoutRef<typeof RadixLink> {}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ ...props }, ref) => {
    return <RadixLink ref={ref} {...props} />;
  }
);

Link.displayName = "Link";

