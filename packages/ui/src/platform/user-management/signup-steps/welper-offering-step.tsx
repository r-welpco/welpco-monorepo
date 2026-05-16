"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { Separator } from "@welpco/ui/separator";
import { Text } from "@welpco/ui/text";
import { TextArea } from "@welpco/ui/text-area";
import { TextField } from "@welpco/ui/text-field";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  DEFAULT_WELPER_OFFERING_LABELS,
  type WelperOfferingStepLabels,
} from "./labels";
import { SIGNUP_STEP_CARD_STYLE, type SignupStateLite } from "./types";

export interface WelperOfferingCategoryOption {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
}

function formatLabel(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

function createOfferingDraftSchema(labels: WelperOfferingStepLabels) {
  return z.object({
    parentCategoryId: z.string().min(1, labels.validation.parentRequired),
    subcategoryId: z.string().min(1, labels.validation.subcategoryRequired),
    title: z.string().trim().min(1, labels.validation.titleRequired),
    hourlyRate: z
      .number({ invalid_type_error: labels.validation.rateRequired })
      .min(1, labels.validation.rateMin),
    description: z.string().trim().min(1, labels.validation.descriptionRequired),
  });
}

type OfferingDraftFormValues = z.infer<ReturnType<typeof createOfferingDraftSchema>>;

export interface WelperOfferingItemValues {
  subcategoryId: string;
  title: string;
  hourlyRate: number;
  description: string;
}

export interface WelperOfferingStepValues {
  offerings: WelperOfferingItemValues[];
}

export interface WelperOfferingStepProps {
  state: SignupStateLite;
  categories: WelperOfferingCategoryOption[];
  categoriesLoading?: boolean;
  loading?: boolean;
  error?: string | null;
  labels?: WelperOfferingStepLabels;
  onSubmit: (values: WelperOfferingStepValues) => void | Promise<void>;
  onBack?: () => void;
}

const MAX_SERVICES = 3;

function emptyDraft(): OfferingDraftFormValues {
  return {
    parentCategoryId: "",
    subcategoryId: "",
    title: "",
    hourlyRate: 0,
    description: "",
  };
}

export function WelperOfferingStep({
  state,
  categories,
  categoriesLoading,
  loading,
  error,
  labels: labelsProp,
  onSubmit,
  onBack,
}: WelperOfferingStepProps) {
  const labels = labelsProp ?? DEFAULT_WELPER_OFFERING_LABELS;
  const offeringDraftSchema = useMemo(() => createOfferingDraftSchema(labels), [labels]);

  const filled = state.filledData.welperOffering as
    | { offerings?: WelperOfferingItemValues[] }
    | undefined;
  const filledOfferings = filled?.offerings ?? [];

  const parentCategories = useMemo(
    () =>
      categories
        .filter((c) => c.level === 1)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const subcategoriesByParent = useMemo(() => {
    const map = new Map<string, WelperOfferingCategoryOption[]>();
    for (const c of categories) {
      if (c.level !== 2 || !c.parentId) continue;
      const list = map.get(c.parentId) ?? [];
      list.push(c);
      map.set(c.parentId, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [categories]);

  const [savedOfferings, setSavedOfferings] = useState<WelperOfferingItemValues[]>(
    () =>
      filledOfferings.map((o) => ({
        subcategoryId: o.subcategoryId,
        title: o.title,
        hourlyRate: o.hourlyRate,
        description: o.description,
      })),
  );
  const [listError, setListError] = useState<string | null>(null);
  const [addFormExpanded, setAddFormExpanded] = useState(
    () => filledOfferings.length === 0,
  );

  const atMaxServices = savedOfferings.length >= MAX_SERVICES;
  const canAddMore = !atMaxServices;

  const form = useForm<OfferingDraftFormValues>({
    resolver: zodResolver(offeringDraftSchema) as never,
    defaultValues: emptyDraft(),
  });

  const parentCategoryId = form.watch("parentCategoryId");
  const subcategoryOptions = parentCategoryId
    ? (subcategoriesByParent.get(parentCategoryId) ?? [])
    : [];

  const subcategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "Service";

  const addOfferingToList = form.handleSubmit((values) => {
    setListError(null);
    if (savedOfferings.length >= MAX_SERVICES) {
      return;
    }
    setSavedOfferings((prev) => [
      ...prev,
      {
        subcategoryId: values.subcategoryId,
        title: values.title.trim(),
        hourlyRate: Number(values.hourlyRate),
        description: values.description.trim(),
      },
    ]);
    form.reset(emptyDraft());
    setAddFormExpanded(false);
  });

  const removeOffering = (index: number) => {
    setSavedOfferings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    setListError(null);
    if (savedOfferings.length === 0) {
      setListError(labels.addAtLeastOne);
      return;
    }
    await onSubmit({ offerings: savedOfferings });
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={SIGNUP_STEP_CARD_STYLE}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {formatLabel(labels.description, { max: MAX_SERVICES })}
          </Text>
        </Box>

        {(error || listError) && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error ?? listError}</Callout.Text>
          </Callout.Root>
        )}

        {savedOfferings.length > 0 && (
          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">
              {formatLabel(labels.yourServices, {
                count: savedOfferings.length,
                max: MAX_SERVICES,
              })}
            </Text>
            {savedOfferings.map((offering, index) => (
              <Flex
                key={`${offering.subcategoryId}-${index}`}
                align="start"
                justify="between"
                gap="3"
                p="3"
                style={{
                  border: "1px solid var(--gray-a5)",
                  borderRadius: "var(--radius-3)",
                }}
              >
                <Box style={{ minWidth: 0 }}>
                  <Text size="2" weight="medium" mb="1">
                    {offering.title}
                  </Text>
                  <Text size="1" color="gray" as="p" mb="1">
                    {subcategoryName(offering.subcategoryId)}
                  </Text>
                  <Text size="1" color="gray" as="p">
                    ${offering.hourlyRate}/hr
                  </Text>
                </Box>
                <Button
                  type="button"
                  size="1"
                  variant="soft"
                  color="gray"
                  disabled={loading}
                  onClick={() => removeOffering(index)}
                >
                  {labels.remove}
                </Button>
              </Flex>
            ))}
          </Flex>
        )}

        {canAddMore && savedOfferings.length > 0 && !addFormExpanded && (
          <Button
            type="button"
            size="2"
            variant="outline"
            color={SEMANTIC_COLOR.primary}
            disabled={loading}
            onClick={() => setAddFormExpanded(true)}
            style={{ width: "100%" }}
          >
            {labels.addAnother}
          </Button>
        )}

        {canAddMore && (savedOfferings.length === 0 || addFormExpanded) && (
        <Box>
          <Text size="2" weight="bold" mb={FORM_SPACING.labelGap}>
            {savedOfferings.length === 0 ? labels.firstService : labels.addAnother}
          </Text>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void addOfferingToList();
            }}
            noValidate
          >
            <Box mb={FORM_SPACING.fieldGap}>
              <Text
                as="label"
                id="signup-offering-parent-label"
                size="2"
                weight="bold"
                mb={FORM_SPACING.labelGap}
              >
                {labels.category}
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  {labels.requiredMarker}
                </Text>
              </Text>
              <Select
                size="2"
                value={parentCategoryId}
                disabled={loading || categoriesLoading}
                onValueChange={(value) => {
                  form.setValue("parentCategoryId", value, { shouldValidate: true });
                  form.setValue("subcategoryId", "");
                }}
              >
                <SelectTrigger
                  aria-labelledby="signup-offering-parent-label"
                  placeholder={
                    categoriesLoading ? labels.loadingCategories : labels.chooseCategory
                  }
                  style={{ width: "100%" }}
                />
                <SelectContent>
                  {parentCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.parentCategoryId && (
                <Text
                  role="alert"
                  size="1"
                  color={SEMANTIC_COLOR.danger}
                  mt={FORM_SPACING.helperGap}
                >
                  {form.formState.errors.parentCategoryId.message}
                </Text>
              )}
            </Box>

            <Box mb={FORM_SPACING.fieldGap}>
              <Text
                as="label"
                id="signup-offering-sub-label"
                size="2"
                weight="bold"
                mb={FORM_SPACING.labelGap}
              >
                {labels.subcategory}
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  {labels.requiredMarker}
                </Text>
              </Text>
              <Select
                size="2"
                value={form.watch("subcategoryId")}
                disabled={
                  loading || categoriesLoading || !parentCategoryId || subcategoryOptions.length === 0
                }
                onValueChange={(value) =>
                  form.setValue("subcategoryId", value, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  aria-labelledby="signup-offering-sub-label"
                  placeholder={
                    !parentCategoryId
                      ? labels.chooseCategoryFirst
                      : subcategoryOptions.length === 0
                        ? labels.noSubcategories
                        : labels.chooseSubcategory
                  }
                  style={{ width: "100%" }}
                />
                <SelectContent>
                  {subcategoryOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.subcategoryId && (
                <Text
                  role="alert"
                  size="1"
                  color={SEMANTIC_COLOR.danger}
                  mt={FORM_SPACING.helperGap}
                >
                  {form.formState.errors.subcategoryId.message}
                </Text>
              )}
            </Box>

            <Box mb={FORM_SPACING.fieldGap}>
              <Text
                as="label"
                size="2"
                weight="bold"
                htmlFor="signup-offering-title"
                mb={FORM_SPACING.labelGap}
              >
                {labels.serviceTitle}
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  {labels.requiredMarker}
                </Text>
              </Text>
              <TextField.Root
                id="signup-offering-title"
                size="2"
                disabled={loading}
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <Text
                  role="alert"
                  size="1"
                  color={SEMANTIC_COLOR.danger}
                  mt={FORM_SPACING.helperGap}
                >
                  {form.formState.errors.title.message}
                </Text>
              )}
            </Box>

            <Box mb={FORM_SPACING.fieldGap}>
              <Text
                as="label"
                size="2"
                weight="bold"
                htmlFor="signup-offering-rate"
                mb={FORM_SPACING.labelGap}
              >
                {labels.hourlyRate}
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  {labels.requiredMarker}
                </Text>
              </Text>
              <TextField.Root
                id="signup-offering-rate"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={1}
                size="2"
                disabled={loading}
                {...form.register("hourlyRate", { valueAsNumber: true })}
              />
              {form.formState.errors.hourlyRate && (
                <Text
                  role="alert"
                  size="1"
                  color={SEMANTIC_COLOR.danger}
                  mt={FORM_SPACING.helperGap}
                >
                  {form.formState.errors.hourlyRate.message}
                </Text>
              )}
            </Box>

            <Box mb={FORM_SPACING.fieldGap}>
              <Text
                as="label"
                size="2"
                weight="bold"
                htmlFor="signup-offering-description"
                mb={FORM_SPACING.labelGap}
              >
                {labels.descriptionLabel}
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                  {labels.requiredMarker}
                </Text>
              </Text>
              <TextArea
                id="signup-offering-description"
                rows={5}
                size="2"
                disabled={loading}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <Text
                  role="alert"
                  size="1"
                  color={SEMANTIC_COLOR.danger}
                  mt={FORM_SPACING.helperGap}
                >
                  {form.formState.errors.description.message}
                </Text>
              )}
            </Box>

            <Button
              type="submit"
              size="2"
              variant="soft"
              color={SEMANTIC_COLOR.primary}
              disabled={loading || categoriesLoading}
              style={{ width: "100%" }}
            >
              {labels.addToList}
            </Button>
          </form>
        </Box>
        )}

        <Separator size="4" />

        <Flex
          direction={{ initial: "column", sm: "row-reverse" }}
          gap="3"
        >
          <Button
            type="button"
            size="3"
            color={SEMANTIC_COLOR.primary}
            disabled={loading || savedOfferings.length === 0}
            onClick={() => void handleContinue()}
            style={{ width: "100%" }}
          >
            {loading ? labels.saving : labels.continue}
          </Button>
          {onBack && (
            <Button
              type="button"
              size="3"
              variant="soft"
              color="gray"
              disabled={loading}
              onClick={onBack}
              style={{ width: "100%" }}
            >
              {labels.back}
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}
