"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Badge } from "@welpco/ui/badge";
import { Card } from "@welpco/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { Input } from "@welpco/ui/input";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Button } from "@welpco/ui/button";
import { Separator } from "@welpco/ui/separator";
import { Slider } from "@welpco/ui/slider";
import { Switch } from "@welpco/ui/switch";
import { X } from "lucide-react";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";

/** Hourly-rate slider bounds. `SEARCH_PRICE_MAX` doubles as the "and up" cap. */
export const SEARCH_PRICE_MIN = 0;
export const SEARCH_PRICE_MAX = 200;
export const SEARCH_PRICE_STEP = 5;

/** `[min, max]` hourly rate. `[MIN, MAX]` means the filter is off. */
export type SearchPriceRange = [number, number];

export interface SearchFiltersSidebarState {
  priceRange: SearchPriceRange;
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
  /** Formats a bare amount, e.g. `40` → "$40" (en) / "40 $" (fr). */
  priceAmount?: (amount: number) => string;
  /** Joins two formatted amounts, e.g. "$40 – $120/hr". */
  priceRangeValue?: (min: string, max: string) => string;
  minRating?: string;
  ratingAria?: string;
  anyRating?: string;
  starsPlus?: (rating: string) => string;
  backgroundCheck?: string;
  backgroundCheckHint?: string;
  backgroundCheckAria?: string;
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
  /** When true, only Welpers with a passed background check are requested. */
  verifiedOnly?: boolean;
  onVerifiedOnlyChange?: (value: boolean) => void;
  /** Compact layout for narrow sidebar */
  compact?: boolean;
  /** When "panel", filter fields use a responsive grid for full-width layouts. */
  layout?: "stack" | "panel";
  /** When true, card fills container height (e.g. when paired with Search hero in a row). */
  fullHeight?: boolean;
  labels?: SearchFiltersSidebarLabels;
}

const ratingOptions: SearchFiltersSidebarState["rating"][] = ["any", "4", "4.5", "5"];

const defaultState: SearchFiltersSidebarState = {
  priceRange: [SEARCH_PRICE_MIN, SEARCH_PRICE_MAX],
  rating: "any",
};

export const FILTER_ANY = "__any__";

