"use client";

import { useState, useEffect } from "react";
import { Card } from "@welpco/ui/card";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Switch } from "@welpco/ui/switch";
import { usePersonalizationStore, type ThemeMode } from "@/stores/personalizationStore";
import { backgrounds, type BackgroundDefinition } from "@/lib/personalization/backgrounds";
import { Check, Sun, Moon, Monitor } from "lucide-react";
import type { PersonalizationAppearanceLabels } from "@/lib/i18n/use-dashboard-labels";

export type PersonalizationSettingsLabels = PersonalizationAppearanceLabels;

export function PersonalizationSettings({
  labels,
}: {
  labels?: PersonalizationSettingsLabels;
}) {
  const {
    themeMode,
    translucentTheme,
    backgroundId,
    setThemeMode,
    setTranslucentTheme,
    setBackground,
  } = usePersonalizationStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Card size="4" variant="surface" style={{ width: "100%" }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="7" trim="start" mb="2">
            {labels?.title ?? "Personalization"}
          </Heading>
          <Text size="2" color="gray">
            {labels?.description ?? "Customize your app appearance and theme."}
          </Text>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="3" style={{ display: "block" }}>
            {labels?.themeMode ?? "Theme Mode"}
          </Text>
          <Flex wrap="wrap" gap="3">
            <ThemePreview
              mode="light"
              isSelected={themeMode === "light"}
              onSelect={() => setThemeMode("light")}
              copy={labels?.theme.light}
            />
            <ThemePreview
              mode="dark"
              isSelected={themeMode === "dark"}
              onSelect={() => setThemeMode("dark")}
              copy={labels?.theme.dark}
            />
            <ThemePreview
              mode="system"
              isSelected={themeMode === "system"}
              onSelect={() => setThemeMode("system")}
              copy={labels?.theme.system}
            />
          </Flex>
        </Box>

        <Box>
          <Flex align="start" justify="between" gap="3">
            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
              <Text size="2" weight="medium" as="p" style={{ display: "block" }}>
                {labels?.translucentTheme ?? "Translucent Theme"}
              </Text>
              <Text size="1" color="gray" as="p" style={{ display: "block" }}>
                {labels?.translucentThemeHint ??
                  "Enable translucent panels and backgrounds"}
              </Text>
            </Flex>
            <Switch
              checked={translucentTheme}
              onCheckedChange={setTranslucentTheme}
            />
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="3" style={{ display: "block" }}>
            {labels?.background ?? "Background Color"}
          </Text>
          <Flex wrap="wrap" gap="3">
            {backgrounds.map((background) => (
              <BackgroundPreview
                key={background.id}
                background={background}
                isSelected={background.id === backgroundId}
                onSelect={() => setBackground(background.id)}
                copy={labels?.backgroundById[background.id]}
              />
            ))}
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
}

interface ThemePreviewProps {
  mode: ThemeMode;
  isSelected: boolean;
  onSelect: () => void;
  copy?: { name: string; description: string };
}

function ThemePreview({ mode, isSelected, onSelect, copy }: ThemePreviewProps) {
  const getThemeConfig = () => {
    switch (mode) {
      case "light":
        return {
          name: copy?.name ?? "Light",
          description: copy?.description ?? "Bright and clean",
          icon: Sun,
          gradient: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 50%, #e5e5e5 100%)",
          textColor: "#1a1a1a",
        };
      case "dark":
        return {
          name: copy?.name ?? "Dark",
          description: copy?.description ?? "Easy on the eyes",
          icon: Moon,
          gradient: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)",
          textColor: "#ffffff",
        };
      case "system":
        return {
          name: copy?.name ?? "System",
          description: copy?.description ?? "Follows device settings",
          icon: Monitor,
          gradient: "linear-gradient(135deg, #ffffff 0%, #808080 50%, #1a1a1a 100%)",
          textColor: "#1a1a1a",
        };
    }
  };

  const config = getThemeConfig();
  const Icon = config.icon;

  return (
    <Box
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: "var(--radius-3)",
        overflow: "hidden",
        border: isSelected ? "2px solid var(--green-9)" : "2px solid var(--gray-6)",
        transition: "border-color 0.2s",
        flex: "0 0 calc(33.333% - 8px)",
        minWidth: "120px",
        maxWidth: "200px",
      }}
      onClick={onSelect}
    >
      <Box
        style={{
          aspectRatio: "16/9",
          position: "relative",
          background: config.gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor:
              mode === "system" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            size={24}
            style={{
              color: mode === "light" ? "#1a1a1a" : mode === "dark" ? "#ffffff" : "#1a1a1a",
            }}
          />
        </Box>
        {isSelected && (
          <Box
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "var(--green-9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={16} style={{ color: "white" }} />
          </Box>
        )}
      </Box>
      <Box p="2" style={{ backgroundColor: "var(--gray-2)" }}>
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium" as="p" style={{ display: "block" }}>
            {config.name}
          </Text>
          <Text size="1" color="gray" as="p" style={{ display: "block" }}>
            {config.description}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

interface BackgroundPreviewProps {
  background: BackgroundDefinition;
  isSelected: boolean;
  onSelect: () => void;
  copy?: { name: string; description: string };
}

function BackgroundPreview({ background, isSelected, onSelect, copy }: BackgroundPreviewProps) {
  return (
    <Box
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: "var(--radius-3)",
        overflow: "hidden",
        border: isSelected ? "2px solid var(--green-9)" : "2px solid var(--gray-6)",
        transition: "border-color 0.2s",
        flex: "0 0 calc(33.333% - 8px)",
        minWidth: "120px",
        maxWidth: "200px",
      }}
      onClick={onSelect}
    >
      <Box
        style={{
          aspectRatio: "16/9",
          position: "relative",
          background: `linear-gradient(135deg, ${Object.values(background.cssVariables)[1]}, ${Object.values(background.cssVariables)[2]})`,
        }}
      >
        {isSelected && (
          <Box
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "var(--green-9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={16} style={{ color: "white" }} />
          </Box>
        )}
      </Box>
      <Box p="2" style={{ backgroundColor: "var(--gray-2)" }}>
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium" as="p" style={{ display: "block" }}>
            {copy?.name ?? background.name}
          </Text>
          <Text size="1" color="gray" as="p" style={{ display: "block" }}>
            {copy?.description ?? background.description}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
