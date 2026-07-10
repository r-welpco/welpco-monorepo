"use client";

import * as React from "react";
import { Select as RadixSelect } from "@radix-ui/themes";

// Radix Themes passthrough with the same `size="2"` default as TextField /
// TextArea / Button, so a Select dropped next to sibling controls aligns
// without callers remembering to pin the size (bible §16: controls sharing a
// row share a size).
export const Select = (
  props: React.ComponentProps<typeof RadixSelect.Root>,
) => <RadixSelect.Root size="2" {...props} />;
export const SelectTrigger = RadixSelect.Trigger;
export const SelectContent = RadixSelect.Content;
export const SelectItem = RadixSelect.Item;
export const SelectGroup = RadixSelect.Group;
export const SelectLabel = RadixSelect.Label;
export const SelectSeparator = RadixSelect.Separator;

