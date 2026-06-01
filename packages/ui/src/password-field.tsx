"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";
import { IconButton } from "@welpco/ui/icon-button";
import { TextField, type TextFieldProps } from "@welpco/ui/text-field";

export interface PasswordFieldProps
  extends Omit<TextFieldProps, "type" | "children"> {
  /** Accessible label when password is hidden. */
  showPasswordLabel?: string;
  /** Accessible label when password is visible. */
  hidePasswordLabel?: string;
}

/**
 * Password input with a trailing show/hide control (`TextField.Slot` + eye icon).
 * Forwards ref to the underlying input for react-hook-form `register()`.
 */
export const PasswordField = forwardRef<
  React.ElementRef<typeof TextField.Root>,
  PasswordFieldProps
>(
  (
    {
      showPasswordLabel = "Show password",
      hidePasswordLabel = "Hide password",
      disabled,
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(false);

    return (
      <TextField.Root
        ref={ref}
        type={visible ? "text" : "password"}
        disabled={disabled}
        {...props}
      >
        <TextField.Slot side="right">
          <IconButton
            type="button"
            variant="ghost"
            color="gray"
            size="1"
            disabled={disabled}
            aria-label={visible ? hidePasswordLabel : showPasswordLabel}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </IconButton>
        </TextField.Slot>
      </TextField.Root>
    );
  },
);

PasswordField.displayName = "PasswordField";
