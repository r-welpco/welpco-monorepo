"use client";

import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { Button } from "@welpco/ui/button";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { LayoutList, LayoutGrid } from "lucide-react";

export type SearchResultsViewMode = "list" | "grid";

export interface SearchResultsToolbarLabels {
  loading?: string;
  noResults?: string;
  showingRange?: (start: number, end: number, total: number) => string;
  welper?: string;
  welpers?: string;
  sortBy?: string;
  sortAria?: string;
  sortRelevance?: string;
  sortPrice?: string;
  sortDistance?: string;
  view?: string;
  listViewAria?: string;
  gridViewAria?: string;
}

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
  labels?: SearchResultsToolbarLabels;
}

export function SearchResultsToolbar({
  total,
  page,
  pageSize,
  sort,
  onSortChange,
  showSortDistance = false,
  viewMode = "grid",
  onViewModeChange,
  showViewToggle = true,
  loading = false,
  labels: labelsProp,
}: SearchResultsToolbarProps) {
  const l = labelsProp;
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
          (l?.loading ?? "Loading…")
        ) : total === 0 ? (
          (l?.noResults ?? "No results")
        ) : l?.showingRange ? (
          l.showingRange(start, end, total)
        ) : (
          <>
            Showing <Text as="span" weight="bold">{start}–{end}</Text> of <Text as="span" weight="bold">{total}</Text>{" "}
            {total === 1 ? (l?.welper ?? "Welper") : (l?.welpers ?? "Welpers")}
          </>
        )}
      </Text>

      <Flex gap="5" align="center" wrap="wrap">
        {onSortChange && (
          <Flex align="center" gap="3">
            <Text as="label" size="2" weight="bold" htmlFor="search-sort">
              {l?.sortBy ?? "Sort by"}
            </Text>
            <Box style={{ minWidth: 160 }}>
              <Select
                value={sort}
                onValueChange={(v) => onSortChange(v as "relevance" | "price" | "distance")}
                disabled={loading}
              >
                <SelectTrigger id="search-sort" aria-label={l?.sortAria ?? "Sort results"} />
                <SelectContent>
                  <SelectItem value="relevance">{l?.sortRelevance ?? "Relevance"}</SelectItem>
                  <SelectItem value="price">{l?.sortPrice ?? "Price: low to high"}</SelectItem>
                  {showSortDistance && (
                    <SelectItem value="distance">{l?.sortDistance ?? "Distance"}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Box>
          </Flex>
        )}

        {showViewToggle && onViewModeChange && (
          <Flex align="center" gap="2">
            <Text size="2" weight="bold">
              {l?.view ?? "View"}
            </Text>
            <Flex align="center" gap="2">
              <Button
                variant={viewMode === "list" ? "solid" : "soft"}
                color={viewMode === "list" ? SEMANTIC_COLOR.primary : "gray"}
                size="2"
                onClick={() => onViewModeChange("list")}
                aria-label={l?.listViewAria ?? "List view"}
                aria-pressed={viewMode === "list"}
              >
                <LayoutList size={18} />
              </Button>
              <Button
                variant={viewMode === "grid" ? "solid" : "soft"}
                color={viewMode === "grid" ? SEMANTIC_COLOR.primary : "gray"}
                size="2"
                onClick={() => onViewModeChange("grid")}
                aria-label={l?.gridViewAria ?? "Grid view"}
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
