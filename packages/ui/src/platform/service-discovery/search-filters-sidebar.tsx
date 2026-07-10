"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Card } from "@welpco/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { Input } from "@welpco/ui/input";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Button } from "@welpco/ui/button";
import { X } from "lucide-react";
import { FORM_SPACING } from "@welpco/ui/tokens";

export interface SearchFiltersSidebarState {
  priceRange: "any" | "0-50" | "50-100" | "100-200" | "200+";
  rating: "any" | "4" | "4.5" | "5";
}

export interface SearchFiltersSidebarLabels {
  title?: string;
  clearAllAria?: string;
  clear?: string;
  compactHint?: string;
  serviceCategory?: string;
  serviceCategoryAria?: string;
  anyCategory?: string;
  keyword?: string;
  keywordPlaceholder?: string;
  withinKm?: string;
  radiusAria?: string;
  anyDistance?: string;
  priceRange?: string;
  priceAria?: string;
  anyPrice?: string;
  pricePerHour?: (range: string) => string;
  minRating?: string;
  ratingAria?: string;
  anyRating?: string;
  starsPlus?: (rating: string) => string;
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
  /** When "panel", filter fields use a responsive grid for full-width layouts. */
  layout?: "stack" | "panel";
  /** When true, card fills container height (e.g. when paired with Search hero in a row). */
  fullHeight?: boolean;
  labels?: SearchFiltersSidebarLabels;
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
  layout = "stack",
  fullHeight = false,
  labels: labelsProp,
}: SearchFiltersSidebarProps) {
  const l = labelsProp;
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
  const isPanel = layout === "panel";
  const fieldDirection = isPanel ? "column" : "row";
  const fieldAlign = isPanel ? { alignItems: "stretch" as const } : undefined;
  const controlWidth = isPanel ? "100%" : undefined;

  const fieldNodes: ReactNode[] = [];

  if (categoryOptions.length > 0 && onCategoryChange) {
    fieldNodes.push(
      <Flex
        key="category"
        align="center"
        justify="between"
        gap={isPanel ? FORM_SPACING.labelGap : "3"}
        wrap="wrap"
        direction={fieldDirection}
        style={fieldAlign}
      >
        <Text as="label" size="2" weight="medium" id="sidebar-category-label" htmlFor="sidebar-category" style={{ display: "block" }}>
          {l?.serviceCategory ?? "Service category"}
        </Text>
        <Box style={{ flex: 1, minWidth: 0, width: controlWidth }}>
          <Select
            value={categoryId ?? FILTER_ANY}
            onValueChange={(v) => onCategoryChange(v === FILTER_ANY ? undefined : v)}
          >
            <SelectTrigger id="sidebar-category" aria-labelledby="sidebar-category-label" style={{ width: "100%" }} />
            <SelectContent>
              <SelectItem value={FILTER_ANY}>{l?.anyCategory ?? "Any category"}</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Box>
      </Flex>,
    );
  }

  if (onKeywordChange) {
    fieldNodes.push(
      <Flex key="keyword" direction="column" gap={FORM_SPACING.labelGap}>
        <Text as="label" size="2" weight="medium" htmlFor="sidebar-keyword">
          {l?.keyword ?? "Keyword (optional)"}
        </Text>
        <Input
          id="sidebar-keyword"
          type="text"
          placeholder={l?.keywordPlaceholder ?? "e.g. pet care, tutoring"}
          value={localKeyword}
          onChange={(e) => setLocalKeyword(e.target.value)}
        />
      </Flex>,
    );
  }

  if (showRadius && radiusOptions.length > 0 && onRadiusChange) {
    fieldNodes.push(
      <Flex
        key="radius"
        align="center"
        justify="between"
        gap={isPanel ? FORM_SPACING.labelGap : "3"}
        wrap="wrap"
        direction={fieldDirection}
        style={fieldAlign}
      >
        <Text as="label" size="2" weight="medium" id="sidebar-radius-label" htmlFor="sidebar-radius" style={{ display: "block" }}>
          {l?.withinKm ?? "Within (km)"}
        </Text>
        <Box style={{ flex: 1, minWidth: 0, width: controlWidth }}>
          <Select
            value={radiusKm !== undefined ? String(radiusKm) : "__any__"}
            onValueChange={(v) => onRadiusChange(v === "__any__" ? undefined : parseInt(v, 10))}
          >
            <SelectTrigger id="sidebar-radius" aria-labelledby="sidebar-radius-label" style={{ width: "100%" }} />
            <SelectContent>
              <SelectItem value="__any__">{l?.anyDistance ?? "Any distance"}</SelectItem>
              {radiusOptions.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Box>
      </Flex>,
    );
  }

  fieldNodes.push(
    <Flex
      key="price"
      align="center"
      justify="between"
      gap={isPanel ? FORM_SPACING.labelGap : "3"}
      wrap="wrap"
      direction={fieldDirection}
      style={fieldAlign}
    >
      <Text as="label" size="2" weight="medium" id="sidebar-price-label" htmlFor="sidebar-price" style={{ display: "block" }}>
        {l?.priceRange ?? "Price range"}
      </Text>
      <Box style={{ flex: 1, minWidth: 0, width: controlWidth }}>
        <Select
          value={value.priceRange}
          onValueChange={(v) => update({ priceRange: v as SearchFiltersSidebarState["priceRange"] })}
        >
          <SelectTrigger id="sidebar-price" aria-labelledby="sidebar-price-label" style={{ width: "100%" }} />
          <SelectContent>
            {priceOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "any"
                  ? (l?.anyPrice ?? "Any price")
                  : (l?.pricePerHour ? l.pricePerHour(opt) : `$${opt}/hr`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Box>
    </Flex>,
  );

  fieldNodes.push(
    <Flex
      key="rating"
      align="center"
      justify="between"
      gap={isPanel ? FORM_SPACING.labelGap : "3"}
      wrap="wrap"
      direction={fieldDirection}
      style={fieldAlign}
    >
      <Text as="label" size="2" weight="medium" id="sidebar-rating-label" htmlFor="sidebar-rating" style={{ display: "block" }}>
        {l?.minRating ?? "Min. rating"}
      </Text>
      <Box style={{ flex: 1, minWidth: 0, width: controlWidth }}>
        <Select
          value={value.rating}
          onValueChange={(v) => update({ rating: v as SearchFiltersSidebarState["rating"] })}
        >
          <SelectTrigger id="sidebar-rating" aria-labelledby="sidebar-rating-label" style={{ width: "100%" }} />
          <SelectContent>
            {ratingOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "any"
                  ? (l?.anyRating ?? "Any rating")
                  : (l?.starsPlus ? l.starsPlus(opt) : `${opt}+ stars`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Box>
    </Flex>,
  );

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
              {l?.title ?? "Filters"}
            </Heading>
            {hasActiveFilters && onReset && (
              <Button
                variant="ghost"
                color="gray"
                size="1"
                onClick={onReset}
                aria-label={l?.clearAllAria ?? "Clear all filters"}
              >
                <Flex align="center" gap="1">
                  <X size={14} />
                  <Text size="1">{l?.clear ?? "Clear"}</Text>
                </Flex>
              </Button>
            )}
          </Flex>
          {compact && (
            <Text size="1" color="gray" highContrast mt="1">
              {l?.compactHint ?? "Category, price, rating"}
            </Text>
          )}
        </Box>

        {isPanel ? (
          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4" style={{ width: "100%" }}>
            {fieldNodes}
          </Grid>
        ) : (
          fieldNodes
        )}
      </Flex>
    </Card>
  );
}

export { defaultState as searchFiltersSidebarDefaultState };
