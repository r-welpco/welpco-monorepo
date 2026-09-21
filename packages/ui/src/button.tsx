"use client";

import { Button as RadixButton, ThemeContext } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef, useContext } from "react";

import { SEMANTIC_COLOR } from "./tokens";

export interface ButtonProps extends ComponentPropsWithoutRef<typeof RadixButton> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "solid", size = "2", highContrast, ...props }, ref) => {
    const theme = useContext(ThemeContext);
    const primarySolid = variant === "solid" &&
      (props.color ?? theme?.accentColor) === SEMANTIC_COLOR.primary;
    return (
      <RadixButton
        ref={ref}
        variant={variant}
        size={size}
        highContrast={highContrast ?? (primarySolid ? true : undefined)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
