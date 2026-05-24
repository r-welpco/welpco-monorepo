"use client";

import { useEffect, useState } from "react";
import { usePersonalizationStore } from "@/stores/personalizationStore";

/** Resolves light/dark from personalization theme mode (matches ThemeProvider). */
export function useResolvedThemeAppearance(): "light" | "dark" {
  const themeMode = usePersonalizationStore((s) => s.themeMode);
  const [appearance, setAppearance] = useState<"light" | "dark">("light");

  useEffect(() => {
    const sync = () => {
      if (themeMode === "dark") {
        setAppearance("dark");
        return;
      }
      if (themeMode === "light") {
        setAppearance("light");
        return;
      }
      setAppearance(
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      );
    };

    sync();

    if (themeMode !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => sync();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [themeMode]);

  useEffect(() => {
    const onThemeChange = () => {
      const root = document.documentElement;
      const dataTheme = root.getAttribute("data-theme");
      if (dataTheme === "dark" || dataTheme === "light") {
        setAppearance(dataTheme);
      }
    };
    window.addEventListener("theme-change", onThemeChange);
    return () => window.removeEventListener("theme-change", onThemeChange);
  }, []);

  return appearance;
}
