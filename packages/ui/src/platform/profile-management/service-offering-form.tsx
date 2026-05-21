"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { TextArea } from "@welpco/ui/text-area";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { Switch } from "@welpco/ui/switch";
import { Checkbox } from "@welpco/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm, Controller } from "react-hook-form";
import { ServiceAreaSelector, type ServiceArea } from "./service-area-selector";
import { resolveServiceAreaRadiusKm } from "./service-area-utils";
import { useEffect, useMemo } from "react";
import {
  createServiceOfferingSchema,
  defaultCategories,
  type ServiceOfferingValidationLabels,
  type ServiceOfferingValues,
} from "./service-offering-schema";
import type { AddressInputLabels } from "./address-input";
import type { ServiceAreaSelectorLabels } from "./service-area-selector";

// Re-export for consumers that import the type from this module
export type { ServiceOfferingValues } from "./service-offering-schema";

export type ServiceOfferingFormLabels = {
  pageTitle: string;
  pageDescription: string;
  title: string;
  titlePlaceholder: string;
  category: string;
  subcategoriesOptional: string;
  subcategoriesHint: string;
  hourlyRate: string;
  experienceYears: string;
  description: string;
  descriptionPlaceholder: string;
  serviceArea: string;
  serviceAreaOverrideHint: string;
  usingDefaultServiceArea: (km: number, city: string) => string;
  activeStatus: string;
  activeStatusHint: string;
  save: string;
  saving: string;
  validation?: ServiceOfferingValidationLabels;
  serviceAreaSelector?: ServiceAreaSelectorLabels;
  serviceAreaAddress?: AddressInputLabels;
};

export interface ServiceOfferingFormProps {
  defaultValues?: Partial<ServiceOfferingValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: ServiceOfferingValues) => void | Promise<void>;
  serviceCategories?: Array<{ id: string; name: string; children?: Array<{ id: string; name: string }> }>;
  subcategories?: Array<{ id: string; name: string }>;
  /** Maps canonical English category names to the active locale (from host i18n). */
  getCategoryDisplayName?: (englishName: string) => string;
  onCategoryChange?: (categoryId: string) => void;
  defaultServiceArea?: ServiceArea;
  inDialog?: boolean;
  labels?: ServiceOfferingFormLabels;
}

// --- Section components ---

function TitleField({
  form,
  loading,
  labels,
}: {
  form: ReturnType<typeof useForm<ServiceOfferingValues>>;
  loading?: boolean;
  labels?: ServiceOfferingFormLabels;
}) {
  return (
    <Box mb={FORM_SPACING.fieldGap}>
      <Text as="label" size="2" weight="bold" htmlFor="service-title" mb={FORM_SPACING.labelGap}>
        {labels?.title ?? "Title"}
        <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
      </Text>
      <TextField.Root
        id="service-title"
        placeholder={labels?.titlePlaceholder ?? "Premium home cleaning"}
        size="2"
        disabled={loading}
        aria-required="true"
        {...form.register("title")}
      />
      {form.formState.errors.title && (
        <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>{form.formState.errors.title.message}</Text>
      )}
    </Box>
  );
}

