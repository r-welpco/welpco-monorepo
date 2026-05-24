import { create } from "zustand";

/** Session-only knobs for tuning dashboard appearance (dev tool — not persisted). */
export interface AppearanceTunerState {
  panelOpen: boolean;
  /** Decorative SVG backdrop opacity in light mode (0–1). */
  backdropOpacityLight: number;
  /** Decorative SVG backdrop opacity in dark mode (0–1). */
  backdropOpacityDark: number;
  /** Tab strip `color-mix` accent percentage (0–30). */
  tabStripAccentMix: number;
  /** When true, overrides Radix `--color-panel-translucent` while translucent panels are on. */
  panelOverrideEnabled: boolean;
  /** Solid portion of translucent panels (50–100). */
  panelSolidMix: number;
  setPanelOpen: (open: boolean) => void;
  setBackdropOpacityLight: (value: number) => void;
  setBackdropOpacityDark: (value: number) => void;
  setTabStripAccentMix: (value: number) => void;
  setPanelOverrideEnabled: (enabled: boolean) => void;
  setPanelSolidMix: (value: number) => void;
  reset: () => void;
}

export const APPEARANCE_TUNER_DEFAULTS = {
  backdropOpacityLight: 0.5,
  backdropOpacityDark: 0.5,
  tabStripAccentMix: 8,
  panelOverrideEnabled: false,
  panelSolidMix: 80,
} as const;

export const useAppearanceTunerStore = create<AppearanceTunerState>((set) => ({
  panelOpen: false,
  ...APPEARANCE_TUNER_DEFAULTS,
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setBackdropOpacityLight: (backdropOpacityLight) => set({ backdropOpacityLight }),
  setBackdropOpacityDark: (backdropOpacityDark) => set({ backdropOpacityDark }),
  setTabStripAccentMix: (tabStripAccentMix) => set({ tabStripAccentMix }),
  setPanelOverrideEnabled: (panelOverrideEnabled) => set({ panelOverrideEnabled }),
  setPanelSolidMix: (panelSolidMix) => set({ panelSolidMix }),
  reset: () => set({ ...APPEARANCE_TUNER_DEFAULTS }),
}));
