"use client";

import * as React from "react";
import { Text, Flex } from "@radix-ui/themes";
import { Label } from "@radix-ui/react-label";
import { PasswordField } from "@welpco/ui/password-field";
import { TextField } from "@welpco/ui/text-field";

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextField.Root> {
  label?: string;
  error?: string;
}

/**
 * `Input` is a **labeled-field composite** — `Label + TextField + error text`
 * with automatic `htmlFor`/`id`/`aria-describedby`/`aria-invalid` wiring.
 *
 * When you need the raw Radix primitive (e.g. to compose with `Slot` icons
 * inside), import `TextField` from `@welpco/ui/text-field` instead.
 */
const Input = React.forwardRef<
  React.ElementRef<typeof TextField.Root>,
  InputProps
>(({ label, error, size = "2", id, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <Flex direction="column" gap="1">
      {label && (
        <Label htmlFor={inputId}>
          <Text size="2" weight="medium">
            {label}
            {props.required && (
              <Text as="span" color="red" ml="1" aria-hidden="true">
                *
              </Text>
            )}
          </Text>
        </Label>
      )}
      {props.type === "password" ? (
        <PasswordField
          ref={ref}
          id={inputId}
          size={size}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          aria-required={props.required ? true : undefined}
          {...props}
        />
      ) : (
        <TextField.Root
          ref={ref}
          id={inputId}
          size={size}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          aria-required={props.required ? true : undefined}
          {...props}
        />
      )}
      {error && (
        <Text size="1" color="red" id={errorId} role="alert">
          {error}
        </Text>
      )}
    </Flex>
  );
});

Input.displayName = "Input";

export { Input };
