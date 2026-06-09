"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

const CANADIAN_PROVINCE_CODES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
] as const;

export function useCanadianProvinceLabels(): Record<string, string> {
  const t = useTranslations("dashboard.common.canadianProvinces");
  return useMemo(
    () =>
      Object.fromEntries(
        CANADIAN_PROVINCE_CODES.map((code) => [code, t(code)]),
      ),
    [t],
  );
}
