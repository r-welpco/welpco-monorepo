"use client";

import { IconButton } from "@welpco/ui/icon-button";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { usePersonalizationStore, type ThemeMode } from "@/stores/personalizationStore";

export function ThemeToggle() {
  const { themeMode, setThemeMode } = usePersonalizationStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    const modes: ThemeMode[] = ["light", "dark", "system"];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const getIcon = () => {
    if (themeMode === "system") {
      return <Monitor style={{ width: "16px", height: "16px" }} />;
    }
    return themeMode === "dark" ? (
      <Sun style={{ width: "16px", height: "16px" }} />
    ) : (
      <Moon style={{ width: "16px", height: "16px" }} />
    );
  };

  const getLabel = () => {
    if (themeMode === "system") return "System theme";
    return themeMode === "dark" ? "Switch to light theme" : "Switch to dark theme";
  };

  if (!mounted) {
    return (
      <IconButton variant="ghost" size="2" disabled>
        <Sun style={{ width: "16px", height: "16px" }} />
      </IconButton>
    );
  }

  return (
    <IconButton
      variant="ghost"
      size="2"
      onClick={cycleTheme}
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </IconButton>
  );
}

