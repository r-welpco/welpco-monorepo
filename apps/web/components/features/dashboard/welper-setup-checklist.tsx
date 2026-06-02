"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Flex } from "@welpco/ui/flex";
import { Progress } from "@welpco/ui/progress";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { CheckCircle2, Circle, CircleDashed } from "lucide-react";
import type { WelperSetupTaskDto } from "@welpco/types";
import { normalizeWelperSetupChecklist } from "@/lib/dashboard/normalize-welper-setup-checklist";
import {
  WELPER_SETUP_TASK_LABEL_KEYS,
  welperTaskActionHref,
} from "@/lib/dashboard/setup-checklist-navigation";
import { useResendVerification } from "@/lib/hooks/use-resend-verification";
import { useBackgroundCheckStatus, useWelperSetupChecklist } from "@/lib/hooks/use-signup";
import type { BackgroundCheckStatusResponse } from "@/lib/services/background-check-service";

function setupTaskLabel(
  task: WelperSetupTaskDto,
  t: ReturnType<typeof useTranslations<"dashboard.setup">>,
): string {
  return t(WELPER_SETUP_TASK_LABEL_KEYS[task.id]);
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
  const { data: session, status: sessionStatus } = useSession();
  const sessionRole = session?.user?.role;
  const isWelperSession = sessionRole === "welper";
  const { data: raw, isPending, isError, refetch } = useWelperSetupChecklist(
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

  if (sessionStatus === "authenticated" && !isWelperSession) {
    return (
      <Text size="2" color="gray">
        {t("loading")}
      </Text>
    );
  }

  if (isPending && !raw) {
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
              <Link href={welperTaskActionHref(nextTask, locale, session?.user?.email ?? undefined)}>
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
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
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
                {turnstileEnabled && sessionEmail ? (
                  <Button size="1" variant="soft" color={SEMANTIC_COLOR.primary} asChild>
                    <Link href={welperTaskActionHref(task, locale, sessionEmail)}>
                      {t("resendVerification")}
                    </Link>
                  </Button>
                ) : (
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
                )}
                <Button size="1" variant="soft" asChild>
                  <Link href={welperTaskActionHref(task, locale, sessionEmail)}>
                    {t("verifyEmail")}
                  </Link>
                </Button>
              </>
            ) : (
              <Button size="1" variant="soft" asChild>
                <Link href={welperTaskActionHref(task, locale, sessionEmail)}>{t("open")}</Link>
              </Button>
            )}
          </Flex>
        ) : null}
      </Flex>
    </li>
  );
}
