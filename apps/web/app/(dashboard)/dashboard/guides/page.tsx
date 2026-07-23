"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Box } from "@welpco/ui/box";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { SegmentedControl } from "@welpco/ui/segmented-control";
import { Text } from "@welpco/ui/text";
import { getGuideDocument } from "@/lib/guides/get-guide-document";
import type { GuideKind } from "@/lib/guides/types";
import type { Locale } from "@/i18n/routing";
import { useAuthStore } from "@/stores/authStore";
import { GuideReader } from "./guide-reader";

function isLocale(value: string): value is Locale {
  return value === "en" || value === "fr";
}

function isGuideKind(value: string): value is GuideKind {
  return value === "customer" || value === "welper";
}

export default function GuidesPage() {
  const t = useTranslations("dashboard.guides");
  const rawLocale = useLocale();
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";

  const { user } = useAuthStore();
  // Role-aware default: welpers land on the Welper guide, everyone else on the
  // Customer guide. Both guides stay readable by either role (public content),
  // so the segmented control simply overrides the default once touched.
  const defaultKind: GuideKind = user?.role === "welper" ? "welper" : "customer";
  const [selectedKind, setSelectedKind] = useState<GuideKind | null>(null);
  const activeKind = selectedKind ?? defaultKind;

  const guide = useMemo(
    () => getGuideDocument(activeKind, locale),
    [activeKind, locale],
  );

  return (
    <Container size="4" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="6" width="100%" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="7" mb="2" trim="start">
            {t("title")}
          </Heading>
          <Text as="p" size="2" color="gray" highContrast>
            {t("subtitle")}
          </Text>
        </Box>

        <Box>
          <SegmentedControl.Root
            value={activeKind}
            onValueChange={(value) => {
              if (isGuideKind(value)) setSelectedKind(value);
            }}
            size="2"
            aria-label={t("audienceAria")}
          >
            <SegmentedControl.Item value="customer">
              {t("audience.customer")}
            </SegmentedControl.Item>
            <SegmentedControl.Item value="welper">
              {t("audience.welper")}
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        </Box>

        <GuideReader
          key={`${activeKind}-${locale}`}
          document={guide}
          labels={{
            onThisPage: t("onThisPage"),
            contents: t("contents"),
            backToTop: t("backToTop"),
          }}
        />
      </Flex>
    </Container>
  );
}
