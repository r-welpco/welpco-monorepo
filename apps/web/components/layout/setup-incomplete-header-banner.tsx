"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import type { CustomerSetupTaskDto, WelperSetupTaskDto } from "@welpco/types";
import { AlertCircle } from "lucide-react";
import { useSetupReadiness } from "@/lib/dashboard/use-setup-readiness";
import {
  customerTaskActionHref,
  isDashboardHomePath,
  isSetupTaskDestination,
  welperTaskActionHref,
} from "@/lib/dashboard/setup-checklist-navigation";

export interface SetupIncompleteHeaderBannerProps {
  role: "customer" | "welper";
}

export function SetupIncompleteHeaderBanner({ role }: SetupIncompleteHeaderBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale() as Locale;
  const { data: session } = useSession();
  const t = useTranslations("dashboard.setup.headerBanner");
  const { isLoading, requiredIncomplete, completedRequired, totalRequired, nextTask } =
    useSetupReadiness(role);

  if (isLoading || !requiredIncomplete || !nextTask) {
    return null;
  }

  const sessionEmail = session?.user?.email ?? undefined;
  const nextStepHref =
    role === "customer"
      ? customerTaskActionHref(nextTask as CustomerSetupTaskDto, locale, sessionEmail)
      : welperTaskActionHref(nextTask as WelperSetupTaskDto, locale, sessionEmail);

  const onDashboardHome = isDashboardHomePath(pathname);
  const onNextStepPage = isSetupTaskDestination(pathname, searchParams, nextStepHref);
  const showViewChecklist = !onDashboardHome && !onNextStepPage;

  const message = role === "customer" ? t("customer") : t("welper");

  return (
    <Box
      px={{ initial: "4", sm: "6" }}
      py="2"
      style={{
        backgroundColor: "var(--amber-2)",
        borderBottom: "1px solid var(--amber-6)",
      }}
      role="status"
    >
      <Flex
        align={{ initial: "stretch", sm: "center" }}
        justify="between"
        gap="3"
        direction={{ initial: "column", sm: "row" }}
      >
        <Flex align="start" gap="2" style={{ minWidth: 0, flex: 1 }}>
          <Box pt="1" style={{ flexShrink: 0 }} aria-hidden>
            <AlertCircle size={16} color="var(--amber-11)" />
          </Box>
          <Box style={{ minWidth: 0 }}>
            <Text size="2" weight="medium" as="p">
              {message}
            </Text>
            <Text size="1" color="gray" highContrast as="p" mt="1">
              {t("progress", { done: completedRequired, total: totalRequired })}
            </Text>
          </Box>
        </Flex>
        {showViewChecklist ? (
          <Box width={{ initial: "100%", sm: "auto" }} style={{ flexShrink: 0 }}>
            <Button
              size="2"
              variant="soft"
              color={SEMANTIC_COLOR.warning}
              highContrast
              style={{ width: "100%" }}
              onClick={() => router.push("/dashboard")}
            >
              {t("viewChecklist")}
            </Button>
          </Box>
        ) : null}
      </Flex>
    </Box>
  );
}
