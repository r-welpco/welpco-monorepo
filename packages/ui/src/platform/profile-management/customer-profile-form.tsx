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
import { useEffect } from "react";
import { z } from "zod";
import { AddressInput, type AddressValues } from "./address-input";

export interface CustomerProfileFormProps {
  defaultValues?: Partial<CustomerProfileValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: CustomerProfileValues) => void | Promise<void>;
}

const addressSchema = z.object({
  streetAddress: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  stateProvince: z.string().min(2, "State/Province is required"),
  zipPostalCode: z.string().min(3, "ZIP/Postal code is required"),
  country: z.string().optional(),
});

const schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().min(7, "Phone number is required"),
  address: addressSchema,
});

export type CustomerProfileValues = z.infer<typeof schema>;

export function CustomerProfileForm({
  defaultValues,
  loading,
  error,
  onSubmit,
}: CustomerProfileFormProps) {
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
  // Without this, the profile fetch resolving after mount leaves the form
  // empty even though the user's data is on screen elsewhere — classic
  // "your form lies about what's saved" state-drift bug.
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

  const handleSubmit = form.handleSubmit(
    async (values: CustomerProfileValues) => {
      await onSubmit?.(values);
    }
  );

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Customer profile
          </Heading>
          <Text size="2" color="gray">
            Share a few details to personalize your experience.
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
                <Text as="label" size="2" weight="bold" htmlFor="customer-first-name" mb={FORM_SPACING.labelGap}>
                  First name
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                </Text>
                <TextField.Root
                  id="customer-first-name"
                  placeholder="Jane"
                  autoComplete="given-name"
                  size="2"
                  disabled={loading}
                  aria-required="true"
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                    {form.formState.errors.firstName.message}
                  </Text>
                )}
              </Box>

              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="bold" htmlFor="customer-last-name" mb={FORM_SPACING.labelGap}>
                  Last name
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                </Text>
                <TextField.Root
                  id="customer-last-name"
                  placeholder="Doe"
                  autoComplete="family-name"
                  size="2"
                  disabled={loading}
                  aria-required="true"
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                    {form.formState.errors.lastName.message}
                  </Text>
                )}
              </Box>
            </Flex>
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="customer-phone" mb={FORM_SPACING.labelGap}>
              Phone
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="customer-phone"
              placeholder="+1 (555) 000-0000"
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
              Address
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
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
                      errors={{
                        streetAddress: addressError?.issues?.find(i => i.path.includes("streetAddress"))?.message,
                        city: addressError?.issues?.find(i => i.path.includes("city"))?.message,
                        stateProvince: addressError?.issues?.find(i => i.path.includes("stateProvince"))?.message,
                        zipPostalCode: addressError?.issues?.find(i => i.path.includes("zipPostalCode"))?.message,
                      }}
                      loading={loading}
                      required
                    />
                    {fieldState.error && (
                      <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                        Please complete all address fields
                      </Text>
                    )}
                  </>
                );
              }}
            />
          </Box>

          <Button type="submit" size="2" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}
