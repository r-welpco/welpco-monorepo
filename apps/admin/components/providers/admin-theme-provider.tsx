"use client";

import { Theme } from "@radix-ui/themes";

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Theme appearance="dark" panelBackground="solid">
      {children}
    </Theme>
  );
}
