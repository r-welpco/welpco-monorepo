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
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { Checkbox } from "@welpco/ui/checkbox";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export interface RecurringBookingFormProps {
  defaultValues?: Partial<RecurringBookingValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: RecurringBookingValues) => void | Promise<void>;
}

const schema = z
  .object({
    frequency: z.enum(["weekly", "biweekly", "monthly"]),
    startDate: z.string().min(1, "Choose a start date"),
    endDate: z.string().optional(),
    days: z.array(z.enum(days)).min(1, "Pick at least one day"),
  })
  .refine(
    (data) =>
      !data.endDate || new Date(data.endDate) >= new Date(data.startDate),
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export type RecurringBookingValues = z.infer<typeof schema>;

export function RecurringBookingForm({
  defaultValues,
  loading,
  error,
  onSubmit,
}: RecurringBookingFormProps) {
  const form = useForm<RecurringBookingValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      frequency: "weekly",
      startDate: "",
      endDate: "",
      days: ["Mon", "Wed"],
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(
    async (values: RecurringBookingValues) => {
      await onSubmit?.(values);
    }
  );

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: 720 }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Recurring booking
          </Heading>
          <Text size="2" color="gray">
            Set a repeating cadence to keep the schedule consistent.
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
              id="recurring-frequency-label"
              size="2"
              weight="bold"
              mb={FORM_SPACING.labelGap}
            >
              Frequency
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <Select
              value={form.watch("frequency")}
              onValueChange={(value) =>
                form.setValue("frequency", value as RecurringBookingValues["frequency"])
              }
              disabled={loading}
            >
              <SelectTrigger aria-labelledby="recurring-frequency-label" />
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.frequency && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.frequency.message}
              </Text>
            )}
          </Box>

          <Flex gap="3" mb={FORM_SPACING.fieldGap} direction={{ initial: "column", sm: "row" }}>
            <Box style={{ flex: 1 }}>
              <Text as="label" size="2" weight="bold" htmlFor="recurring-start" mb={FORM_SPACING.labelGap}>
                Start date
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <TextField.Root
                id="recurring-start"
                type="date"
                disabled={loading}
                aria-required="true"
                {...form.register("startDate")}
              />
              {form.formState.errors.startDate && (
                <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.startDate.message}
                </Text>
              )}
            </Box>
            <Box style={{ flex: 1 }}>
              <Text as="label" size="2" weight="bold" htmlFor="recurring-end" mb={FORM_SPACING.labelGap}>
                End date (optional)
              </Text>
              <TextField.Root
                id="recurring-end"
                type="date"
                disabled={loading}
                {...form.register("endDate")}
              />
              {form.formState.errors.endDate && (
                <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.endDate.message}
                </Text>
              )}
            </Box>
          </Flex>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="span" size="2" weight="bold" mb={FORM_SPACING.labelGap}>
              Days of week
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <Controller
              control={form.control}
              name="days"
              render={({ field }) => {
                const value = field.value ?? [];
                return (
                  <Flex gap="3" wrap="wrap" mt="2">
                    {days.map((day) => {
                      const checked = value.includes(day);
                      return (
                        <Flex key={day} align="center" gap="2">
                          <Checkbox
                            id={`day-${day}`}
                            checked={checked}
                            onCheckedChange={(next) => {
                              const isChecked = Boolean(next);
                              if (isChecked) {
                                field.onChange([...value, day]);
                              } else {
                                field.onChange(value.filter((item) => item !== day));
                              }
                            }}
                            disabled={loading}
                          />
                          <Text as="label" htmlFor={`day-${day}`} size="2">
                            {day}
                          </Text>
                        </Flex>
                      );
                    })}
                  </Flex>
                );
              }}
            />
            {form.formState.errors.days && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.days.message as string}
              </Text>
            )}
          </Box>

          <Button type="submit" size="3" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? "Saving..." : "Save schedule"}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}

