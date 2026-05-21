"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { verificationHref } from "@/lib/auth/verification-href";
import { resolveAppHref } from "@/lib/i18n/dashboard-navigation";
import { useTranslations, useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Progress } from "@welpco/ui/progress";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { CheckCircle2, Circle, CircleDashed } from "lucide-react";
import type { WelperSetupTaskDto, WelperSetupTaskId } from "@welpco/types";
import { normalizeWelperSetupChecklist } from "@/lib/dashboard/normalize-welper-setup-checklist";
import { useResendVerification } from "@/lib/hooks/use-resend-verification";
import { useBackgroundCheckStatus, useWelperSetupChecklist } from "@/lib/hooks/use-signup";
import type { BackgroundCheckStatusResponse } from "@/lib/services/background-check-service";

const SETUP_TASK_LABEL_KEYS = {
  emailVerification: "taskLabels.emailVerification",
  welperServiceArea: "taskLabels.welperServiceArea",
  welperOffering: "taskLabels.welperOffering",
  welperAvailability: "taskLabels.welperAvailability",
  welperBackgroundCheck: "taskLabels.welperBackgroundCheck",
  welperPayout: "taskLabels.welperPayout",
  optionalProfile: "taskLabels.optionalProfile",
} as const satisfies Record<
  WelperSetupTaskId,
  `taskLabels.${WelperSetupTaskId}`
>;

function setupTaskLabel(
  task: WelperSetupTaskDto,
  t: ReturnType<typeof useTranslations<"dashboard.setup">>,
): string {
  return t(SETUP_TASK_LABEL_KEYS[task.id]);
}

const PROFILE_SETUP_TAB_HREFS: Partial<Record<WelperSetupTaskId, string>> = {
  welperServiceArea: "/dashboard/profile?tab=serviceArea",
  welperOffering: "/dashboard/profile?tab=offerings",
  welperAvailability: "/dashboard/profile?tab=availability",
  welperBackgroundCheck: "/dashboard/profile?tab=backgroundCheck",
  welperPayout: "/dashboard/profile?tab=payout",
  optionalProfile: "/dashboard/profile?tab=profile",
};

function taskActionHref(
  task: WelperSetupTaskDto,
  locale: Locale,
  sessionEmail?: string,
): string {
  if (task.id === "emailVerification" && sessionEmail) {
    return resolveAppHref(verificationHref(sessionEmail, "/dashboard"), locale);
  }
  const profileTab = PROFILE_SETUP_TAB_HREFS[task.id];
  if (profileTab) {
    return profileTab;
  }
  return resolveAppHref(task.href, locale);
}

function isBackgroundCheckLinkSent(bg: BackgroundCheckStatusResponse | undefined): boolean {
  if (!bg || bg.paymentStatus !== "paid") return false;
  return (
    bg.certnInviteSentViaEmail === true ||
    bg.certnInviteReady === true ||
    bg.certnStatus === "invited" ||
    bg.certnStatus === "in_progress"
  );
}

function setupTaskStatusLabel(
  task: WelperSetupTaskDto,
  t: ReturnType<typeof useTranslations<"dashboard.setup">>,
  bg: BackgroundCheckStatusResponse | undefined,
): string {
  if (task.completed) return t("statusDone");
  if (task.id === "welperBackgroundCheck" && isBackgroundCheckLinkSent(bg)) {
    return t("statusLinkSent");
  }
  return t("statusTodo");
}

interface WelperSetupChecklistProps {
  /** Compact layout for dashboard home callout area. */
  variant?: "full" | "compact";
}

