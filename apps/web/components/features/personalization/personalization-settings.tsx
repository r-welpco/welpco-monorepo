"use client";

import { useState, useEffect } from "react";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Switch } from "@welpco/ui/switch";
import { usePersonalizationStore, type ThemeMode } from "@/stores/personalizationStore";
import { backgrounds, getBackgroundById, type BackgroundDefinition } from "@/lib/personalization/backgrounds";
import { Check, Sun, Moon, Monitor } from "lucide-react";

export function PersonalizationSettings() {
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

  const selectedBackground = getBackgroundById(backgroundId);

  return (
    <Card size="4" variant="surface" style={{ width: "100%" }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="7" trim="start" mb="2">
            Personalization
          </Heading>
          <Text size="2" color="gray">
            Customize your app appearance and theme.
          </Text>
        </Box>

        {/* Theme Mode */}
        <Box>
          <Text as="label" size="2" weight="bold" mb="3" style={{ display: "block" }}>
            Theme Mode
          </Text>
          <Flex wrap="wrap" gap="3">
            <ThemePreview
              mode="light"
              isSelected={themeMode === "light"}
              onSelect={() => setThemeMode("light")}
            />
            <ThemePreview
              mode="dark"
              isSelected={themeMode === "dark"}
              onSelect={() => setThemeMode("dark")}
            />
            <ThemePreview
              mode="system"
              isSelected={themeMode === "system"}
              onSelect={() => setThemeMode("system")}
            />
          </Flex>
        </Box>

        {/* Translucent Theme */}
        <Box>
          <Flex align="center" justify="between">
            <Box>
              <Text size="2" weight="medium">
                Translucent Theme
              </Text>
              <Text size="1" color="gray">
                Enable translucent panels and backgrounds
              </Text>
            </Box>
            <Switch
              checked={translucentTheme}
              onCheckedChange={setTranslucentTheme}
            />
          </Flex>
        </Box>

            {/* Background Color Selection */}
            <Box>
              <Text as="label" size="2" weight="bold" mb="3" style={{ display: "block" }}>
                Background Color
              </Text>
              <Flex wrap="wrap" gap="3">
                {backgrounds.map((background) => (
                  <BackgroundPreview
                    key={background.id}
                    background={background}
                    isSelected={background.id === backgroundId}
                    onSelect={() => setBackground(background.id)}
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
}

function ThemePreview({ mode, isSelected, onSelect }: ThemePreviewProps) {
  const getThemeConfig = () => {
    switch (mode) {
      case "light":
        return {
          name: "Light",
          description: "Bright and clean",
          icon: Sun,
          gradient: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 50%, #e5e5e5 100%)",
          color: "#ffffff",
          textColor: "#1a1a1a",
        };
      case "dark":
        return {
          name: "Dark",
          description: "Easy on the eyes",
          icon: Moon,
          gradient: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)",
          color: "#1a1a1a",
          textColor: "#ffffff",
        };
      case "system":
        return {
          name: "System",
          description: "Follows device settings",
          icon: Monitor,
          gradient: "linear-gradient(135deg, #ffffff 0%, #808080 50%, #1a1a1a 100%)",
          color: "#808080",
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
            backgroundColor: mode === "system" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
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
          <Text size="2" weight="medium">
            {config.name}
          </Text>
          <Text size="1" color="gray">
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
}

function BackgroundPreview({ background, isSelected, onSelect }: BackgroundPreviewProps) {
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
          <Text size="2" weight="medium">
            {background.name}
          </Text>
          <Text size="1" color="gray">
            {background.description}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