function CategoryField({
  form,
  serviceCategories,
  loading,
  labels,
  getCategoryDisplayName,
}: {
  form: ReturnType<typeof useForm<ServiceOfferingValues>>;
  serviceCategories: Array<{ id: string; name: string }>;
  loading?: boolean;
  labels?: ServiceOfferingFormLabels;
  getCategoryDisplayName?: (englishName: string) => string;
}) {
  const displayName = getCategoryDisplayName ?? ((n: string) => n);
  return (
    <Box mb={FORM_SPACING.fieldGap}>
      <Text
        as="label"
        size="2"
        weight="bold"
        id="service-category-label"
        mb={FORM_SPACING.labelGap}
        style={{ display: "block" }}
      >
        {labels?.category ?? "Category"}
        <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
      </Text>
      <Select
        value={form.watch("category")}
        onValueChange={(value) => form.setValue("category", value)}
        disabled={loading}
      >
        <SelectTrigger
          id="service-category"
          aria-labelledby="service-category-label"
          style={{ width: "100%" }}
        />
        <SelectContent>
          {serviceCategories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {displayName(category.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {form.formState.errors.category && (
        <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>{form.formState.errors.category.message}</Text>
      )}
    </Box>
  );
}

function SubcategoriesField({
  subcategories,
  selectedSubcategories,
  onToggle,
  loading,
  labels,
  getCategoryDisplayName,
}: {
  subcategories: Array<{ id: string; name: string }>;
  selectedSubcategories: string[];
  onToggle: (id: string, checked: boolean | string) => void;
  loading?: boolean;
  labels?: ServiceOfferingFormLabels;
  getCategoryDisplayName?: (englishName: string) => string;
}) {
  const displayName = getCategoryDisplayName ?? ((n: string) => n);
  if (subcategories.length === 0) return null;
  return (
    <Box mb={FORM_SPACING.fieldGap}>
      <Text as="label" size="2" weight="bold" mb={FORM_SPACING.labelGap} style={{ display: "block" }}>
        {labels?.subcategoriesOptional ?? "Subcategories (optional)"}
      </Text>
      <Text
        as="p"
        size="1"
        color="gray"
        mb={FORM_SPACING.helperGap}
        style={{ display: "block", lineHeight: 1.5 }}
      >
        {labels?.subcategoriesHint ??
          "Select one or more subcategories that apply to this offering."}
      </Text>
      <Flex direction="column" gap="2">
        {subcategories.map((sub) => (
          <Flex key={sub.id} align="center" gap="3">
            <Checkbox
              id={`subcategory-${sub.id}`}
              checked={selectedSubcategories.includes(sub.id)}
              onCheckedChange={(checked) => onToggle(sub.id, checked as boolean | string)}
              disabled={loading}
              size="2"
            />
            <Text as="label" size="2" htmlFor={`subcategory-${sub.id}`}>
              {displayName(sub.name)}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}

function RateAndExperienceFields({
  form,
  loading,
  labels,
}: {
  form: ReturnType<typeof useForm<ServiceOfferingValues>>;
  loading?: boolean;
  labels?: ServiceOfferingFormLabels;
}) {
  return (
    <Box mb={FORM_SPACING.fieldGap}>
      <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
        <Box style={{ flex: 1 }}>
          <Text as="label" size="2" weight="bold" htmlFor="service-rate" mb={FORM_SPACING.labelGap}>
            {labels?.hourlyRate ?? "Hourly rate ($)"}
            <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
          </Text>
          <TextField.Root
            id="service-rate"
            type="number"
            min={0}
            step="5"
            size="2"
            disabled={loading}
            aria-required="true"
            {...form.register("hourlyRate", { valueAsNumber: true })}
          />
          {form.formState.errors.hourlyRate && (
            <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>{form.formState.errors.hourlyRate.message}</Text>
          )}
        </Box>
        <Box style={{ flex: 1 }}>
          <Text as="label" size="2" weight="bold" htmlFor="service-experience" mb={FORM_SPACING.labelGap}>
            {labels?.experienceYears ?? "Experience (years)"}
            <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
          </Text>
          <TextField.Root
            id="service-experience"
            type="number"
            min={0}
            max={50}
            size="2"
            disabled={loading}
            aria-required="true"
            {...form.register("experienceYears", { valueAsNumber: true })}
          />
          {form.formState.errors.experienceYears && (
            <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>{form.formState.errors.experienceYears.message}</Text>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

function DescriptionField({
  form,
  loading,
  labels,
}: {
  form: ReturnType<typeof useForm<ServiceOfferingValues>>;
  loading?: boolean;
  labels?: ServiceOfferingFormLabels;
}) {
  return (
    <Box mb={FORM_SPACING.fieldGap}>
      <Text as="label" size="2" weight="bold" htmlFor="service-desc" mb={FORM_SPACING.labelGap}>
        {labels?.description ?? "Description"}
        <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
      </Text>
      <TextArea
        id="service-desc"
        rows={5}
        placeholder={
          labels?.descriptionPlaceholder ??
          "Explain what clients can expect, what's included, and any preparation needed."
        }
        size="2"
        disabled={loading}
        aria-required="true"
        {...form.register("description")}
      />
      {form.formState.errors.description && (
        <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>{form.formState.errors.description.message}</Text>
      )}
    </Box>
  );
}

function ServiceAreaField({
  form,
  defaultServiceArea,
  loading,
  labels,
  selectorLabels,
  addressLabels,
}: {
  form: ReturnType<typeof useForm<ServiceOfferingValues>>;
  defaultServiceArea: ServiceArea;
  loading?: boolean;
  labels?: ServiceOfferingFormLabels;
  selectorLabels?: ServiceAreaSelectorLabels;
  addressLabels?: AddressInputLabels;
}) {
  const useOverride = form.watch("serviceAreaOverride");
  return (
    <Box mb={FORM_SPACING.fieldGap}>
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Text as="label" size="2" weight="bold" id="so-service-area-label">
            {labels?.serviceArea ?? "Service area"}
          </Text>
          <Controller
            name="serviceAreaOverride"
            control={form.control}
            render={({ field }) => (
              <Switch
                aria-labelledby="so-service-area-label"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={loading}
              />
            )}
          />
        </Flex>
        <Text size="1" color="gray">
          {labels?.serviceAreaOverrideHint ?? "Override default service area for this offering"}
        </Text>
      </Flex>
      {useOverride && (
        <Box mt="3">
          <Controller
            name="serviceArea"
            control={form.control}
            render={({ field }) => (
              <ServiceAreaSelector
                defaultArea={field.value}
                onSave={field.onChange}
                showSaveButton={false}
                loading={loading}
                allowOverride={true}
                defaultServiceArea={defaultServiceArea}
                selectorLabels={selectorLabels}
                addressLabels={addressLabels}
                showAddressCountry={false}
              />
            )}
          />
        </Box>
      )}
      {!useOverride && (
        <Callout.Root color={SEMANTIC_COLOR.success} variant="soft" mt="2">
          <Callout.Text>
            {labels?.usingDefaultServiceArea
              ? labels.usingDefaultServiceArea(
                  resolveServiceAreaRadiusKm(defaultServiceArea),
                  defaultServiceArea.centerAddress?.city || "your location",
                )
              : `Using default service area: ${resolveServiceAreaRadiusKm(defaultServiceArea)} km from ${defaultServiceArea.centerAddress?.city || "your location"}`}
          </Callout.Text>
        </Callout.Root>
      )}
    </Box>
  );
}

function ActiveStatusField({
  form,
  loading,
  labels,
}: {
  form: ReturnType<typeof useForm<ServiceOfferingValues>>;
  loading?: boolean;
  labels?: ServiceOfferingFormLabels;
}) {
  return (
    <Box mb={FORM_SPACING.fieldGap}>
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Text as="label" size="2" weight="bold" id="so-active-label">
            {labels?.activeStatus ?? "Active status"}
          </Text>
          <Controller
            name="active"
            control={form.control}
            render={({ field }) => (
              <Switch
                aria-labelledby="so-active-label"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={loading}
              />
            )}
          />
        </Flex>
        <Text size="1" color="gray">
          {labels?.activeStatusHint ??
            "Active offerings appear in search results. Inactive offerings are hidden."}
        </Text>
      </Flex>
    </Box>
  );
}

// --- Main form ---

export function ServiceOfferingForm({
  defaultValues,
  loading,
  error,
  onSubmit,
  serviceCategories = defaultCategories,
  subcategories = [],
  getCategoryDisplayName,
  onCategoryChange,
  defaultServiceArea,
  inDialog = false,
  labels,
}: ServiceOfferingFormProps) {
  const offeringSchema = useMemo(
    () => createServiceOfferingSchema(labels?.validation),
    [labels?.validation],
  );

  const form = useForm<ServiceOfferingValues>({
    resolver: zodResolver(offeringSchema),
    defaultValues: {
      title: "",
      category: serviceCategories[0]?.id || "",
      subcategories: [],
      hourlyRate: 60,
      experienceYears: 1,
      description: "",
      serviceAreaOverride: false,
      serviceArea: undefined,
      active: true,
      ...defaultValues,
    },
  });

  const selectedCategory = form.watch("category");
  const selectedSubcategories = form.watch("subcategories") || [];

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        title: defaultValues.title || "",
        category: defaultValues.category || serviceCategories[0]?.id || "",
        subcategories: defaultValues.subcategories || [],
        hourlyRate: defaultValues.hourlyRate ?? 60,
        experienceYears: defaultValues.experienceYears ?? 1,
        description: defaultValues.description || "",
        serviceAreaOverride: defaultValues.serviceAreaOverride ?? false,
        serviceArea: defaultValues.serviceArea,
        active: defaultValues.active ?? true,
      });
    }
  }, [defaultValues, form, serviceCategories]);

  useEffect(() => {
    if (selectedCategory && onCategoryChange) {
      onCategoryChange(selectedCategory);
      if (!defaultValues?.subcategories?.length) {
        form.setValue("subcategories", []);
      }
    }
  }, [selectedCategory, onCategoryChange, form, defaultValues]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  const handleSubcategoryToggle = (subcategoryId: string, checked: boolean | string) => {
    const isChecked = checked === true || checked === "indeterminate";
    const updated = isChecked
      ? [...selectedSubcategories, subcategoryId]
      : selectedSubcategories.filter((id) => id !== subcategoryId);
    form.setValue("subcategories", updated);
  };

  const formContent = (
    <Flex direction="column" gap="5">
      {!inDialog && (
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels?.pageTitle ?? "Service offering"}
          </Heading>
          <Text size="2" color="gray">
            {labels?.pageDescription ?? "Describe what you provide and your standard rates."}
          </Text>
        </Box>
      )}

      {error && (
        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}

      <form onSubmit={handleSubmit}>
        <TitleField form={form} loading={loading} labels={labels} />
        <CategoryField
          form={form}
          serviceCategories={serviceCategories}
          loading={loading}
          labels={labels}
          getCategoryDisplayName={getCategoryDisplayName}
        />
        <SubcategoriesField
          subcategories={subcategories}
          selectedSubcategories={selectedSubcategories}
          onToggle={handleSubcategoryToggle}
          loading={loading}
          labels={labels}
          getCategoryDisplayName={getCategoryDisplayName}
        />
        <RateAndExperienceFields form={form} loading={loading} labels={labels} />
        <DescriptionField form={form} loading={loading} labels={labels} />
        {defaultServiceArea && (
          <ServiceAreaField
            form={form}
            defaultServiceArea={defaultServiceArea}
            loading={loading}
            labels={labels}
            selectorLabels={labels?.serviceAreaSelector}
            addressLabels={labels?.serviceAreaAddress}
          />
        )}
        <ActiveStatusField form={form} loading={loading} labels={labels} />

        <Button type="submit" size="2" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
          {loading ? (labels?.saving ?? "Saving...") : (labels?.save ?? "Save offering")}
        </Button>
      </form>
    </Flex>
  );

  if (inDialog) return formContent;

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: "720px", minWidth: 0 }}>
      {formContent}
    </Card>
  );
}
