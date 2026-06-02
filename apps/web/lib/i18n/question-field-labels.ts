"use client";

import { useTranslations } from "next-intl";

export function useQuestionFieldLabels() {
  const t = useTranslations("dashboard.questionField");
  return {
    select: t("select"),
    yes: t("yes"),
    no: t("no"),
    entityChild: t("entityChild"),
    entityPerson: t("entityPerson"),
    entityPet: t("entityPet"),
    entityDefault: t("entityDefault"),
  };
}

export type QuestionFieldLabels = ReturnType<typeof useQuestionFieldLabels>;
