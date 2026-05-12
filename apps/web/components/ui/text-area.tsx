"use client";

import { TextArea as RadixTextArea } from "@radix-ui/themes";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface TextAreaProps extends ComponentPropsWithoutRef<typeof RadixTextArea> {}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ size = "2", rows = 3, ...props }, ref) => {
    return <RadixTextArea ref={ref} size={size} rows={rows} {...props} />;
  }
);

TextArea.displayName = "TextArea";

