"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { AddressInput, type AddressInputLabels, type AddressValues } from "./address-input";
import { CANADIAN_PROVINCE_CODES } from "./canadian-provinces";

export interface CustomerProfileFormValidationLabels {
  firstNameRequired: string;
  lastNameRequired: string;
  phoneRequired: string;
  streetRequired: string;
  cityRequired: string;
  provinceRequired: string;
  postalInvalid: string;
}

export interface CustomerProfileFormLabels {
  title: string;
  description: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  firstNamePlaceholder: string;
  lastNamePlaceholder: string;
  phonePlaceholder: string;
  save: string;
  saving: string;
  addressIncomplete: string;
  addressFields: AddressInputLabels;
  validation: CustomerProfileFormValidationLabels;
}

const DEFAULT_LABELS: CustomerProfileFormLabels = {
  title: "Customer profile",
  description: "Share a few details to personalize your experience.",
  firstName: "First name",
  lastName: "Last name",
  phone: "Phone",
  address: "Address",
  firstNamePlaceholder: "Jane",
  lastNamePlaceholder: "Doe",
  phonePlaceholder: "+1 (555) 000-0000",
  save: "Save profile",
  saving: "Saving…",
  addressIncomplete: "Please complete all address fields",
  addressFields: {
    streetAddress: "Street address",
    city: "City",
    stateProvince: "Province",
    zipPostalCode: "Postal code",
    streetPlaceholder: "123 Main Street",
    provincePlaceholder: "Select province",
    country: "Country",
  },
  validation: {
    firstNameRequired: "First name is required",
    lastNameRequired: "Last name is required",
    phoneRequired: "Phone number is required",
    streetRequired: "Street address is required",
    cityRequired: "City is required",
    provinceRequired: "Select a province",
    postalInvalid: "Enter a valid Canadian postal code",
  },
};

function createCustomerProfileSchema(v: CustomerProfileFormValidationLabels) {
  const addressSchema = z.object({
    streetAddress: z.string().min(5, v.streetRequired),
    city: z.string().min(2, v.cityRequired),
    stateProvince: z.string().refine((val) => CANADIAN_PROVINCE_CODES.has(val), v.provinceRequired),
    zipPostalCode: z
      .string()
      .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, v.postalInvalid),
    country: z.string().optional(),
  });

  return z.object({
    firstName: z.string().min(2, v.firstNameRequired),
    lastName: z.string().min(2, v.lastNameRequired),
    phone: z.string().min(7, v.phoneRequired),
    address: addressSchema,
  });
}

export type CustomerProfileValues = z.infer<ReturnType<typeof createCustomerProfileSchema>>;

export interface CustomerProfileFormProps {
  defaultValues?: Partial<CustomerProfileValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: CustomerProfileValues) => void | Promise<void>;
  labels?: CustomerProfileFormLabels;
}

export function CustomerProfileForm({
  defaultValues,
  loading,
  error,
  onSubmit,
  labels: labelsProp,
}: CustomerProfileFormProps) {
  const labels = labelsProp ?? DEFAULT_LABELS;
  const schema = useMemo(
    () => createCustomerProfileSchema(labels.validation),
    [labels.validation],
  );

  const form = useForm<CustomerProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address: {
        streetAddress: "",
        city: "",
        stateProvince: "",
        zipPostalCode: "",
        country: "",
      },
      ...defaultValues,
    },
  });

  // Reset form when defaultValues arrive async (mirrors WelperProfileForm).
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        firstName: "",
        lastName: "",
        phone: "",
        address: {
          streetAddress: "",
          city: "",
          stateProvince: "",
          zipPostalCode: "",
          country: "",
        },
        ...defaultValues,
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values: CustomerProfileValues) => {
    await onSubmit?.(values);
  });

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {labels.description}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
              <Box style={{ flex: 1 }}>
                <Text
                  as="label"
                  size="2"
                  weight="bold"
                  htmlFor="customer-first-name"
                  mb={FORM_SPACING.labelGap}
                >
                  {labels.firstName}
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                    *
                  </Text>
                </Text>
                <TextField.Root
                  id="customer-first-name"
                  placeholder={labels.firstNamePlaceholder}
                  autoComplete="given-name"
                  size="2"
                  disabled={loading}
                  aria-required="true"
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <Text
                    size="1"
                    role="alert"
                    color={SEMANTIC_COLOR.danger}
                    mt={FORM_SPACING.helperGap}
                  >
                    {form.formState.errors.firstName.message}
                  </Text>
                )}
              </Box>

              <Box style={{ flex: 1 }}>
                <Text
                  as="label"
                  size="2"
                  weight="bold"
                  htmlFor="customer-last-name"
                  mb={FORM_SPACING.labelGap}
                >
                  {labels.lastName}
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                    *
                  </Text>
                </Text>
                <TextField.Root
                  id="customer-last-name"
                  placeholder={labels.lastNamePlaceholder}
                  autoComplete="family-name"
                  size="2"
                  disabled={loading}
                  aria-required="true"
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <Text
                    size="1"
                    role="alert"
                    color={SEMANTIC_COLOR.danger}
                    mt={FORM_SPACING.helperGap}
                  >
                    {form.formState.errors.lastName.message}
                  </Text>
                )}
              </Box>
            </Flex>
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="customer-phone" mb={FORM_SPACING.labelGap}>
              {labels.phone}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            </Text>
            <TextField.Root
              id="customer-phone"
              placeholder={labels.phonePlaceholder}
              autoComplete="tel"
              size="2"
              disabled={loading}
              aria-required="true"
              {...form.register("phone")}
            />
            {form.formState.errors.phone && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.phone.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" mb={FORM_SPACING.labelGap}>
              {labels.address}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            </Text>
            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => {
                const addressError = fieldState.error as z.ZodError<AddressValues> | undefined;
                return (
                  <>
                    <AddressInput
                      values={field.value}
                      onChange={field.onChange}
                      labels={labels.addressFields}
                      errors={{
                        streetAddress: addressError?.issues?.find((i) =>
                          i.path.includes("streetAddress"),
                        )?.message,
                        city: addressError?.issues?.find((i) => i.path.includes("city"))?.message,
                        stateProvince: addressError?.issues?.find((i) =>
                          i.path.includes("stateProvince"),
                        )?.message,
                        zipPostalCode: addressError?.issues?.find((i) =>
                          i.path.includes("zipPostalCode"),
                        )?.message,
                      }}
                      loading={loading}
                      required
                    />
                    {fieldState.error && (
                      <Text
                        size="1"
                        role="alert"
                        color={SEMANTIC_COLOR.danger}
                        mt={FORM_SPACING.helperGap}
                      >
                        {labels.addressIncomplete}
                      </Text>
                    )}
                  </>
                );
              }}
            />
          </Box>

          <Button
            type="submit"
            size="2"
            color={SEMANTIC_COLOR.primary}
            disabled={loading}
            mt={FORM_SPACING.submitGap}
          >
            {loading ? labels.saving : labels.save}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}
