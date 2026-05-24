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
import { Progress } from "@welpco/ui/progress";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { CheckCircle2, Circle } from "lucide-react";
import type { CustomerSetupTaskDto, CustomerSetupTaskId } from "@welpco/types";
import { normalizeCustomerSetupChecklist } from "@/lib/dashboard/normalize-customer-setup-checklist";
import { useResendVerification } from "@/lib/hooks/use-resend-verification";
import { useCustomerSetupChecklist } from "@/lib/hooks/use-signup";

const SETUP_TASK_LABEL_KEYS = {
  emailVerification: "taskLabels.emailVerification",
  optionalProfile: "taskLabels.customerHomeAddress",
  customerPayment: "taskLabels.customerPayment",
} as const;

const TASK_HREFS: Partial<Record<CustomerSetupTaskId, string>> = {
  optionalProfile: "/dashboard/profile?tab=profile",
  customerPayment: "/dashboard/settings?tab=payment",
};

function setupTaskLabel(
  task: CustomerSetupTaskDto,
  t: ReturnType<typeof useTranslations<"dashboard.setup">>,
): string {
  if (task.id === "optionalProfile") {
    return t("taskLabels.customerHomeAddress");
  }
  return t(SETUP_TASK_LABEL_KEYS[task.id]);
}

function taskActionHref(
  task: CustomerSetupTaskDto,
  locale: Locale,
  sessionEmail?: string,
): string {
  if (task.id === "emailVerification" && sessionEmail) {
    return resolveAppHref(verificationHref(sessionEmail, "/dashboard"), locale);
  }
  const href = TASK_HREFS[task.id];
  if (href) return href;
  return resolveAppHref(task.href, locale);
}

interface CustomerSetupChecklistProps {
  variant?: "full" | "compact";
}

export function CustomerSetupChecklist({ variant = "full" }: CustomerSetupChecklistProps) {
  const t = useTranslations("dashboard.setup");
  const locale = useLocale() as Locale;
  const { data: session } = useSession();
  const sessionRole = session?.user?.role;
  const isCustomerSession = sessionRole === "customer";
  const { data: raw, isLoading, isError, refetch } = useCustomerSetupChecklist(
    isCustomerSession,
  );

  useEffect(() => {
    if (isCustomerSession && isError) {
      void refetch();
    }
  }, [isCustomerSession, isError, refetch]);

  const emailVerified = session?.user?.emailVerified === true;
  const data = useMemo(
    () => (raw ? normalizeCustomerSetupChecklist(raw, emailVerified) : undefined),
    [raw, emailVerified],
  );

  if (!isCustomerSession) {
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
        <Callout.Text>{t("customerAllComplete")}</Callout.Text>
      </Callout.Root>
    );
  }

  const requiredTasks = data.setupTasks.filter((task) => task.required);
  const completedRequired = requiredTasks.filter((task) => task.completed).length;
  const progressPct = Math.round(
    (completedRequired / Math.max(requiredTasks.length, 1)) * 100,
  );

  if (variant === "compact") {
    const nextTask = data.setupTasks.find((task) => task.required && !task.completed);
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
          <Text size="2" weight="medium" mb="2" as="p">
            {t("customerProgressTitle")}
          </Text>
          <Text size="2" color="gray" mb="2" as="p">
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
            {data.setupTasks.map((task) => (
              <SetupTaskRow
                key={task.id}
                task={task}
                label={setupTaskLabel(task, t)}
                statusLabel={task.completed ? t("statusDone") : t("statusTodo")}
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
  task: CustomerSetupTaskDto;
  label: string;
  statusLabel: string;
  locale: Locale;
  sessionEmail?: string;
}) {
  const t = useTranslations("dashboard.setup");
  const resend = useResendVerification();
  const [resendNote, setResendNote] = useState<string | null>(null);
  const Icon = task.completed ? CheckCircle2 : Circle;
  const iconColor = task.completed ? "var(--green-9)" : "var(--amber-9)";

  return (
    <li>
      <Flex
        align="center"
        justify="between"
        gap="3"
        py="2"
        style={{ borderBottom: "1px solid var(--gray-a5)" }}
      >
        <Flex align="center" gap="3" style={{ minWidth: 0 }}>
          <Icon size={20} color={iconColor} aria-hidden />
          <Box style={{ minWidth: 0 }}>
            <Text size="2" weight="medium" as="p">
              {label}
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
