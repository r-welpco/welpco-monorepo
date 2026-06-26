"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Progress } from "@welpco/ui/progress";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { CheckCircle2, Circle, CircleDashed } from "lucide-react";
import type { CustomerSetupTaskDto } from "@welpco/types";
import { normalizeCustomerSetupChecklist } from "@/lib/dashboard/normalize-customer-setup-checklist";
import {
  buildCustomerSetupGroupedView,
  type CustomerSetupSectionView,
  type CustomerSetupTaskWithStep,
} from "@/lib/dashboard/customer-setup-groups";
import {
  CUSTOMER_SETUP_TASK_LABEL_KEYS,
  customerTaskActionHref,
} from "@/lib/dashboard/setup-checklist-navigation";
import { useSyncEmailVerificationSession } from "@/lib/hooks/use-sync-email-verification-session";
import { useCustomerSetupChecklist } from "@/lib/hooks/use-signup";
import { AddPaymentMethodDialog } from "@/components/features/payments/add-payment-method-shared";
import { useAddPaymentMethodDialogLabels } from "@/lib/i18n/use-dashboard-labels";
import {
  EmailVerificationResendButton,
  EmailVerificationResendExtras,
  EmailVerificationResendProvider,
} from "@/components/features/dashboard/email-verification-resend";

function setupTaskLabel(
  task: CustomerSetupTaskDto,
  t: ReturnType<typeof useTranslations<"dashboard.setup">>,
): string {
  if (task.id === "optionalProfile") {
    return t("taskLabels.customerHomeAddress");
  }
  const key = CUSTOMER_SETUP_TASK_LABEL_KEYS[task.id];
  return key ? t(key as "taskLabels.emailVerification") : task.label;
}

interface CustomerSetupChecklistProps {
  variant?: "full" | "compact";
}

