"use client";

import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { LayoutGrid, LayoutList } from "lucide-react";
import type { JobCardLayout } from "@welpco/ui/platform";
import { useMarketplaceLabels } from "@/lib/i18n/use-dashboard-labels";

interface MarketplaceViewToggleProps {
  viewMode: JobCardLayout;
  onViewModeChange: (mode: JobCardLayout) => void;
}

export function MarketplaceViewToggle({ viewMode, onViewModeChange }: MarketplaceViewToggleProps) {
  const labels = useMarketplaceLabels();

  return (
    <Flex align="center" gap="2">
      <Text size="2" weight="medium" color="gray" highContrast>
        {labels.viewToggle.label}
      </Text>
      <Flex align="center" gap="1">
        <Button
          variant={viewMode === "list" ? "solid" : "soft"}
          color={viewMode === "list" ? SEMANTIC_COLOR.primary : "gray"}
          size="2"
          onClick={() => onViewModeChange("list")}
          aria-label={labels.viewToggle.listAria}
          aria-pressed={viewMode === "list"}
        >
          <LayoutList size={18} />
        </Button>
        <Button
          variant={viewMode === "grid" ? "solid" : "soft"}
          color={viewMode === "grid" ? SEMANTIC_COLOR.primary : "gray"}
          size="2"
          onClick={() => onViewModeChange("grid")}
          aria-label={labels.viewToggle.gridAria}
          aria-pressed={viewMode === "grid"}
        >
          <LayoutGrid size={18} />
        </Button>
      </Flex>
    </Flex>
  );
}

export type { JobCardLayout as MarketplaceJobViewMode };
