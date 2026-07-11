"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@welpco/ui/badge";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Code } from "@welpco/ui/code";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Heading } from "@welpco/ui/heading";
import { Skeleton } from "@welpco/ui/skeleton";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Check, Copy, Download } from "lucide-react";
import { useAppOrigin } from "@/lib/hooks/use-app-origin";
import { useProfileViewStats, useShareProfileInfo } from "@/lib/hooks/use-share-hub";
import type { DashboardServerUser } from "@/lib/hooks/use-dashboard-user";
import { ClaimHandleForm } from "@/components/features/share/claim-handle-form";
import { ShareQrCode } from "@/components/features/share/share-qr-code";

/**
 * SHARE-004 — Share hub v1: profile link (+ set-once handle claim), QR code
 * with embedded logomark, downloadable cards in three formats, and the
 * SHARE-005 profile-view totals. Every link/asset carries its `src` code
 * (`link`, `qr`, `story`, `square`, `og`).
 */

interface SharePageClientProps {
  user: DashboardServerUser;
}

const CARD_FORMATS = [
  { format: "story", width: 1080, height: 1920 },
  { format: "square", width: 1080, height: 1080 },
  { format: "landscape", width: 1200, height: 630 },
] as const;

/** Card downloads come in both languages — cards travel, UI locale doesn't. */
const CARD_LANGS = ["en", "fr"] as const;

/** src codes the BFF whitelists — anything else is counted as `unknown`. */
const KNOWN_SRC = [
  "link",
  "qr",
  "story",
  "square",
  "og",
  "qr-story",
  "qr-square",
  "qr-landscape",
  "direct",
  "unknown",
] as const;
type KnownSrc = (typeof KNOWN_SRC)[number];

function isKnownSrc(src: string): src is KnownSrc {
  return (KNOWN_SRC as readonly string[]).includes(src);
}

