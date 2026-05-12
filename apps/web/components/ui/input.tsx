"use client";

import * as React from "react";
import { TextField, Text, Flex } from "@radix-ui/themes";
import { Label } from "@radix-ui/react-label";

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextField.Root> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<
  React.ElementRef<typeof TextField.Root>,
  InputProps
>(({ label, error, size = "2", id, ...props }, ref) => {
  const inputId = id || React.useId();
  
  return (
    <Flex direction="column" gap="1">
      {label && (
        <Label htmlFor={inputId}>
          <Text size="2" weight="medium">
            {label}
            {props.required && (
              <Text as="span" color="red" ml="1">*</Text>
            )}
          </Text>
        </Label>
      )}
      <TextField.Root
        ref={ref}
        id={inputId}
        size={size}
        {...props}
      />
      {error && (
        <Text size="1" color="red">{error}</Text>
      )}
    </Flex>
  );
});

Input.displayName = "Input";

export { Input };

