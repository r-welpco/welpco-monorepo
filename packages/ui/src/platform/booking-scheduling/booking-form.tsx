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
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";

export interface BookingFormProps {
  services: { id: string; label: string }[];
  defaultValues?: Partial<BookingFormValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: BookingFormValues) => void | Promise<void>;
}

const schema = z.object({
  serviceId: z.string().min(1, "Select a service"),
  date: z.string().min(1, "Choose a date"),
  time: z.string().min(1, "Choose a time"),
  address: z.string().min(4, "Address is required"),
  notes: z.string().max(400).optional(),
});

export type BookingFormValues = z.infer<typeof schema>;

export function BookingForm({
  services,
  defaultValues,
  loading,
  error,
  onSubmit,
}: BookingFormProps) {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceId: services[0]?.id ?? "",
      date: "",
      time: "",
      address: "",
      notes: "",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values: BookingFormValues) => {
    await onSubmit?.(values);
  });

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: 720 }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Book a service
          </Heading>
          <Text size="2" color="gray">
            Choose a service, time, and location to confirm your booking.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              id="booking-service-label"
              size="2"
              weight="bold"
              mb={FORM_SPACING.labelGap}
            >
              Service
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <Select
              value={form.watch("serviceId")}
              onValueChange={(value) => form.setValue("serviceId", value)}
              disabled={loading}
            >
              <SelectTrigger aria-labelledby="booking-service-label" />
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.serviceId && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.serviceId.message}
              </Text>
            )}
          </Box>

          <Flex gap="3" mb={FORM_SPACING.fieldGap} direction={{ initial: "column", sm: "row" }}>
            <Box style={{ flex: 1 }}>
              <Text as="label" size="2" weight="bold" htmlFor="booking-date" mb={FORM_SPACING.labelGap}>
                Date
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <TextField.Root
                id="booking-date"
                type="date"
                size="3"
                disabled={loading}
                aria-required="true"
                {...form.register("date")}
              />
              {form.formState.errors.date && (
                <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.date.message}
                </Text>
              )}
            </Box>

            <Box style={{ flex: 1 }}>
              <Text as="label" size="2" weight="bold" htmlFor="booking-time" mb={FORM_SPACING.labelGap}>
                Time
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <TextField.Root
                id="booking-time"
                type="time"
                size="3"
                disabled={loading}
                aria-required="true"
                {...form.register("time")}
              />
              {form.formState.errors.time && (
                <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.time.message}
                </Text>
              )}
            </Box>
          </Flex>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="booking-address" mb={FORM_SPACING.labelGap}>
              Address
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="booking-address"
              placeholder="123 Market Street"
              autoComplete="street-address"
              size="3"
              disabled={loading}
              aria-required="true"
              {...form.register("address")}
            />
            {form.formState.errors.address && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.address.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="booking-notes" mb={FORM_SPACING.labelGap}>
              Notes (optional)
            </Text>
            <TextArea
              id="booking-notes"
              rows={4}
              placeholder="Share instructions, parking notes, or building access info."
              size="3"
              disabled={loading}
              {...form.register("notes")}
            />
            {form.formState.errors.notes && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.notes.message}
              </Text>
            )}
          </Box>

          <Button type="submit" size="3" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? "Scheduling..." : "Confirm booking"}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}

