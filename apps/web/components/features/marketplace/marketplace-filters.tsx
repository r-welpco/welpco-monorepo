"use client";

import type { ReactNode } from "react";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Switch } from "@welpco/ui/switch";
import { Separator } from "@welpco/ui/separator";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { ListFilter, X } from "lucide-react";
import { useContentCategories, useCategoriesByParent } from "@/lib/hooks/use-content";
import { useCategoryDisplayName } from "@/lib/i18n/category-display-name";
import { useMarketplaceLabels } from "@/lib/i18n/use-dashboard-labels";

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
  const labels = useMarketplaceLabels();
  const categoryDisplayName = useCategoryDisplayName();
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
                {labels.filters.title}
              </Text>
            </Flex>

            <Box minWidth="180px">
              <Select
                value={categoryId || "__all__"}
                onValueChange={(v) => onCategoryChange(v === "__all__" ? "" : v)}
              >
                {/* Compact toolbar: a visible label would break the single-row
                    layout, so the trigger carries an aria-label instead. */}
                <SelectTrigger
                  aria-label={labels.filters.allCategories}
                  placeholder={labels.filters.allCategories}
                />
                <SelectContent>
                  <SelectItem value="__all__">{labels.filters.allCategories}</SelectItem>
                  {parentCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {categoryDisplayName(c.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>

            {categoryId && subcategories.length > 0 && (
              <Box minWidth="180px">
                <Select
                  value={subcategoryId || "__all__"}
                  onValueChange={(v) => onSubcategoryChange(v === "__all__" ? "" : v)}
                >
                  <SelectTrigger
                    aria-label={labels.filters.allServices}
                    placeholder={labels.filters.allServices}
                  />
                  <SelectContent>
                    <SelectItem value="__all__">{labels.filters.allServices}</SelectItem>
                    {subcategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {categoryDisplayName(c.name)}
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
                {labels.filters.eligibleOnly}
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
                ? labels.filters.noJobsFound
                : labels.filters.jobCount(resultCount)}
            </Text>
          )}

          {hasFilters && (
            <>
              <Separator orientation="vertical" size="1" />
              {selectedCategory && (
                <FilterChip
                  label={categoryDisplayName(selectedCategory.name)}
                  removeAria={labels.filters.removeFilterAria(
                    categoryDisplayName(selectedCategory.name),
                  )}
                  onRemove={() => onCategoryChange("")}
                />
              )}
              {selectedSubcategory && (
                <FilterChip
                  label={categoryDisplayName(selectedSubcategory.name)}
                  removeAria={labels.filters.removeFilterAria(
                    categoryDisplayName(selectedSubcategory.name),
                  )}
                  onRemove={() => onSubcategoryChange("")}
                />
              )}
              {eligibleOnly && (
                <FilterChip
                  label={labels.filters.canApplyChip}
                  removeAria={labels.filters.removeFilterAria(labels.filters.canApplyChip)}
                  onRemove={() => onEligibleChange(false)}
                />
              )}
            </>
          )}
        </Flex>

        {hasFilters && (
          <Button variant="ghost" color="gray" size="2" onClick={onClearAll}>
            {labels.filters.clearAll}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

function FilterChip({
  label,
  removeAria,
  onRemove,
}: {
  label: string;
  removeAria: string;
  onRemove: () => void;
}) {
  return (
    <Button
      variant="soft"
      color={SEMANTIC_COLOR.info}
      size="1"
      radius="full"
      onClick={onRemove}
      aria-label={removeAria}
    >
      {label}
      <X size={12} aria-hidden />
    </Button>
  );
}
