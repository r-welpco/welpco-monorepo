"use client";

import type { ReactNode } from "react";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Switch } from "@welpco/ui/switch";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { ListFilter, X } from "lucide-react";
import { useContentCategories, useCategoriesByParent } from "@/lib/hooks/use-content";

interface MarketplaceFiltersProps {
  categoryId: string;
  subcategoryId: string;
  eligibleOnly: boolean;
  onCategoryChange: (id: string) => void;
  onSubcategoryChange: (id: string) => void;
  onEligibleChange: (value: boolean) => void;
  onClearAll: () => void;
  /** Total number of matching jobs, for the result count. */
  resultCount?: number;
  /** Rendered on the right of the toolbar (e.g. the view toggle). */
  trailing?: ReactNode;
}

export function MarketplaceFilters({
  categoryId,
  subcategoryId,
  eligibleOnly,
  onCategoryChange,
  onSubcategoryChange,
  onEligibleChange,
  onClearAll,
  resultCount,
  trailing,
}: MarketplaceFiltersProps) {
  const { data: categories = [] } = useContentCategories(false);
  const parentCategories = categories.filter((c) => c.level === 1);

  const { data: subcategories = [] } = useCategoriesByParent(
    categoryId || null,
    Boolean(categoryId),
  );

  const selectedCategory = parentCategories.find((c) => c.id === categoryId);
  const selectedSubcategory = subcategories.find((c) => c.id === subcategoryId);

  const hasFilters = Boolean(categoryId) || Boolean(subcategoryId) || eligibleOnly;

  return (
    <Flex direction="column" gap="3">
      <Box
        p="3"
        style={{
          backgroundColor: "var(--gray-2)",
          border: "1px solid var(--gray-4)",
          borderRadius: "var(--radius-4)",
        }}
      >
        <Flex justify="between" align="center" gap="3" wrap="wrap">
          <Flex align="center" gap="3" wrap="wrap">
            <Flex align="center" gap="2" style={{ color: "var(--gray-10)" }}>
              <ListFilter size={16} aria-hidden />
              <Text size="2" weight="medium" color="gray" highContrast>
                Filters
              </Text>
            </Flex>

            <Box style={{ minWidth: 180 }}>
              <Select
                value={categoryId || "__all__"}
                onValueChange={(v) => onCategoryChange(v === "__all__" ? "" : v)}
              >
                <SelectTrigger placeholder="All categories" />
                <SelectContent>
                  <SelectItem value="__all__">All categories</SelectItem>
                  {parentCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>

            {categoryId && subcategories.length > 0 && (
              <Box style={{ minWidth: 180 }}>
                <Select
                  value={subcategoryId || "__all__"}
                  onValueChange={(v) => onSubcategoryChange(v === "__all__" ? "" : v)}
                >
                  <SelectTrigger placeholder="All services" />
                  <SelectContent>
                    <SelectItem value="__all__">All services</SelectItem>
                    {subcategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Box>
            )}

            <Flex
              align="center"
              gap="2"
              px="3"
              py="1"
              style={{
                backgroundColor: "var(--color-panel-solid)",
                border: "1px solid var(--gray-5)",
                borderRadius: "9999px",
              }}
            >
              <Text
                as="label"
                size="2"
                weight="medium"
                htmlFor="marketplace-eligible-only"
                style={{ cursor: "pointer" }}
              >
                Only jobs I can apply to
              </Text>
              <Switch
                id="marketplace-eligible-only"
                checked={eligibleOnly}
                onCheckedChange={onEligibleChange}
                color={SEMANTIC_COLOR.primary}
              />
            </Flex>
          </Flex>

          {trailing && <Box style={{ flexShrink: 0 }}>{trailing}</Box>}
        </Flex>
      </Box>

      <Flex justify="between" align="center" gap="3" wrap="wrap">
        <Flex align="center" gap="2" wrap="wrap">
          {typeof resultCount === "number" && (
            <Text size="2" color="gray">
              {resultCount === 0
                ? "No jobs found"
                : `${resultCount} ${resultCount === 1 ? "job" : "jobs"}`}
            </Text>
          )}

          {hasFilters && (
            <>
              <Box style={{ width: "1px", height: "16px", backgroundColor: "var(--gray-5)" }} />
              {selectedCategory && (
                <FilterChip
                  label={selectedCategory.name}
                  onRemove={() => onCategoryChange("")}
                />
              )}
              {selectedSubcategory && (
                <FilterChip
                  label={selectedSubcategory.name}
                  onRemove={() => onSubcategoryChange("")}
                />
              )}
              {eligibleOnly && (
                <FilterChip label="Can apply" onRemove={() => onEligibleChange(false)} />
              )}
            </>
          )}
        </Flex>

        {hasFilters && (
          <Button variant="ghost" color="gray" size="2" onClick={onClearAll}>
            Clear all
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Button
      variant="soft"
      color={SEMANTIC_COLOR.info}
      size="1"
      radius="full"
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
    >
      {label}
      <X size={12} aria-hidden />
    </Button>
  );
}
