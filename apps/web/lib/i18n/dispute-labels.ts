"use client";

import { useTranslations } from "next-intl";

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
