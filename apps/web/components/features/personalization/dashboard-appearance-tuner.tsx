"use client";

import { useCallback } from "react";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { IconButton } from "@welpco/ui/icon-button";
import { Slider } from "@welpco/ui/slider";
import { Switch } from "@welpco/ui/switch";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { SlidersHorizontal, X, Copy, RotateCcw } from "lucide-react";
import {
  APPEARANCE_TUNER_DEFAULTS,
  useAppearanceTunerStore,
} from "@/stores/appearanceTunerStore";
import {
  usePersonalizationStore,
  type ThemeMode,
} from "@/stores/personalizationStore";
import { backgrounds } from "@/lib/personalization/backgrounds";
import { useResolvedThemeAppearance } from "@/lib/hooks/use-resolved-theme-appearance";
import { useDashboardSettingsFormLabels } from "@/lib/i18n/use-dashboard-labels";

function pct(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <Box>
      <Flex justify="between" align="center" mb="2">
        <Text size="2" weight="medium">
          {label}
        </Text>
        <Text size="1" color="gray" style={{ fontVariantNumeric: "tabular-nums" }}>
          {display}
        </Text>
      </Flex>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => onChange(values[0] ?? value)}
      />
    </Box>
  );
}

export function DashboardAppearanceTuner() {
  const settingsFormLabels = useDashboardSettingsFormLabels();
  const appearance = useResolvedThemeAppearance();

  const panelOpen = useAppearanceTunerStore((s) => s.panelOpen);
  const backdropOpacityLight = useAppearanceTunerStore((s) => s.backdropOpacityLight);
  const backdropOpacityDark = useAppearanceTunerStore((s) => s.backdropOpacityDark);
  const tabStripAccentMix = useAppearanceTunerStore((s) => s.tabStripAccentMix);
  const panelOverrideEnabled = useAppearanceTunerStore((s) => s.panelOverrideEnabled);
  const panelSolidMix = useAppearanceTunerStore((s) => s.panelSolidMix);
  const setPanelOpen = useAppearanceTunerStore((s) => s.setPanelOpen);
  const setBackdropOpacityLight = useAppearanceTunerStore((s) => s.setBackdropOpacityLight);
  const setBackdropOpacityDark = useAppearanceTunerStore((s) => s.setBackdropOpacityDark);
  const setTabStripAccentMix = useAppearanceTunerStore((s) => s.setTabStripAccentMix);
  const setPanelOverrideEnabled = useAppearanceTunerStore((s) => s.setPanelOverrideEnabled);
  const setPanelSolidMix = useAppearanceTunerStore((s) => s.setPanelSolidMix);
  const resetTuner = useAppearanceTunerStore((s) => s.reset);

  const themeMode = usePersonalizationStore((s) => s.themeMode);
  const translucentTheme = usePersonalizationStore((s) => s.translucentTheme);
  const backgroundId = usePersonalizationStore((s) => s.backgroundId);
  const setThemeMode = usePersonalizationStore((s) => s.setThemeMode);
  const setTranslucentTheme = usePersonalizationStore((s) => s.setTranslucentTheme);
  const setBackground = usePersonalizationStore((s) => s.setBackground);

  const activeBackdrop =
    appearance === "dark" ? backdropOpacityDark : backdropOpacityLight;

  const configSnapshot = {
    themeMode,
    translucentTheme,
    backgroundId,
    backdropOpacityLight,
    backdropOpacityDark,
    tabStripAccentMix,
    panelOverrideEnabled,
    panelSolidMix,
  };

  const copyConfig = useCallback(async () => {
    await navigator.clipboard.writeText(JSON.stringify(configSnapshot, null, 2));
  }, [configSnapshot]);

  return (
    <>
      <Box
        style={{
          position: "fixed",
          bottom: "1.25rem",
          left: "1.25rem",
          zIndex: 9999,
        }}
      >
        {panelOpen ? (
          <Card
            size="3"
            variant="surface"
            style={{
              width: "min(340px, calc(100vw - 2rem))",
              maxHeight: "min(78vh, 640px)",
              overflow: "auto",
              marginBottom: "0.75rem",
              boxShadow: "var(--shadow-5)",
            }}
          >
            <Flex direction="column" gap="4" p="1">
              <Flex justify="between" align="center" gap="2">
                <Heading size="4" trim="start" mb="0">
                  Appearance tuner
                </Heading>
                <IconButton
                  variant="ghost"
                  size="2"
                  color="gray"
                  aria-label="Close appearance tuner"
                  onClick={() => setPanelOpen(false)}
                >
                  <X size={16} aria-hidden="true" />
                </IconButton>
              </Flex>

              <Text size="1" color="gray">
                Dev-only live controls. Adjusts backdrop, tab strip tint, and card
                translucency. Current mode:{" "}
                <Text weight="bold">{appearance}</Text>.
              </Text>

              <Box>
                <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                  {settingsFormLabels.themeMode}
                </Text>
                <Select
                  value={themeMode}
                  onValueChange={(value) => setThemeMode(value as ThemeMode)}
                >
                  <SelectTrigger placeholder={settingsFormLabels.themeModePlaceholder} />
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </Box>

              <Box>
                <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                  {settingsFormLabels.background}
                </Text>
                <Select value={backgroundId} onValueChange={setBackground}>
                  <SelectTrigger placeholder={settingsFormLabels.backgroundPlaceholder} />
                  <SelectContent>
                    {backgrounds.map((bg) => (
                      <SelectItem key={bg.id} value={bg.id}>
                        {bg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Box>

              <Flex align="center" justify="between" gap="3">
                <Box>
                  <Text size="2" weight="medium">
                    Translucent panels
                  </Text>
                  <Text size="1" color="gray">
                    Radix `panelBackground`
                  </Text>
                </Box>
                <Switch
                  checked={translucentTheme}
                  onCheckedChange={setTranslucentTheme}
                />
              </Flex>

              <SliderRow
                label="Backdrop opacity (light)"
                value={backdropOpacityLight}
                min={0}
                max={1}
                step={0.01}
                display={pct(backdropOpacityLight)}
                onChange={setBackdropOpacityLight}
              />

              <SliderRow
                label="Backdrop opacity (dark)"
                value={backdropOpacityDark}
                min={0}
                max={1}
                step={0.01}
                display={pct(backdropOpacityDark)}
                onChange={setBackdropOpacityDark}
              />

              <Text size="1" color="gray">
                Active backdrop: {pct(activeBackdrop)} ({appearance})
              </Text>

              <SliderRow
                label="Tab strip accent mix"
                value={tabStripAccentMix}
                min={0}
                max={30}
                step={1}
                display={`${tabStripAccentMix}%`}
                onChange={setTabStripAccentMix}
              />

              <Flex align="center" justify="between" gap="3">
                <Box>
                  <Text size="2" weight="medium">
                    Override panel opacity
                  </Text>
                  <Text size="1" color="gray">
                    `--color-panel-translucent`
                  </Text>
                </Box>
                <Switch
                  checked={panelOverrideEnabled}
                  onCheckedChange={setPanelOverrideEnabled}
                  disabled={!translucentTheme}
                />
              </Flex>

              <SliderRow
                label="Panel solid mix"
                value={panelSolidMix}
                min={50}
                max={100}
                step={1}
                display={panelOverrideEnabled ? `${panelSolidMix}%` : "Radix default"}
                onChange={setPanelSolidMix}
              />

              <Flex gap="2" wrap="wrap">
                <Button size="2" variant="soft" color="gray" onClick={() => resetTuner()}>
                  <RotateCcw size={14} aria-hidden="true" />
                  Reset sliders
                </Button>
                <Button size="2" variant="soft" color={SEMANTIC_COLOR.primary} onClick={() => void copyConfig()}>
                  <Copy size={14} aria-hidden="true" />
                  Copy JSON
                </Button>
              </Flex>

              <Text size="1" color="gray" as="p">
                Defaults: backdrop {pct(APPEARANCE_TUNER_DEFAULTS.backdropOpacityLight)},
                tab mix {APPEARANCE_TUNER_DEFAULTS.tabStripAccentMix}%, panel override off.
              </Text>
            </Flex>
          </Card>
        ) : null}

        <IconButton
          size="3"
          variant="solid"
          color={SEMANTIC_COLOR.primary}
          aria-label={panelOpen ? "Close appearance tuner" : "Open appearance tuner"}
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen(!panelOpen)}
          style={{ boxShadow: "var(--shadow-4)" }}
        >
          <SlidersHorizontal size={20} aria-hidden="true" />
        </IconButton>
      </Box>
    </>
  );
}
