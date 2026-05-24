"use client";

import { useEffect } from "react";
import { useAppearanceTunerStore } from "@/stores/appearanceTunerStore";
import { usePersonalizationStore } from "@/stores/personalizationStore";

/** Applies live CSS overrides from the appearance tuner (dev only). */
export function AppearanceTunerEffects() {
  const panelOverrideEnabled = useAppearanceTunerStore((s) => s.panelOverrideEnabled);
  const panelSolidMix = useAppearanceTunerStore((s) => s.panelSolidMix);
  const translucentTheme = usePersonalizationStore((s) => s.translucentTheme);

  useEffect(() => {
    const apply = () => {
      const root = document.querySelector(".radix-themes") as HTMLElement | null;
      if (!root) return;

      if (!translucentTheme || !panelOverrideEnabled) {
        root.style.removeProperty("--color-panel-translucent");
        return;
      }

      root.style.setProperty(
        "--color-panel-translucent",
        `color-mix(in srgb, var(--color-panel-solid) ${panelSolidMix}%, transparent)`,
      );
    };

    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const root = document.querySelector(".radix-themes") as HTMLElement | null;
      root?.style.removeProperty("--color-panel-translucent");
    };
  }, [panelOverrideEnabled, panelSolidMix, translucentTheme]);

  return null;
}
