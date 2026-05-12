"use client";

import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { Button } from "@welpco/ui/button";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { LayoutList, LayoutGrid } from "lucide-react";

export type SearchResultsViewMode = "list" | "grid";

export interface SearchResultsToolbarProps {
  /** Total number of results */
  total: number;
  /** Current page (1-based) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Sort value */
  sort: "relevance" | "price" | "distance";
  onSortChange?: (sort: "relevance" | "price" | "distance") => void;
  /** When true, show "Distance" in sort options (e.g. when lat/lng or postal are set) */
  showSortDistance?: boolean;
  /** View mode: list or grid */
  viewMode?: SearchResultsViewMode;
  onViewModeChange?: (mode: SearchResultsViewMode) => void;
  /** Show view toggle (list/grid) */
  showViewToggle?: boolean;
  /** Loading: hide or disable controls */
  loading?: boolean;
}

export function SearchResultsToolbar({
  total,
  page,
  pageSize,
  sort,
  onSortChange,
  showSortDistance = false,
  viewMode = "list",
  onViewModeChange,
  showViewToggle = true,
  loading = false,
}: SearchResultsToolbarProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <Flex
      justify="between"
      align="center"
      gap="6"
      wrap="wrap"
      style={{ width: "100%", minWidth: 0 }}
    >
      <Text size="3" weight="medium">
        {loading ? (
          "Loading…"
        ) : total === 0 ? (
          "No results"
        ) : (
          <>
            Showing <Text as="span" weight="bold">{start}–{end}</Text> of <Text as="span" weight="bold">{total}</Text>{" "}
            {total === 1 ? "Welper" : "Welpers"}
          </>
        )}
      </Text>

      <Flex gap="5" align="center" wrap="wrap">
        {onSortChange && (
          <Flex align="center" gap="3">
            <Text as="label" size="2" weight="bold" htmlFor="search-sort">
              Sort by
            </Text>
            <Box style={{ minWidth: 160 }}>
              <Select
                value={sort}
                onValueChange={(v) => onSortChange(v as "relevance" | "price" | "distance")}
                disabled={loading}
              >
                <SelectTrigger id="search-sort" aria-label="Sort results" />
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price">Price: low to high</SelectItem>
                  {showSortDistance && <SelectItem value="distance">Distance</SelectItem>}
                </SelectContent>
              </Select>
            </Box>
          </Flex>
        )}

        {showViewToggle && onViewModeChange && (
          <Flex align="center" gap="2">
            <Text size="2" weight="bold">
              View
            </Text>
            <Flex align="center" gap="2">
              <Button
                variant={viewMode === "list" ? "solid" : "soft"}
                color={viewMode === "list" ? SEMANTIC_COLOR.primary : "gray"}
                size="2"
                onClick={() => onViewModeChange("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <LayoutList size={18} />
              </Button>
              <Button
                variant={viewMode === "grid" ? "solid" : "soft"}
                color={viewMode === "grid" ? SEMANTIC_COLOR.primary : "gray"}
                size="2"
                onClick={() => onViewModeChange("grid")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <LayoutGrid size={18} />
              </Button>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