function isWholeRange([min, max]: SearchPriceRange): boolean {
  return min <= SEARCH_PRICE_MIN && max >= SEARCH_PRICE_MAX;
}

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
  verifiedOnly = false,
  onVerifiedOnlyChange,
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

  // The slider tracks the drag locally and only commits on release, so a drag
  // across the scale doesn't fire a search per step.
  const [priceMin, priceMax] = value.priceRange;
  const [localPrice, setLocalPrice] = useState<SearchPriceRange>([priceMin, priceMax]);
  useEffect(() => {
    setLocalPrice([priceMin, priceMax]);
  }, [priceMin, priceMax]);

  const formatAmount = l?.priceAmount ?? ((amount: number) => `$${amount}`);
  const formatRange =
    l?.priceRangeValue ?? ((min: string, max: string) => `${min} – ${max}/hr`);
  const priceCapText = `${formatAmount(SEARCH_PRICE_MAX)}+`;
  const priceValueText = isWholeRange(localPrice)
    ? (l?.anyPrice ?? "Any price")
    : formatRange(
        formatAmount(localPrice[0]),
        localPrice[1] >= SEARCH_PRICE_MAX ? priceCapText : formatAmount(localPrice[1]),
      );

  const priceActive = !isWholeRange(value.priceRange);
  const hasActiveFilters =
    priceActive ||
    value.rating !== "any" ||
    !!categoryId ||
    !!keyword?.trim() ||
    !!radiusKm ||
    verifiedOnly;

  const isPanel = layout === "panel";
  const fieldDirection = isPanel ? "column" : "row";
  const fieldAlign = isPanel ? { alignItems: "stretch" as const } : undefined;
  const controlWidth = isPanel ? "100%" : undefined;

  /** Selects and text inputs — uniform height, so they share a tidy grid. */
  const pickerFields: ReactNode[] = [];

  if (categoryOptions.length > 0 && onCategoryChange) {
    pickerFields.push(
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
    pickerFields.push(
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
    pickerFields.push(
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

  pickerFields.push(
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

  const priceField = (
    <Box
      role="group"
      aria-labelledby="sidebar-price-label"
      style={{ minWidth: 0, width: "100%" }}
    >
      <Flex align="center" justify="between" gap="3" mb="2">
        <Text as="label" size="2" weight="medium" id="sidebar-price-label">
          {l?.priceRange ?? "Price range"}
        </Text>
        <Badge
          size="1"
          variant="soft"
          color={priceActive ? SEMANTIC_COLOR.primary : SEMANTIC_COLOR.neutral}
          highContrast
        >
          {priceValueText}
        </Badge>
      </Flex>
      <Box px="1">
        <Slider
          value={localPrice}
          onValueChange={(next) => setLocalPrice([next[0], next[1]])}
          onValueCommit={(next) => update({ priceRange: [next[0], next[1]] })}
          min={SEARCH_PRICE_MIN}
          max={SEARCH_PRICE_MAX}
          step={SEARCH_PRICE_STEP}
          size="2"
          // A full-width green bar would claim the filter is doing something
          // when the whole scale is selected, so the untouched state stays quiet.
          variant={priceActive ? "surface" : "soft"}
          color={priceActive ? SEMANTIC_COLOR.primary : SEMANTIC_COLOR.neutral}
          style={{ width: "100%" }}
        />
      </Box>
      <Flex justify="between" mt="2">
        <Text size="1" color="gray" highContrast>
          {formatAmount(SEARCH_PRICE_MIN)}
        </Text>
        <Text size="1" color="gray" highContrast>
          {priceCapText}
        </Text>
      </Flex>
    </Box>
  );

  const verifiedField = onVerifiedOnlyChange ? (
    <Flex
      align="center"
      justify="between"
      gap="3"
      px="3"
      py="2"
      style={{
        minWidth: 0,
        width: "100%",
        borderRadius: "var(--radius-3)",
        border: `1px solid ${verifiedOnly ? "var(--grass-a7)" : "var(--gray-a5)"}`,
        backgroundColor: verifiedOnly ? "var(--grass-a2)" : "var(--gray-a2)",
      }}
    >
      <Box style={{ minWidth: 0 }}>
        <Text
          as="label"
          size="2"
          weight="medium"
          htmlFor="sidebar-verified-only"
          style={{ display: "block" }}
        >
          {l?.backgroundCheck ?? "Background check"}
        </Text>
        <Text size="1" color="gray" highContrast>
          {l?.backgroundCheckHint ?? "Only show Welpers who passed"}
        </Text>
      </Box>
      <Switch
        id="sidebar-verified-only"
        checked={verifiedOnly}
        onCheckedChange={(checked) => onVerifiedOnlyChange(checked === true)}
        size="2"
        color={SEMANTIC_COLOR.primary}
        aria-label={l?.backgroundCheckAria ?? l?.backgroundCheck ?? "Background check"}
        style={{ flexShrink: 0 }}
      />
    </Flex>
  ) : null;

  return (
    <Card
      size="4"
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
        gap="4"
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
              {l?.compactHint ?? "Category, price, rating, background check"}
            </Text>
          )}
        </Box>

        {isPanel ? (
          <>
            <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4" style={{ width: "100%" }}>
              {pickerFields}
            </Grid>
            <Separator size="4" />
            <Grid
              columns={{ initial: "1", md: "2" }}
              gap={{ initial: "4", md: "6" }}
              align="center"
              style={{ width: "100%" }}
            >
              {priceField}
              {verifiedField}
            </Grid>
          </>
        ) : (
          <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
            {pickerFields}
            <Separator size="4" />
            {priceField}
            {verifiedField}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

export { defaultState as searchFiltersSidebarDefaultState };