export default function SharePageClient({ user }: SharePageClientProps) {
  const t = useTranslations("dashboard.share");
  const { data: shareInfo, isPending: shareInfoPending, isError: shareInfoError } =
    useShareProfileInfo();
  const { data: viewStats, isPending: viewsPending } = useProfileViewStats();

  // For welpers the JWT user id IS the public welperId; the query only adds
  // the handle. Fall back to the session id so the hub works even if /me is slow.
  const welperId = shareInfo?.welperId ?? user.id;
  const handle = shareInfo?.handle ?? null;

  // No hardcoded domain: build-time env fallback, corrected to the real
  // window origin on mount (previews and local dev show their own host).
  const { origin, host } = useAppOrigin();

  const profilePath = handle ? `/w/${handle}` : `/welper/${welperId}`;
  const displayUrl = useMemo(
    () => `${host}${profilePath}`,
    [host, profilePath],
  );
  const copyUrl = `${origin}${profilePath}?src=link`;
  const qrTarget = `${origin}${profilePath}?src=qr`;
  const slug = handle ?? welperId;

  const [copied, setCopied] = useState(false);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyUrl);
      setCopied(true);
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
      copyResetRef.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — leave the URL
      // visible for manual selection.
    }
  }, [copyUrl]);
  useEffect(
    () => () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    },
    [],
  );

  const srcLabel = useCallback(
    (src: string): string => (isKnownSrc(src) ? t(`views.src.${src}`) : src),
    [t],
  );

  const visibleSrcTotals = (viewStats?.totalsBySrc ?? []).filter((row) => row.count > 0);

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="6" minWidth="0">
        <Box>
          <Heading as="h1" size="7" mb="2" trim="start">
            {t("title")}
          </Heading>
          <Text as="p" size="3" color="gray" highContrast>
            {t("subtitle")}
          </Text>
        </Box>

        {/* 1. Your link + handle claim */}
        <Card size="3" variant="surface">
          <Flex direction="column" gap="4">
            <Box>
              <Text as="p" size="3" weight="bold" mb="1">
                {t("link.title")}
              </Text>
              <Text as="p" size="2" color="gray">
                {t("link.subtitle")}
              </Text>
            </Box>

            {shareInfoError ? (
              <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
                <Callout.Text>{t("link.loadError")}</Callout.Text>
              </Callout.Root>
            ) : shareInfoPending ? (
              <Skeleton height="32px" style={{ maxWidth: "420px" }} />
            ) : (
              <>
                <Flex align="center" gap="2" wrap="wrap">
                  <Code size="3" variant="soft" color={SEMANTIC_COLOR.primary}>
                    {displayUrl}
                  </Code>
                  <Button
                    size="2"
                    variant="soft"
                    color={copied ? SEMANTIC_COLOR.success : SEMANTIC_COLOR.primary}
                    onClick={() => void handleCopy()}
                  >
                    {copied ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      <Copy size={16} aria-hidden="true" />
                    )}
                    {copied ? t("link.copied") : t("link.copy")}
                  </Button>
                </Flex>
                <Text as="p" size="1" color="gray">
                  {t("link.srcNote")}
                </Text>

                {handle ? (
                  <Text as="p" size="1" color="gray">
                    {t("handle.claimedNote")}
                  </Text>
                ) : (
                  <Box
                    pt="3"
                    style={{ borderTop: "1px solid var(--gray-4)" }}
                  >
                    <Text as="p" size="2" mb="3">
                      {t("handle.intro")}
                    </Text>
                    <ClaimHandleForm />
                  </Box>
                )}
              </>
            )}
          </Flex>
        </Card>

        {/* 2. QR code */}
        <Card size="3" variant="surface">
          <Flex direction="column" gap="4">
            <Box>
              <Text as="p" size="3" weight="bold" mb="1">
                {t("qr.title")}
              </Text>
              <Text as="p" size="2" color="gray">
                {t("qr.subtitle")}
              </Text>
            </Box>
            {shareInfoPending ? (
              <Skeleton height="196px" width="196px" />
            ) : (
              <ShareQrCode
                target={qrTarget}
                slug={slug}
                downloadLabel={t("qr.download")}
                downloadingLabel={t("qr.downloading")}
                qrAriaLabel={t("qr.aria")}
              />
            )}
          </Flex>
        </Card>

        {/* 3. Share cards */}
        <Card size="3" variant="surface">
          <Flex direction="column" gap="4">
            <Box>
              <Text as="p" size="3" weight="bold" mb="1">
                {t("cards.title")}
              </Text>
              <Text as="p" size="2" color="gray">
                {t("cards.subtitle")}
              </Text>
            </Box>
            <Grid columns={{ initial: "1", sm: "3" }} gap="3">
              {CARD_FORMATS.map(({ format, width, height }) => (
                <Card key={format} size="2" variant="surface">
                  <Flex direction="column" gap="2">
                    <Text as="p" size="2" weight="medium">
                      {t(`cards.formats.${format}`)}
                    </Text>
                    <Text as="p" size="1" color="gray">
                      {width}×{height}
                    </Text>
                    {/* Cards travel beyond the dashboard locale — offer both languages. */}
                    <Flex gap="2" wrap="wrap">
                      {CARD_LANGS.map((lang) => (
                        <Button
                          key={lang}
                          size="2"
                          variant="soft"
                          color={SEMANTIC_COLOR.primary}
                          asChild
                        >
                          <a
                            href={`/api/share-card/${welperId}?format=${format}&lang=${lang}`}
                            download={`welpco-${slug}-${format}-${lang}.png`}
                            aria-label={t(`cards.downloadLang.${lang}Aria`, {
                              format: t(`cards.formats.${format}`),
                            })}
                          >
                            <Download size={16} aria-hidden="true" />
                            {t(`cards.downloadLang.${lang}`)}
                          </a>
                        </Button>
                      ))}
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Flex>
        </Card>

        {/* 4. Profile views (SHARE-005) */}
        <Card size="3" variant="surface">
          <Flex direction="column" gap="4">
            <Box>
              <Text as="p" size="3" weight="bold" mb="1">
                {t("views.title")}
              </Text>
            </Box>
            {viewsPending ? (
              <Skeleton height="24px" style={{ maxWidth: "280px" }} />
            ) : !viewStats || viewStats.total === 0 ? (
              <Text as="p" size="2" color="gray">
                {t("views.empty")}
              </Text>
            ) : (
              <Flex direction="column" gap="3">
                <Text as="p" size="2">
                  {t("views.last30Days", { count: viewStats.last30DaysTotal })}
                  {" · "}
                  {t("views.total", { count: viewStats.total })}
                </Text>
                {visibleSrcTotals.length > 0 ? (
                  <Flex gap="2" wrap="wrap">
                    {visibleSrcTotals.map((row) => (
                      <Badge
                        key={row.src}
                        size="2"
                        variant="soft"
                        color={SEMANTIC_COLOR.primary}
                      >
                        {srcLabel(row.src)}: {row.count}
                      </Badge>
                    ))}
                  </Flex>
                ) : null}
              </Flex>
            )}
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}
