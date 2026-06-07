"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthBackground } from "@welpco/ui/platform/user-management";
import { Card } from "@welpco/ui/card";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  useApproveGuardianConsent,
  useDeclineGuardianConsent,
  useGuardianReviewPreview,
  useRevokeGuardianConsent,
} from "@/lib/hooks/use-guardian-consent";

const CARD_STYLE = { width: "100%", maxWidth: "480px", minWidth: 0 } as const;

function relationshipLabel(
  relationshipType: string,
  t: ReturnType<typeof useTranslations<"auth.guardianReview">>,
): string {
  switch (relationshipType) {
    case "Parent":
      return t("relationshipParent");
    case "Legal Guardian":
      return t("relationshipLegalGuardian");
    default:
      return relationshipType;
  }
}

export default function GuardianReviewPageClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("auth.guardianReview");
  const token = searchParams.get("token");
  const { data: preview, isLoading, isError } = useGuardianReviewPreview(token);
  const approve = useApproveGuardianConsent();
  const decline = useDeclineGuardianConsent();
  const revoke = useRevokeGuardianConsent();
  const [approved, setApproved] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <AuthBackground>
        <Card size="4" variant="surface" style={CARD_STYLE}>
          <Flex direction="column" gap="4" style={{ minWidth: 0 }}>
            <Box>
              <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
                {t("invalidLinkTitle")}
              </Heading>
              <Text size="2" color="gray">
                {t("invalidLinkDescription")}
              </Text>
            </Box>
            <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface" role="alert">
              <Callout.Text>{t("invalidLinkCallout")}</Callout.Text>
            </Callout.Root>
          </Flex>
        </Card>
      </AuthBackground>
    );
  }

  if (isLoading) {
    return (
      <AuthBackground>
        <Card size="4" variant="surface" style={CARD_STYLE}>
          <Text size="2" color="gray">
            {t("loading")}
          </Text>
        </Card>
      </AuthBackground>
    );
  }

  if (isError || !preview) {
    return (
      <AuthBackground>
        <Card size="4" variant="surface" style={CARD_STYLE}>
          <Flex direction="column" gap="4" style={{ minWidth: 0 }}>
            <Box>
              <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
                {t("invalidLinkTitle")}
              </Heading>
              <Text size="2" color="gray">
                {t("invalidLinkDescription")}
              </Text>
            </Box>
            <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
              <Callout.Text>{t("errors.loadFailed")}</Callout.Text>
            </Callout.Root>
          </Flex>
        </Card>
      </AuthBackground>
    );
  }

  const minorName = [preview.minorFirstName, preview.minorLastName].filter(Boolean).join(" ").trim();
  const localizedRelationship = relationshipLabel(preview.relationshipType, t);

  if (declined || revoked) {
    return (
      <AuthBackground>
        <Card size="4" variant="surface" style={CARD_STYLE}>
          <Flex direction="column" gap="4" style={{ minWidth: 0 }}>
            <Heading as="h1" size="6" trim="start">
              {revoked ? t("revokedTitle") : t("declinedTitle")}
            </Heading>
            <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface" role="status">
              <Callout.Text>
                {revoked ? t("revokedDescription") : t("declinedDescription")}
              </Callout.Text>
            </Callout.Root>
          </Flex>
        </Card>
      </AuthBackground>
    );
  }

  if (preview.alreadyApproved || approved) {
    return (
      <AuthBackground>
        <Card size="4" variant="surface" style={CARD_STYLE}>
          <Flex direction="column" gap="4" style={{ minWidth: 0 }}>
            <Box>
              <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
                {preview.alreadyApproved ? t("alreadyApprovedTitle") : t("successTitle")}
              </Heading>
              <Text size="2" color="gray">
                {preview.alreadyApproved
                  ? t("alreadyApprovedDescription")
                  : t("successDescription", { minorName: minorName || "them" })}
              </Text>
            </Box>
            <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
              <Callout.Text>
                {preview.alreadyApproved ? t("alreadyApprovedCallout") : t("successCallout")}
              </Callout.Text>
            </Callout.Root>
            <Button
              size="2"
              variant="soft"
              color={SEMANTIC_COLOR.danger}
              disabled={revoke.isPending}
              onClick={() => {
                setError(null);
                void revoke
                  .mutateAsync(token)
                  .then(() => setRevoked(true))
                  .catch((err: unknown) =>
                    setError(err instanceof Error ? err.message : t("errors.revokeFailed")),
                  );
              }}
            >
              {revoke.isPending ? t("revoking") : t("revoke")}
            </Button>
            {error ? (
              <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
                <Callout.Text>{error}</Callout.Text>
              </Callout.Root>
            ) : null}
          </Flex>
        </Card>
      </AuthBackground>
    );
  }

  if (preview.expired) {
    return (
      <AuthBackground>
        <Card size="4" variant="surface" style={CARD_STYLE}>
          <Flex direction="column" gap="4" style={{ minWidth: 0 }}>
            <Box>
              <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
                {t("expiredTitle")}
              </Heading>
              <Text size="2" color="gray">
                {t("expiredDescription")}
              </Text>
            </Box>
            <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface" role="alert">
              <Callout.Text>{t("expiredCallout")}</Callout.Text>
            </Callout.Root>
          </Flex>
        </Card>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <Card size="4" variant="surface" style={CARD_STYLE}>
        <Flex direction="column" gap="4" style={{ minWidth: 0 }}>
          <Box>
            <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
              {t("title")}
            </Heading>
            <Text size="2" color="gray" as="p">
              {t("intro", { minorName: minorName || "Your child" })}
            </Text>
            <Text size="2" color="gray" as="p" mt="2">
              {t("yourRole", {
                relationship: localizedRelationship,
                guardianName: preview.guardianFullName,
              })}
            </Text>
            <Text size="2" color="gray" as="p" mt="2">
              {t("explain")}
            </Text>
          </Box>

          {error ? (
            <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          ) : null}

          <Button
            size="3"
            color={SEMANTIC_COLOR.primary}
            disabled={approve.isPending}
            onClick={() => {
              setError(null);
              void approve
                .mutateAsync(token)
                .then(() => setApproved(true))
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : t("errors.approveFailed")),
                );
            }}
          >
            {approve.isPending ? t("approving") : t("approve")}
          </Button>
          <Button
            size="3"
            variant="soft"
            color={SEMANTIC_COLOR.danger}
            disabled={approve.isPending || decline.isPending}
            onClick={() => {
              setError(null);
              void decline
                .mutateAsync(token)
                .then(() => setDeclined(true))
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : t("errors.declineFailed")),
                );
            }}
          >
            {decline.isPending ? t("declining") : t("decline")}
          </Button>
        </Flex>
      </Card>
    </AuthBackground>
  );
}