export function WelperSetupChecklist({ variant = "full" }: WelperSetupChecklistProps) {
  const t = useTranslations("dashboard.setup");
  const locale = useLocale() as Locale;
  const { data: session } = useSession();
  const sessionRole = session?.user?.role;
  const isWelperSession = sessionRole === "welper";
  const { data: raw, isLoading, isError, refetch } = useWelperSetupChecklist(
    isWelperSession,
  );

  useEffect(() => {
    if (isWelperSession && isError) {
      void refetch();
    }
  }, [isWelperSession, isError, refetch]);
  const { data: backgroundCheck } = useBackgroundCheckStatus();

  const emailVerified = session?.user?.emailVerified === true;
  const data = useMemo(
    () => (raw ? normalizeWelperSetupChecklist(raw, emailVerified) : undefined),
    [raw, emailVerified],
  );

  if (!isWelperSession) {
    return (
      <Text size="2" color="gray">
        {t("loading")}
      </Text>
    );
  }

  if (isLoading) {
    return (
      <Text size="2" color="gray">
        {t("loading")}
      </Text>
    );
  }

  if (isError || !data) {
    return (
      <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
        <Callout.Text>{t("loadError")}</Callout.Text>
      </Callout.Root>
    );
  }

  if (data.setupComplete) {
    if (variant === "compact") return null;
    return (
      <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
        <Callout.Text>
          {data.discoverable ? t("allCompleteDiscoverable") : t("allCompletePendingBg")}
        </Callout.Text>
      </Callout.Root>
    );
  }

  const requiredTasks = data.setupTasks.filter((task: WelperSetupTaskDto) => task.required);
  const completedRequired = requiredTasks.filter((task: WelperSetupTaskDto) => task.completed).length;
  const progressPct = Math.round(
    (completedRequired / Math.max(requiredTasks.length, 1)) * 100,
  );

  if (variant === "compact") {
    const nextTask = data.setupTasks.find(
      (task: WelperSetupTaskDto) => task.required && !task.completed,
    );
    return (
      <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface" role="status">
        <Flex
          align={{ initial: "stretch", sm: "center" }}
          justify="between"
          gap="4"
          wrap="wrap"
          direction={{ initial: "column", sm: "row" }}
        >
          <Callout.Text>
            {t("compactProgress", {
              done: completedRequired,
              total: requiredTasks.length,
            })}
          </Callout.Text>
          {nextTask ? (
            <Button size="2" color={SEMANTIC_COLOR.warning} variant="soft" asChild>
              <Link href={taskActionHref(nextTask, locale, session?.user?.email ?? undefined)}>
                {t("continueSetup")}
              </Link>
            </Button>
          ) : null}
        </Flex>
      </Callout.Root>
    );
  }

  return (
    <Box>
      <Flex direction="column" gap="4">
        <Box>
          <Heading as="h2" size="5" mb="2">
            {t("title")}
          </Heading>
          <Text size="2" color="gray" as="p" mb="3">
            {t("description")}
          </Text>
          <Text size="2" weight="medium" mb="2" as="p">
            {t("progress", { done: completedRequired, total: requiredTasks.length })}
          </Text>
          <Progress
            value={progressPct}
            size="2"
            color={SEMANTIC_COLOR.primary}
            aria-label={t("progressAria", { percent: progressPct })}
          />
        </Box>

        <Flex direction="column" gap="2" asChild>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {data.setupTasks.map((task: WelperSetupTaskDto) => (
              <SetupTaskRow
                key={task.id}
                task={task}
                label={setupTaskLabel(task, t)}
                statusLabel={setupTaskStatusLabel(task, t, backgroundCheck)}
                locale={locale}
                sessionEmail={session?.user?.email ?? undefined}
              />
            ))}
          </ul>
        </Flex>
      </Flex>
    </Box>
  );
}

function SetupTaskRow({
  task,
  label,
  statusLabel,
  locale,
  sessionEmail,
}: {
  task: WelperSetupTaskDto;
  label: string;
  statusLabel: string;
  locale: Locale;
  sessionEmail?: string;
}) {
  const t = useTranslations("dashboard.setup");
  const resend = useResendVerification();
  const [resendNote, setResendNote] = useState<string | null>(null);
  const Icon = task.completed ? CheckCircle2 : task.required ? Circle : CircleDashed;
  const iconColor = task.completed
    ? "var(--green-9)"
    : task.required
      ? "var(--amber-9)"
      : "var(--gray-8)";

  return (
    <li>
      <Flex
        align="center"
        justify="between"
        gap="3"
        py="2"
        style={{
          borderBottom: "1px solid var(--gray-a5)",
        }}
      >
        <Flex align="center" gap="3" style={{ minWidth: 0 }}>
          <Icon size={20} color={iconColor} aria-hidden />
          <Box style={{ minWidth: 0 }}>
            <Text size="2" weight="medium" as="p">
              {label}
              {!task.required ? (
                <Text as="span" size="1" color="gray" ml="2">
                  ({t("optional")})
                </Text>
              ) : null}
            </Text>
            <Text size="1" color="gray" as="p">
              {statusLabel}
            </Text>
            {task.id === "emailVerification" && resendNote ? (
              <Text
                size="1"
                color={resend.isError ? SEMANTIC_COLOR.danger : "gray"}
                as="p"
                mt="1"
              >
                {resendNote}
              </Text>
            ) : null}
          </Box>
        </Flex>
        {!task.completed ? (
          <Flex gap="2" wrap="wrap" justify="end">
            {task.id === "emailVerification" ? (
              <>
                <Button
                  size="1"
                  variant="soft"
                  color={SEMANTIC_COLOR.primary}
                  disabled={resend.isPending}
                  onClick={() => {
                    setResendNote(null);
                    void resend.mutateAsync().then(
                      () => setResendNote(t("resendSent")),
                      (err: unknown) =>
                        setResendNote(
                          err instanceof Error ? err.message : t("resendFailed"),
                        ),
                    );
                  }}
                >
                  {resend.isPending ? t("resendSending") : t("resendVerification")}
                </Button>
                <Button size="1" variant="soft" asChild>
                  <Link href={taskActionHref(task, locale, sessionEmail)}>
                    {t("verifyEmail")}
                  </Link>
                </Button>
              </>
            ) : (
              <Button size="1" variant="soft" asChild>
                <Link href={taskActionHref(task, locale, sessionEmail)}>{t("open")}</Link>
              </Button>
            )}
          </Flex>
        ) : null}
      </Flex>
    </li>
  );
}
