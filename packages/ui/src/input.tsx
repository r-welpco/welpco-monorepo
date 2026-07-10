"use client";

import * as React from "react";
import { Box, Text } from "@radix-ui/themes";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { PasswordField } from "@welpco/ui/password-field";
import { TextField } from "@welpco/ui/text-field";

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextField.Root> {
  label?: string;
  error?: string;
  helper?: string;
}

/**
 * `Input` is a **labeled-field composite** — `label + TextField + error/helper
 * text` with automatic `htmlFor`/`id`/`aria-describedby`/`aria-invalid`
 * wiring. It is the reference implementation of bible §16.1: label
 * `size="2" weight="medium"` with `FORM_SPACING.labelGap` below, error/helper
 * `size="1"` with `FORM_SPACING.helperGap` above.
 *
 * When you need the raw Radix primitive (e.g. to compose with `Slot` icons
 * inside), import `TextField` from `@welpco/ui/text-field` instead.
 */
const Input = React.forwardRef<
  React.ElementRef<typeof TextField.Root>,
  InputProps
>(({ label, error, helper, size = "2", id, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = !error && helper ? `${inputId}-helper` : undefined;
  const describedBy = errorId ?? helperId;

  const fieldProps = {
    ref,
    id: inputId,
    size,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    "aria-required": props.required ? true : undefined,
    ...props,
  } as const;

  return (
    <Box>
      {label && (
        <Text
          as="label"
          size="2"
          weight="medium"
          htmlFor={inputId}
          mb={FORM_SPACING.labelGap}
          style={{ display: "block" }}
        >
          {label}
          {props.required && (
            <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
              *
            </Text>
          )}
        </Text>
      )}
      {props.type === "password" ? (
        <PasswordField {...fieldProps} />
      ) : (
        <TextField.Root {...fieldProps} />
      )}
      {error ? (
        <Text
          as="div"
          id={errorId}
          role="alert"
          size="1"
          color={SEMANTIC_COLOR.danger}
          mt={FORM_SPACING.helperGap}
        >
          {error}
        </Text>
      ) : helper ? (
        <Text as="div" id={helperId} size="1" color="gray" mt={FORM_SPACING.helperGap}>
          {helper}
        </Text>
      ) : null}
    </Box>
  );
});

Input.displayName = "Input";

export { Input };
