"use client";

import { useLocale, useMessages } from "next-intl";
import type { ServiceQuestion } from "@/lib/services/booking-service";

/** CMS question copy keyed by exact English strings from BFF (temporary until questionKey + BFF locale). */
export type ServiceQuestionCopyMaps = {
  labels: Record<string, string>;
  placeholders: Record<string, string>;
  helpTexts: Record<string, string>;
  optionLabels: Record<string, string>;
};

export type ServiceQuestionCopy = {
  translateLabel: (english: string) => string;
  translatePlaceholder: (english: string | null | undefined) => string | undefined;
  translateHelpText: (english: string | null | undefined) => string | undefined;
  translateOptionLabel: (english: string) => string;
  translateQuestion: (
    question: ServiceQuestion["question"],
  ) => ServiceQuestion["question"];
};

function pick(
  english: string | null | undefined,
  map: Record<string, string> | undefined,
  locale: string,
): string | undefined {
  if (english == null || english === "") return undefined;
  if (locale === "en" || !map) return english;
  return map[english] ?? english;
}

export function createServiceQuestionCopy(
  locale: string,
  maps: ServiceQuestionCopyMaps | undefined,
): ServiceQuestionCopy {
  const translateLabel = (english: string) =>
    pick(english, maps?.labels, locale) ?? english;
  const translatePlaceholder = (english: string | null | undefined) =>
    pick(english ?? undefined, maps?.placeholders, locale);
  const translateHelpText = (english: string | null | undefined) =>
    pick(english ?? undefined, maps?.helpTexts, locale);
  const translateOptionLabel = (english: string) =>
    pick(english, maps?.optionLabels, locale) ?? english;

  const translateQuestion = (
    question: ServiceQuestion["question"],
  ): ServiceQuestion["question"] => ({
    ...question,
    label: translateLabel(question.label),
    placeholder: question.placeholder
      ? (translatePlaceholder(question.placeholder) ?? question.placeholder)
      : question.placeholder,
    helpText: question.helpText
      ? (translateHelpText(question.helpText) ?? question.helpText)
      : question.helpText,
    options: question.options?.map((opt) => ({
      ...opt,
      label: translateOptionLabel(opt.label),
    })),
  });

  return {
    translateLabel,
    translatePlaceholder,
    translateHelpText,
    translateOptionLabel,
    translateQuestion,
  };
}

export function getServiceQuestionCopyMaps(
  messages: unknown,
): ServiceQuestionCopyMaps | undefined {
  const dashboard = (messages as { dashboard?: { serviceQuestionCopy?: ServiceQuestionCopyMaps } })
    ?.dashboard;
  return dashboard?.serviceQuestionCopy;
}

export function useServiceQuestionCopy(): ServiceQuestionCopy {
  const locale = useLocale();
  const messages = useMessages();
  return createServiceQuestionCopy(locale, getServiceQuestionCopyMaps(messages));
}
