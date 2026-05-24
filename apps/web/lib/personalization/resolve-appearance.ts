import type { ThemeMode } from "@/stores/personalizationStore";

export function resolveAppearance(
  themeMode: ThemeMode,
  systemDark: boolean,
): "light" | "dark" {
  if (themeMode === "dark") return "dark";
  if (themeMode === "light") return "light";
  return systemDark ? "dark" : "light";
}

export function subscribeSystemColorScheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

export function getSystemColorSchemeDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
