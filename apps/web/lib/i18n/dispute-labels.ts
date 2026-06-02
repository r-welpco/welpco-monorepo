"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
type DisputeStatus =
  | "open"
  | "in-review"
  | "resolved"
  | "closed"
  | "escalated"
  | "withdrawn";

const DISPUTE_CATEGORY_IDS = [
  "no_show",
  "quality",
  "overcharge",
  "safety",
  "other",
] as const;

export function useDisputeCategoryLabel() {
  const t = useTranslations("dashboard.disputes.categories");
  return (raw: string) => {
    if ((DISPUTE_CATEGORY_IDS as readonly string[]).includes(raw)) {
      return t(raw as (typeof DISPUTE_CATEGORY_IDS)[number]);
    }
    return raw.replace(/_/g, " ");
  };
}

/** Category pick-list labels for the booking dispute form (customer + welper). */
export function useDisputeFormCategoryLabels() {
  const t = useTranslations("dashboard.disputes.categories");
  return {
    no_show: t("no_show"),
    quality: t("quality"),
    overcharge: t("overcharge"),
    safety: t("safety"),
    other: t("other"),
  };
}

const DISPUTE_STATUS_IDS = [
  "open",
  "in-review",
  "resolved",
  "closed",
  "escalated",
  "withdrawn",
] as const;

export function useDisputeStatusLabel() {
  const t = useTranslations("dashboard.disputes.status");
  return useCallback(
    (status: DisputeStatus) => {
      if ((DISPUTE_STATUS_IDS as readonly string[]).includes(status)) {
        return t(status as (typeof DISPUTE_STATUS_IDS)[number]);
      }
      return status;
    },
    [t],
  );
}
