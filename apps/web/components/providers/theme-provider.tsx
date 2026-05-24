"use client";

import { Theme } from "@radix-ui/themes";
import { useEffect, useSyncExternalStore } from "react";
import {
  getSystemColorSchemeDark,
  resolveAppearance,
  subscribeSystemColorScheme,
} from "@/lib/personalization/resolve-appearance";
import { usePersonalizationStore } from "@/stores/personalizationStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = usePersonalizationStore((s) => s.themeMode);
  const translucentTheme = usePersonalizationStore((s) => s.translucentTheme);
  const systemDark = useSyncExternalStore(
    subscribeSystemColorScheme,
    getSystemColorSchemeDark,
    () => false,
  );
  const appearance = resolveAppearance(themeMode, systemDark);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", appearance);
    document.documentElement.style.colorScheme = appearance;
  }, [appearance]);

  return (
    <Theme
      appearance={appearance}
      accentColor="grass"
      panelBackground={translucentTheme ? "translucent" : "solid"}
    >
      {children}
    </Theme>
  );
}
