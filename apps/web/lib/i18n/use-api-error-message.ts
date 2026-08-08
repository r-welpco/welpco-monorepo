"use client";

import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ApiClientError } from "@/lib/api/client";

export type PublicContentErrorContext =
  | "auto"
  | "bio"
  | "jobPosting"
  | "jobApplication"
  | "serviceOffering"
  | "portfolioCaption"
  | "publicContent";

type MarketplaceViolation = "email" | "phone" | "negotiation";

interface MarketplacePolicyBody {
  code?: unknown;
  fields?: unknown;
  violations?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function policyBody(error: unknown): MarketplacePolicyBody | null {
  if (!(error instanceof ApiClientError)) return null;
  const body = isRecord(error.body) ? error.body : null;
  const code = typeof body?.code === "string" ? body.code : error.code;
  return code === "MARKETPLACE_DESCRIPTION_POLICY_VIOLATION" ? (body ?? {}) : null;
}

function violationsFrom(body: MarketplacePolicyBody): MarketplaceViolation[] {
  if (!Array.isArray(body.violations)) return [];
  return [...new Set(body.violations)].filter(
    (value): value is MarketplaceViolation =>
      value === "email" || value === "phone" || value === "negotiation",
  );
}

function fieldsFrom(body: MarketplacePolicyBody): string[] {
  return Array.isArray(body.fields)
    ? body.fields.filter((value): value is string => typeof value === "string")
    : [];
}

function inferredContext(fields: string[]): PublicContentErrorContext {
  if (fields.some((field) => /(?:^|\.)bio$/.test(field))) return "bio";
  if (fields.some((field) => /(?:^|\.)proposalMessage$/.test(field))) {
    return "jobApplication";
  }
  if (fields.some((field) => /(?:^|\.)caption$/.test(field))) {
    return "portfolioCaption";
  }
  if (
    fields.some(
      (field) =>
        /(?:^|\.)serviceDescription$/.test(field) ||
        /(?:^|\.)offerings(?:\.|$)/.test(field),
    )
  ) {
    return "serviceOffering";
  }
  return "publicContent";
}

/**
 * Converts structured BFF policy failures into locale-aware, field-specific
 * copy. Non-policy errors keep their existing message and fallback behavior.
 */
export function useApiErrorMessage() {
  const locale = useLocale();
  const t = useTranslations("validation.publicContentPolicy");
  const french = locale.toLowerCase().startsWith("fr");

  return useCallback(
    (
      error: unknown,
      context: PublicContentErrorContext = "auto",
      fallback?: string,
    ): string => {
      const genericFallback = fallback ?? (t.has("fallback")
        ? t("fallback")
        : french
          ? "Impossible d’enregistrer vos modifications. Réessayez."
          : "We couldn't save your changes. Please try again.");
      const body = policyBody(error);
      if (!body) return error instanceof Error ? error.message : genericFallback;

      const violations = violationsFrom(body);
      const labels = violations.map((violation) => {
        switch (violation) {
          case "email":
            return t.has("violations.email")
              ? t("violations.email")
              : french ? "une adresse courriel" : "an email address";
          case "phone":
            return t.has("violations.phone")
              ? t("violations.phone")
              : french ? "un numéro de téléphone" : "a phone number";
          case "negotiation":
            return t.has("violations.negotiation")
              ? t("violations.negotiation")
              : french
                ? "du contenu sur la négociation des tarifs"
                : "language about negotiating rates";
        }
      });
      const violationList = labels.length
        ? new Intl.ListFormat(locale, {
            style: "long",
            type: "conjunction",
          }).format(labels)
        : t.has("violations.restrictedContent")
          ? t("violations.restrictedContent")
          : french ? "du contenu interdit" : "restricted content";
      const resolvedContext = context === "auto"
        ? inferredContext(fieldsFrom(body))
        : context;

      switch (resolvedContext) {
        case "bio":
          return t.has("contexts.bio")
            ? t("contexts.bio", { violations: violationList })
            : french
              ? `Votre bio ne peut pas contenir ${violationList}. Retirez ce contenu, puis réessayez.`
              : `Your bio can’t include ${violationList}. Remove that content and try again.`;
        case "jobPosting":
          return t.has("contexts.jobPosting")
            ? t("contexts.jobPosting", { violations: violationList })
            : french
              ? `Votre annonce ne peut pas contenir ${violationList}. Retirez ce contenu, puis réessayez.`
              : `Your job post can’t include ${violationList}. Remove that content and try again.`;
        case "jobApplication":
          return t.has("contexts.jobApplication")
            ? t("contexts.jobApplication", { violations: violationList })
            : french
              ? `Votre proposition ne peut pas contenir ${violationList}. Retirez ce contenu, puis réessayez.`
              : `Your proposal can’t include ${violationList}. Remove that content and try again.`;
        case "serviceOffering":
          return t.has("contexts.serviceOffering")
            ? t("contexts.serviceOffering", { violations: violationList })
            : french
              ? `Votre offre de service ne peut pas contenir ${violationList}. Retirez ce contenu, puis réessayez.`
              : `Your service offering can’t include ${violationList}. Remove that content and try again.`;
        case "portfolioCaption":
          return t.has("contexts.portfolioCaption")
            ? t("contexts.portfolioCaption", { violations: violationList })
            : french
              ? `La légende de votre photo ne peut pas contenir ${violationList}. Retirez ce contenu, puis réessayez.`
              : `Your photo caption can’t include ${violationList}. Remove that content and try again.`;
        default:
          return t.has("contexts.publicContent")
            ? t("contexts.publicContent", { violations: violationList })
            : french
              ? `Ce contenu public ne peut pas contenir ${violationList}. Retirez ce contenu, puis réessayez.`
              : `This public content can’t include ${violationList}. Remove that content and try again.`;
      }
    },
    [french, locale, t],
  );
}
