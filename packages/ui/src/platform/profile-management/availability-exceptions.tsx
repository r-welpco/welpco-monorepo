"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { TextArea } from "@welpco/ui/text-area";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Badge } from "@welpco/ui/badge";
import { Callout } from "@welpco/ui/callout";
import { Dialog, DialogTrigger, DialogContent } from "@welpco/ui/dialog";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState } from "react";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import { Plus, X, Calendar, Gift } from "lucide-react";

/** Get YYYY-MM-DD from a date (API may return UTC midnight; we treat as calendar date). */
function toDateOnlyString(date: Date | string): string {
  if (typeof date === "string") return date.slice(0, 10);
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Format a date-only value for display (avoids timezone shifting Feb 2 to Jan 30). */
function formatDateOnly(date: Date | string, fmt: string, locale?: Locale): string {
  const s = toDateOnlyString(date);
  const [y, m, d] = s.split("-").map(Number);
  return format(new Date(y, m - 1, d), fmt, locale ? { locale } : undefined);
}

export type AvailabilityExceptionsLabels = {
  title: string;
  description: string;
  addException: string;
  dialogTitle: string;
  dialogDescription: string;
  startDate: string;
  endDateOptional: string;
  endDateHint: string;
  availabilityStatus: string;
  available: string;
  unavailable: string;
  reasonOptional: string;
  reasonPlaceholder: string;
  charCount: (count: number, max: number) => string;
  cancel: string;
  addExceptionConfirm: string;
  pickDate: string;
  endDateInvalid: string;
  reasonTooLong: (max: number) => string;
  emptyCallout: string;
  removeAria: string;
  holidaysTitle: string;
  holidaysDescription: string;
  loadingHolidays: string;
  addHolidayUnavailable: string;
};

function isSameDateOnly(a: Date | string, b: Date | string): boolean {
  return toDateOnlyString(a) === toDateOnlyString(b);
}

export interface AvailabilityException {
  id: string;
  date: Date;
  endDate?: Date;
  available: boolean;
  reason?: string;
}

/** Holiday reference (country/province holidays for adding as exceptions) */
export interface HolidayOption {
  id: string;
  name: string;
  date: Date;
  endDate?: Date | null;
}

export interface AvailabilityExceptionsProps {
  exceptions?: AvailabilityException[];
  /** Holidays for the user's region (e.g. from GET /api/profiles/holidays) */
  holidays?: HolidayOption[];
  holidaysLoading?: boolean;
  loading?: boolean;
  onAdd?: (exception: Omit<AvailabilityException, "id">) => void | Promise<void>;
  onRemove?: (id: string) => void | Promise<void>;
  onUpdate?: (exception: AvailabilityException) => void | Promise<void>;
  /** Add a holiday as an availability exception */
  onAddHoliday?: (holiday: HolidayOption) => void | Promise<void>;
  labels?: AvailabilityExceptionsLabels;
  dateLocale?: Locale;
}

export function AvailabilityExceptions({
  exceptions = [],
  holidays = [],
  holidaysLoading = false,
  loading,
  onAdd,
  onRemove,
  onUpdate,
  onAddHoliday,
  labels,
  dateLocale,
}: AvailabilityExceptionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");
  const [available, setAvailable] = useState(true);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const REASON_MAX = 200;

  const resetDialog = () => {
    setSelectedDate("");
    setSelectedEndDate("");
    setAvailable(true);
    setReason("");
    setFormError(null);
  };

  const handleAddException = async () => {
    if (!selectedDate) {
      setFormError(labels?.pickDate ?? "Pick a date.");
      return;
    }

    const date = new Date(selectedDate);
    const endDate = selectedEndDate ? new Date(selectedEndDate) : undefined;
    if (endDate && date > endDate) {
      setFormError(labels?.endDateInvalid ?? "End date must be on or after the start date.");
      return;
    }
    if (reason.length > REASON_MAX) {
      setFormError(
        labels?.reasonTooLong
          ? labels.reasonTooLong(REASON_MAX)
          : `Reason must be under ${REASON_MAX} characters.`,
      );
      return;
    }

    setFormError(null);
    const newException: Omit<AvailabilityException, "id"> = {
      date,
      endDate,
      available,
      reason: reason || undefined,
    };

    if (onAdd) {
      await onAdd(newException);
    }

    resetDialog();
    setIsDialogOpen(false);
  };

  const handleRemove = async (id: string) => {
    if (onRemove) {
      await onRemove(id);
    }
  };

  const getExceptionStatus = (exception: AvailabilityException) => {
    return exception.available ? "available" : "unavailable";
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "720px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Flex align="center" justify="between">
          <Box>
            <Heading size="4" mb="1">
              {labels?.title ?? "Availability exceptions"}
            </Heading>
            <Text size="2" color="gray" highContrast>
              {labels?.description ??
                "Set specific dates as available or unavailable (e.g. holidays, time off, or extra availability)."}
            </Text>
          </Box>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger>
              <Button size="2" color={SEMANTIC_COLOR.primary}>
                <Flex align="center" gap="2">
                  <Plus style={{ width: "16px", height: "16px" }} />
                  {labels?.addException ?? "Add exception"}
                </Flex>
              </Button>
            </DialogTrigger>
            <DialogContent
              title={labels?.dialogTitle ?? "Add availability exception"}
              description={
                labels?.dialogDescription ??
                "Set a single date or a date range as available or unavailable."
              }
            >
              <Flex direction="column" gap="5">
                <Box mb="3">
                  <Text as="label" size="2" weight="medium" htmlFor="exception-date" mb={FORM_SPACING.labelGap}>
                    {labels?.startDate ?? "Start date"}
                    <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                  </Text>
                  <TextField.Root
                    id="exception-date"
                    type="date"
                    size="2"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    disabled={loading}
                  />
                </Box>
                <Box mb="3">
                  <Text as="label" size="2" weight="medium" htmlFor="exception-end-date" mb={FORM_SPACING.labelGap}>
                    {labels?.endDateOptional ?? "End date (optional)"}
                  </Text>
                  <TextField.Root
                    id="exception-end-date"
                    type="date"
                    size="2"
                    value={selectedEndDate}
                    onChange={(e) => setSelectedEndDate(e.target.value)}
                    disabled={loading}
                    min={selectedDate || undefined}
                  />
                  <Text size="1" color="gray" mt={FORM_SPACING.helperGap} highContrast>
                    {labels?.endDateHint ?? "Leave blank for a single day."}
                  </Text>
                </Box>

                <Box mb="3">
                  <Text as="label" size="2" weight="medium" mb={FORM_SPACING.labelGap}>
                    {labels?.availabilityStatus ?? "Availability status"}
                  </Text>
                  <Flex gap="3">
                    <Button
                      type="button"
                      variant={available ? "solid" : "outline"}
                      color={SEMANTIC_COLOR.primary}
                      size="2"
                      onClick={() => setAvailable(true)}
                      disabled={loading}
                    >
                      {labels?.available ?? "Available"}
                    </Button>
                    <Button
                      type="button"
                      variant={!available ? "solid" : "outline"}
                      color={SEMANTIC_COLOR.danger}
                      size="2"
                      onClick={() => setAvailable(false)}
                      disabled={loading}
                    >
                      {labels?.unavailable ?? "Unavailable"}
                    </Button>
                  </Flex>
                </Box>

                <Box mb="3">
                  <Text as="label" size="2" weight="medium" htmlFor="exception-reason" mb={FORM_SPACING.labelGap}>
                    {labels?.reasonOptional ?? "Reason (optional)"}
                  </Text>
                  <TextArea
                    id="exception-reason"
                    rows={3}
                    placeholder={labels?.reasonPlaceholder ?? "e.g., Personal appointment, Holiday"}
                    size="2"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    disabled={loading}
                    maxLength={REASON_MAX}
                    aria-describedby="exception-reason-counter"
                  />
                  <Text id="exception-reason-counter" size="1" color="gray" highContrast mt={FORM_SPACING.helperGap}>
                    {labels?.charCount
                      ? labels.charCount(reason.length, REASON_MAX)
                      : `${reason.length} / ${REASON_MAX} characters`}
                  </Text>
                </Box>

                {formError && (
                  <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
                    <Callout.Text>{formError}</Callout.Text>
                  </Callout.Root>
                )}

                <Flex gap="2" justify="end" wrap="wrap" mt="3">
                  <Button
                    type="button"
                    variant="ghost"
                    color="gray"
                    onClick={() => {
                      resetDialog();
                      setIsDialogOpen(false);
                    }}
                  >
                    {labels?.cancel ?? "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    color={SEMANTIC_COLOR.primary}
                    onClick={handleAddException}
                    disabled={loading || !selectedDate}
                  >
                    {labels?.addExceptionConfirm ?? "Add exception"}
                  </Button>
                </Flex>
              </Flex>
            </DialogContent>
          </Dialog>
        </Flex>

        {exceptions.length === 0 ? (
          <Callout.Root color="gray" variant="soft">
            <Callout.Text>
              {labels?.emptyCallout ??
                "No availability exceptions. Add specific dates when your availability differs from the regular schedule above."}
            </Callout.Text>
          </Callout.Root>
        ) : (
          <Flex direction="column" gap="2">
            {exceptions.map((exception) => (
              <Card key={exception.id} size="2" variant="surface">
                <Flex align="center" justify="between" gap="3">
                  <Flex align="center" gap="3" style={{ flex: 1 }}>
                    <Calendar style={{ width: "20px", height: "20px", color: "var(--gray-9)" }} />
                    <Box>
                      <Text size="2" weight="bold">
                        {exception.endDate && !isSameDateOnly(exception.date, exception.endDate)
                          ? `${formatDateOnly(exception.date, "MMM d", dateLocale)} – ${formatDateOnly(exception.endDate, "MMM d, yyyy", dateLocale)}`
                          : formatDateOnly(exception.date, "MMMM d, yyyy", dateLocale)}
                      </Text>
                      {exception.reason && (
                        <Text size="2" color="gray" highContrast>
                          {exception.reason}
                        </Text>
                      )}
                    </Box>
                    <Badge
                      color={exception.available ? "green" : "red"}
                      variant="soft"
                      size="2"
                    >
                      {exception.available
                        ? (labels?.available ?? "Available")
                        : (labels?.unavailable ?? "Unavailable")}
                    </Badge>
                  </Flex>
                  <Button
                    type="button"
                    variant="ghost"
                    color={SEMANTIC_COLOR.danger}
                    size="2"
                    onClick={() => handleRemove(exception.id)}
                    disabled={loading}
                    aria-label={labels?.removeAria ?? "Remove availability exception"}
                  >
                    <X aria-hidden="true" style={{ width: "16px", height: "16px" }} />
                  </Button>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}

        {holidays.length > 0 && (
          <Box pt="4" style={{ borderTop: "1px solid var(--gray-6)" }}>
            <Heading as="h3" size="3" mb="3">
              {labels?.holidaysTitle ?? "Holidays"}
            </Heading>
            <Text size="2" color="gray" mb="3" highContrast>
              {labels?.holidaysDescription ??
                "Add a holiday as an availability exception so clients don't book on those days."}
            </Text>
            {holidaysLoading ? (
              <Text size="2" color="gray" highContrast>
                {labels?.loadingHolidays ?? "Loading holidays…"}
              </Text>
            ) : (
              <Flex direction="column" gap="2">
                {holidays.map((holiday) => (
                  <Card key={holiday.id} size="2" variant="surface">
                    <Flex align="center" justify="between" gap="3">
                      <Flex align="center" gap="3" style={{ flex: 1 }}>
                        <Gift style={{ width: "20px", height: "20px", color: "var(--gray-9)" }} />
                        <Box>
                          <Text size="2" weight="bold" as="p">
                            {holiday.name}
                          </Text>
                          <Text size="2" color="gray" highContrast as="p" mt="1">
                            {holiday.endDate && !isSameDateOnly(holiday.date, holiday.endDate)
                              ? `${formatDateOnly(holiday.date, "MMM d", dateLocale)} – ${formatDateOnly(holiday.endDate, "MMM d, yyyy", dateLocale)}`
                              : formatDateOnly(holiday.date, "MMMM d, yyyy", dateLocale)}
                          </Text>
                        </Box>
                      </Flex>
                      {onAddHoliday && (
                        <Button
                          type="button"
                          size="2"
                          variant="soft"
                          color={SEMANTIC_COLOR.warning}
                          onClick={() => onAddHoliday(holiday)}
                          disabled={loading}
                        >
                          {labels?.addHolidayUnavailable ?? "Add as unavailable"}
                        </Button>
                      )}
                    </Flex>
                  </Card>
                ))}
              </Flex>
            )}
          </Box>
        )}
      </Flex>
    </Card>
  );
}

