"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { NativeFormField } from "@/components/native-form-field";
import type { AdminCategory } from "@/lib/services/admin-categories-service";

const ALL_FILTER_VALUE = "__all__";
const CONTROL_STYLE: React.CSSProperties = {
  width: "100%",
};

function uniqueById(categories: AdminCategory[]): AdminCategory[] {
  const seen = new Set<string>();
  return categories.filter((category) => {
    if (seen.has(category.id)) return false;
    seen.add(category.id);
    return true;
  });
}

function findCategory(
  categories: AdminCategory[],
  categoryId: string,
): AdminCategory | null {
  for (const category of categories) {
    if (category.id === categoryId) return category;
    const child = findCategory(category.children ?? [], categoryId);
    if (child) return child;
  }
  return null;
}

export function ServiceCategoryFilter({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
}: {
  categories: AdminCategory[];
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
}) {
  const rootCategories = useMemo(
    () =>
      uniqueById(
        categories.filter(
          (category) => category.parentId == null || category.level === 1,
        ),
      ),
    [categories],
  );
  const [categoryId, setCategoryId] = useState(selectedCategoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(selectedSubcategoryId ?? "");
  const categoryValue = categoryId || ALL_FILTER_VALUE;

  const subcategories = useMemo(() => {
    if (!categoryId) return [];
    const category = findCategory(categories, categoryId);
    return uniqueById(category?.children ?? []).filter(
      (subcategory) => subcategory.isActive,
    );
  }, [categories, categoryId]);

  const hasSelectedSubcategory = subcategories.some(
    (subcategory) => subcategory.id === subcategoryId,
  );

  return (
    <>
      <NativeFormField label="Service category">
        <Select
          name="serviceCategoryId"
          value={categoryValue}
          onValueChange={(value) => {
            setCategoryId(value === ALL_FILTER_VALUE ? "" : value);
            setSubcategoryId("");
          }}
        >
          <SelectTrigger style={CONTROL_STYLE} />
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>All categories</SelectItem>
            {rootCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </NativeFormField>
      <NativeFormField label="Subcategory">
        <Select
          name="serviceSubcategoryId"
          value={hasSelectedSubcategory ? subcategoryId : ALL_FILTER_VALUE}
          onValueChange={(value) =>
            setSubcategoryId(value === ALL_FILTER_VALUE ? "" : value)
          }
          disabled={!categoryId || subcategories.length === 0}
        >
          <SelectTrigger style={CONTROL_STYLE} />
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>
              {categoryId ? "All subcategories" : "Select category first"}
            </SelectItem>
            {subcategories.map((subcategory) => (
              <SelectItem key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </NativeFormField>
    </>
  );
}
