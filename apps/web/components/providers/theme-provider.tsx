"use client";

import { Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { usePersonalizationStore } from "@/stores/personalizationStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode, translucentTheme, loadFromStorage } = usePersonalizationStore();
  const [appearance, setAppearance] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadFromStorage();
  }, [loadFromStorage]);

  // Determine actual appearance based on theme mode
  useEffect(() => {
    if (!mounted) return;

    let actualAppearance: "light" | "dark" = "light";

    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      actualAppearance = mediaQuery.matches ? "dark" : "light";
    } else {
      actualAppearance = themeMode;
    }

    setAppearance(actualAppearance);
  }, [themeMode, mounted]);

  // Listen for system preference changes when mode is "system"
  useEffect(() => {
    if (!mounted || themeMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      const newTheme = mediaQuery.matches ? "dark" : "light";
      setAppearance(newTheme);
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [themeMode, mounted]);

  // Update theme when appearance changes
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.setAttribute("data-theme", appearance);
    }
  }, [appearance, mounted]);

  if (!mounted) {
    return (
      <Theme appearance="light" accentColor="grass" panelBackground="translucent">
        {children}
      </Theme>
    );
  }

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

