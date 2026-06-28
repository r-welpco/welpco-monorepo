"use client";

import { useMemo, useState } from "react";
import { NativeFormField, nativeSelectProps } from "@/components/native-form-field";
import type { AdminCategory } from "@/lib/services/admin-categories-service";

function compactSelectProps(): React.SelectHTMLAttributes<HTMLSelectElement> {
  const props = nativeSelectProps();
  return {
    ...props,
    style: {
      ...props.style,
      fontSize: "0.875rem",
      height: 36,
      minWidth: 0,
      width: "100%",
    },
  };
}

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
        <select
          name="serviceCategoryId"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setSubcategoryId("");
          }}
          {...compactSelectProps()}
        >
          <option value="">All categories</option>
          {rootCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </NativeFormField>
      <NativeFormField label="Subcategory">
        <select
          name="serviceSubcategoryId"
          value={hasSelectedSubcategory ? subcategoryId : ""}
          onChange={(event) => setSubcategoryId(event.target.value)}
          disabled={!categoryId || subcategories.length === 0}
          {...compactSelectProps()}
        >
          <option value="">
            {categoryId ? "All subcategories" : "Select category first"}
          </option>
          {subcategories.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>
      </NativeFormField>
    </>
  );
}
