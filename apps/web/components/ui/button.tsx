"use client";

import { Button as RadixButton } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface ButtonProps extends ComponentPropsWithoutRef<typeof RadixButton> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "solid", color = "blue", size = "2", ...props }, ref) => {
    return (
      <RadixButton
        ref={ref}
        variant={variant}
        color={color}
        size={size}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