export function CustomerSetupChecklist({ variant = "full" }: CustomerSetupChecklistProps) {
  const t = useTranslations("dashboard.setup");
  const locale = useLocale() as Locale;
  const paymentDialogLabels = useAddPaymentMethodDialogLabels();
  const { data: session, status: sessionStatus } = useSession();
  const sessionRole = session?.user?.role;
  const isCustomerSession = sessionRole === "customer";
  const { data: raw, isPending, isError, refetch } = useCustomerSetupChecklist(
    isCustomerSession,
  );
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useSyncEmailVerificationSession(isCustomerSession);

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

  const grouped = useMemo(
    () => (data ? buildCustomerSetupGroupedView(data.setupTasks) : undefined),
    [data],
  );

  if (sessionStatus === "authenticated" && !isCustomerSession) {
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

  if (isError || !data || !grouped) {
    return (
      <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
        <Callout.Text>{t("loadError")}</Callout.Text>
      </Callout.Root>
    );
  }

  if (grouped.allComplete) {
    if (variant === "compact") return null;
    return (
      <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
        <Callout.Text>{t("customerAllComplete")}</Callout.Text>
      </Callout.Root>
    );
  }

  if (variant === "compact") {
    const nextTask =
      firstPendingFromGrouped(grouped) ??
      data.setupTasks.find((task) => !task.completed);
    const { account } = grouped;
    return (
      <Callout.Root
        color={grouped.sectionAComplete ? SEMANTIC_COLOR.primary : SEMANTIC_COLOR.warning}
        variant="surface"
        role="status"
      >
        <Flex
          align={{ initial: "stretch", sm: "center" }}
          justify="between"
          gap="4"
          wrap="wrap"
          direction={{ initial: "column", sm: "row" }}
        >
          <Callout.Text>
            {!grouped.sectionAComplete
              ? t("customerSections.account.compactProgress", {
                  done: account.completedCount,
                  total: account.totalCount,
                })
              : t("customerSections.beyondA.compactProgress")}
          </Callout.Text>
          {nextTask ? (
            nextTask.id === "customerPayment" ? (
              <Button
                size="2"
                color={grouped.sectionAComplete ? SEMANTIC_COLOR.primary : SEMANTIC_COLOR.warning}
                variant="soft"
                onClick={() => setPaymentDialogOpen(true)}
              >
                {!grouped.sectionAComplete ? t("continueSetup") : t("continueRecommended")}
              </Button>
            ) : (
              <Button
                size="2"
                color={grouped.sectionAComplete ? SEMANTIC_COLOR.primary : SEMANTIC_COLOR.warning}
                variant="soft"
                asChild
              >
                <Link href={customerTaskActionHref(nextTask, locale, session?.user?.email ?? undefined)}>
                  {!grouped.sectionAComplete ? t("continueSetup") : t("continueRecommended")}
                </Link>
              </Button>
            )
          ) : null}
        </Flex>
        <AddPaymentMethodDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          title={paymentDialogLabels.title}
          description={paymentDialogLabels.description}
          labels={paymentDialogLabels.actions}
        />
      </Callout.Root>
    );
  }

  const sectionAComplete = grouped.sectionAComplete;

  return (
    <>
      <Flex direction="column" gap="4">
        <CustomerSetupSectionCard
          section={grouped.account}
          title={t("customerSections.account.title")}
          completeMessage={t("customerSections.account.complete")}
          showTasks={!sectionAComplete}
          locale={locale}
          sessionEmail={session?.user?.email ?? undefined}
          onAddPayment={() => setPaymentDialogOpen(true)}
        />

        {grouped.bookingPayment && !grouped.bookingPayment.complete ? (
          <CustomerSetupSectionCard
            section={grouped.bookingPayment}
            title={t("customerSections.bookingPayment.title")}
            subtitle={t("customerSections.bookingPayment.subtitle")}
            completeMessage={t("customerSections.bookingPayment.complete")}
            showTasks
            locale={locale}
            sessionEmail={session?.user?.email ?? undefined}
            onAddPayment={() => setPaymentDialogOpen(true)}
          />
        ) : null}
      </Flex>
      <AddPaymentMethodDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        title={paymentDialogLabels.title}
        description={paymentDialogLabels.description}
        labels={paymentDialogLabels.actions}
      />
    </>
  );
}

function firstPendingFromGrouped(
  grouped: ReturnType<typeof buildCustomerSetupGroupedView>,
): CustomerSetupTaskDto | undefined {
  if (!grouped.sectionAComplete) {
    return grouped.account.tasks.find((t) => !t.completed);
  }
  return grouped.bookingPayment?.tasks.find((t) => !t.completed);
}

function CustomerSetupSectionCard({
  section,
  title,
  subtitle,
  completeMessage,
  showTasks,
  locale,
  sessionEmail,
  onAddPayment,
}: {
  section: CustomerSetupSectionView;
  title: string;
  subtitle?: string;
  completeMessage?: string;
  showTasks: boolean;
  locale: Locale;
  sessionEmail?: string;
  onAddPayment: () => void;
}) {
  const t = useTranslations("dashboard.setup");
  const showProgress = section.id === "account";
  const progressPct = Math.round(
    (section.completedCount / Math.max(section.totalCount, 1)) * 100,
  );

  return (
    <Card size="3" variant="surface">
      <Flex direction="column" gap="3">
        <Box style={{ minWidth: 0 }}>
          <Text size="3" weight="bold" as="p" mb={subtitle && !section.complete ? "1" : "0"}>
            {title}
          </Text>
          {subtitle && !section.complete ? (
            <Text size="2" color="gray" as="p">
              {subtitle}
            </Text>
          ) : null}
        </Box>

        {section.complete && completeMessage ? (
          <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
            <Callout.Text>{completeMessage}</Callout.Text>
          </Callout.Root>
        ) : null}

        {showTasks && !section.complete ? (
          <>
            {showProgress ? (
              <Box>
                <Text size="2" weight="medium" mb="2" as="p">
                  {t("progress", {
                    done: section.completedCount,
                    total: section.totalCount,
                  })}
                </Text>
                <Progress
                  value={progressPct}
                  size="2"
                  color={SEMANTIC_COLOR.primary}
                  aria-label={t("progressAria", { percent: progressPct })}
                />
              </Box>
            ) : null}
            <Flex direction="column" gap="2" asChild>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {section.tasks
                  .filter((task) => !task.completed)
                  .map((task) => (
                    <SetupTaskRow
                      key={task.id}
                      task={task}
                      stepNumber={task.stepNumber}
                      label={setupTaskLabel(task, t)}
                      statusLabel={task.completed ? t("statusDone") : t("statusTodo")}
                      locale={locale}
                      sessionEmail={sessionEmail}
                      showDivider={showProgress}
                      showStepNumber={showProgress}
                      showTaskLabel={showProgress}
                      onAddPayment={onAddPayment}
                    />
                  ))}
              </ul>
            </Flex>
          </>
        ) : null}
      </Flex>
    </Card>
  );
}

function SetupTaskRow({
  task,
  stepNumber,
  label,
  statusLabel,
  locale,
  sessionEmail,
  showDivider = true,
  showStepNumber = true,
  showTaskLabel = true,
  onAddPayment,
}: {
  task: CustomerSetupTaskWithStep;
  stepNumber: number;
  label: string;
  statusLabel: string;
  locale: Locale;
  sessionEmail?: string;
  showDivider?: boolean;
  showStepNumber?: boolean;
  showTaskLabel?: boolean;
  onAddPayment: () => void;
}) {
  const t = useTranslations("dashboard.setup");
  const Icon = task.completed ? CheckCircle2 : task.required ? Circle : CircleDashed;
  const iconColor = task.completed
    ? "var(--green-9)"
    : task.required
      ? "var(--amber-9)"
      : "var(--gray-9)";

  if (task.id === "emailVerification" && !task.completed) {
    return (
      <li>
        <EmailVerificationResendProvider>
          <Flex
            direction="column"
            gap="2"
            py="2"
            style={showDivider ? { borderBottom: "1px solid var(--gray-a5)" } : undefined}
          >
            <Flex align="center" justify="between" gap="3">
              <Flex align="center" gap="3" style={{ minWidth: 0 }}>
                <Icon size={20} color={iconColor} aria-hidden />
                <Box style={{ minWidth: 0 }}>
                  {showTaskLabel ? (
                    <Text size="2" weight="medium" as="p">
                      {showStepNumber ? `${stepNumber}. ${label}` : label}
                    </Text>
                  ) : null}
                  <Text size="1" color="gray" as="p">
                    {statusLabel}
                  </Text>
                </Box>
              </Flex>
            </Flex>
            <EmailVerificationResendExtras />
            <Flex justify="end">
              <EmailVerificationResendButton />
            </Flex>
          </Flex>
        </EmailVerificationResendProvider>
      </li>
    );
  }

  return (
    <li>
      <Flex
        align="center"
        justify="between"
        gap="3"
        py="2"
        style={showDivider ? { borderBottom: "1px solid var(--gray-a5)" } : undefined}
      >
        <Flex align="center" gap="3" style={{ minWidth: 0 }}>
          <Icon size={20} color={iconColor} aria-hidden />
          <Box style={{ minWidth: 0 }}>
            {showTaskLabel ? (
              <Text size="2" weight="medium" as="p">
                {showStepNumber ? `${stepNumber}. ${label}` : label}
              </Text>
            ) : null}
            <Text size="1" color="gray" as="p">
              {statusLabel}
            </Text>
          </Box>
        </Flex>
        {!task.completed ? (
          <Flex gap="2" wrap="wrap" justify="end">
            {task.id === "customerPayment" ? (
              <Button
                size="1"
                variant="soft"
                color={SEMANTIC_COLOR.primary}
                onClick={onAddPayment}
              >
                {t("addCard")}
              </Button>
            ) : (
              <Button size="1" variant="soft" asChild>
                <Link href={customerTaskActionHref(task, locale, sessionEmail)}>{t("open")}</Link>
              </Button>
            )}
          </Flex>
        ) : null}
      </Flex>
    </li>
  );
}
