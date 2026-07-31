"use client";

import { Text } from "@welpco/ui";
import { useAdminTimeZone } from "@/components/providers/admin-time-zone-provider";

type AdminDateTimeValue = string | number | Date | null | undefined;

function parseDate(value: AdminDateTimeValue): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date, timeZone: string, dateOnly: boolean): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    ...(dateOnly
      ? {}
      : {
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        }),
    timeZone,
  }).format(date);
}

export function AdminDateTime({
  value,
  dateOnly = false,
  timeZone,
  fallback = "—",
}: {
  value: AdminDateTimeValue;
  dateOnly?: boolean;
  timeZone?: string | null;
  fallback?: string;
}) {
  const browserTimeZone = useAdminTimeZone();
  const date = parseDate(value);
  if (!date)
    return <>{value == null || value === "" ? fallback : String(value)}</>;

  // UTC keeps server and first-client output identical; the provider replaces
  // it with the operator's browser timezone immediately after hydration.
  const resolvedTimeZone = timeZone || browserTimeZone || "UTC";
  const iso = date.toISOString();

  return (
    <time
      dateTime={iso}
      title={`${iso} · ${resolvedTimeZone}`}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {formatDate(date, resolvedTimeZone, dateOnly)}
    </time>
  );
}

export function AdminTimeZoneLabel() {
  const timeZone = useAdminTimeZone();

  return (
    <Text
      size="1"
      color="gray"
      title="Dates and times use this browser timezone"
    >
      Times: {timeZone ?? "UTC"}
    </Text>
  );
}
