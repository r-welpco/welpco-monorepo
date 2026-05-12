"use client";

import { useState, useEffect } from "react";
import { Card } from "@welpco/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { Input } from "@welpco/ui/input";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Button } from "@welpco/ui/button";
import { X } from "lucide-react";

export interface SearchFiltersSidebarState {
  priceRange: "any" | "0-50" | "50-100" | "100-200" | "200+";
  rating: "any" | "4" | "4.5" | "5";
}

export interface SearchFiltersSidebarProps {
  value: SearchFiltersSidebarState;
  onChange?: (value: SearchFiltersSidebarState) => void;
  onReset?: () => void;
  /** Optional category options for a category filter (e.g. multi-select or single) */
  categoryId?: string;
  onCategoryChange?: (categoryId: string | undefined) => void;
  categoryOptions?: Array<{ id: string; name: string }>;
  /** Optional keyword search (name, bio, service description). */
  keyword?: string;
  onKeywordChange?: (value: string | undefined) => void;
  /** Radius in km for distance search. Requires search center (lat/lng or postal). */
  radiusKm?: number;
  onRadiusChange?: (km: number | undefined) => void;
  radiusOptions?: Array<{ value: number; label: string }>;
  /** When true, radius control is shown (e.g. when location is set). */
  showRadius?: boolean;
  /** Compact layout for narrow sidebar */
  compact?: boolean;
  /** When true, card fills container height (e.g. when paired with Search hero in a row). */
  fullHeight?: boolean;
}

const priceOptions: SearchFiltersSidebarState["priceRange"][] = [
  "any",
  "0-50",
  "50-100",
  "100-200",
  "200+",
];

const ratingOptions: SearchFiltersSidebarState["rating"][] = ["any", "4", "4.5", "5"];

const defaultState: SearchFiltersSidebarState = {
  priceRange: "any",
  rating: "any",
};

export const FILTER_ANY = "__any__";

export function SearchFiltersSidebar({
  value,
  onChange,
  onReset,
  categoryId,
  onCategoryChange,
  categoryOptions = [],
  keyword,
  onKeywordChange,
  radiusKm,
  onRadiusChange,
  radiusOptions = [],
  showRadius = false,
  compact = false,
  fullHeight = false,
}: SearchFiltersSidebarProps) {
  const update = (patch: Partial<SearchFiltersSidebarState>) => {
    onChange?.({ ...value, ...patch });
  };

  // Local state for debounced keyword input
  const [localKeyword, setLocalKeyword] = useState(keyword ?? "");

  // Sync local state when prop changes (e.g., URL navigation)
  useEffect(() => {
    setLocalKeyword(keyword ?? "");
  }, [keyword]);

  // Debounce keyword changes (400ms delay)
  useEffect(() => {
    const trimmed = localKeyword.trim();
    const currentTrimmed = keyword?.trim() ?? "";
    
    if (trimmed === currentTrimmed) return;

    const timeoutId = setTimeout(() => {
      onKeywordChange?.(trimmed || undefined);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [localKeyword, keyword, onKeywordChange]);

  const hasActiveFilters =
    value.priceRange !== "any" ||
    value.rating !== "any" ||
    !!categoryId ||
    !!keyword?.trim() ||
    !!radiusKm;

  const cardSize = "4";
  const sectionGap = "5";

  return (
    <Card
      size={cardSize}
      variant="surface"
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        ...(fullHeight ? { height: "100%", display: "flex", flexDirection: "column" } : {}),
      }}
    >
      <Flex
        direction="column"
        gap={sectionGap}
        style={fullHeight ? { flex: 1, minHeight: 0, minWidth: 0 } : { minWidth: 0 }}
      >
        <Box>
          <Flex justify="between" align="center" mb={compact ? "1" : "2"}>
            <Heading size="6" trim="start">
              Filters
            </Heading>
            {hasActiveFilters && onReset && (
              <Button
                variant="ghost"
                color="gray"
                size="1"
                onClick={onReset}
                aria-label="Clear all filters"
              >
                <Flex align="center" gap="1">
                  <X size={14} />
                  <Text size="1">Clear</Text>
                </Flex>
              </Button>
            )}
          </Flex>
          {compact && (
            <Text size="1" color="gray" highContrast mt="1">
              Category, price, rating
            </Text>
          )}
        </Box>

        {categoryOptions.length > 0 && onCategoryChange && (
          <Flex align="center" justify="between" gap="3" wrap="wrap">
            <Text as="label" size="2" weight="bold" htmlFor="sidebar-category">
              Service category
            </Text>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Select
                value={categoryId ?? FILTER_ANY}
                onValueChange={(v) => onCategoryChange(v === FILTER_ANY ? undefined : v)}
              >
                <SelectTrigger id="sidebar-category" aria-label="Service category" />
                <SelectContent>
                  <SelectItem value={FILTER_ANY}>Any category</SelectItem>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>
          </Flex>
        )}

        {onKeywordChange && (
          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="bold" htmlFor="sidebar-keyword">
              Keyword (optional)
            </Text>
            <Input
              id="sidebar-keyword"
              type="text"
              placeholder="e.g. pet care, tutoring"
              value={localKeyword}
              onChange={(e) => setLocalKeyword(e.target.value)}
            />
          </Flex>
        )}

        {showRadius && radiusOptions.length > 0 && onRadiusChange && (
          <Flex align="center" justify="between" gap="3" wrap="wrap">
            <Text as="label" size="2" weight="bold" htmlFor="sidebar-radius">
              Within (km)
            </Text>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Select
                value={radiusKm !== undefined ? String(radiusKm) : "__any__"}
                onValueChange={(v) => onRadiusChange(v === "__any__" ? undefined : parseInt(v, 10))}
              >
                <SelectTrigger id="sidebar-radius" aria-label="Radius in km" />
                <SelectContent>
                  <SelectItem value="__any__">Any distance</SelectItem>
                  {radiusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>
          </Flex>
        )}

        <Flex align="center" justify="between" gap="3" wrap="wrap">
          <Text as="label" size="2" weight="bold" htmlFor="sidebar-price">
            Price range
          </Text>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Select
              value={value.priceRange}
              onValueChange={(v) => update({ priceRange: v as SearchFiltersSidebarState["priceRange"] })}
            >
              <SelectTrigger id="sidebar-price" aria-label="Price range" />
              <SelectContent>
                {priceOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt === "any" ? "Any price" : `$${opt}/hr`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>
        </Flex>

        <Flex align="center" justify="between" gap="3" wrap="wrap">
          <Text as="label" size="2" weight="bold" htmlFor="sidebar-rating">
            Min. rating
          </Text>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Select
              value={value.rating}
              onValueChange={(v) => update({ rating: v as SearchFiltersSidebarState["rating"] })}
            >
              <SelectTrigger id="sidebar-rating" aria-label="Minimum rating" />
              <SelectContent>
                {ratingOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt === "any" ? "Any rating" : `${opt}+ stars`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>
        </Flex>
      </Flex>
    </Card>
  );
}

export { defaultState as searchFiltersSidebarDefaultState };
