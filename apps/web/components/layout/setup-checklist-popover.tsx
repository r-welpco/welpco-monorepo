"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Popover, PopoverTrigger, PopoverContent } from "@welpco/ui/popover";
import { Badge } from "@welpco/ui/badge";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Progress } from "@welpco/ui/progress";
import { Button } from "@welpco/ui/button";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { ListChecks, ChevronRight } from "lucide-react";
import type { CustomerSetupTaskDto, WelperSetupTaskDto } from "@welpco/types";
import { normalizeCustomerSetupChecklist } from "@/lib/dashboard/normalize-customer-setup-checklist";
import { normalizeWelperSetupChecklist } from "@/lib/dashboard/normalize-welper-setup-checklist";
import {
  CUSTOMER_SETUP_TASK_LABEL_KEYS,
  WELPER_SETUP_TASK_LABEL_KEYS,
  customerTaskActionHref,
  welperTaskActionHref,
} from "@/lib/dashboard/setup-checklist-navigation";
import {
  useCustomerSetupChecklist,
  useWelperSetupChecklist,
} from "@/lib/hooks/use-signup";
import {
  DashboardHeaderIconTrigger,
  DASHBOARD_HEADER_GLYPH_SIZE,
} from "@/components/layout/dashboard-header-icon-trigger";

export interface SetupChecklistPopoverProps {
  role: "customer" | "welper";
  badgeColor?: "blue" | "green";
}

type SetupTask = CustomerSetupTaskDto | WelperSetupTaskDto;

function taskLabel(
  task: SetupTask,
  role: "customer" | "welper",
  t: ReturnType<typeof useTranslations<"dashboard.setup">>,
): string {
  if (role === "customer") {
    const key = CUSTOMER_SETUP_TASK_LABEL_KEYS[task.id as CustomerSetupTaskDto["id"]];
    return key ? t(key as "taskLabels.emailVerification") : task.label;
  }
  const key = WELPER_SETUP_TASK_LABEL_KEYS[task.id as WelperSetupTaskDto["id"]];
  return key ? t(key) : task.label;
}

function taskHref(
  task: SetupTask,
  role: "customer" | "welper",
  locale: Locale,
  sessionEmail?: string,
): string {
  if (role === "customer") {
    return customerTaskActionHref(task as CustomerSetupTaskDto, locale, sessionEmail);
  }
  return welperTaskActionHref(task as WelperSetupTaskDto, locale, sessionEmail);
}

export function SetupChecklistPopover({
  role,
  badgeColor = "blue",
}: SetupChecklistPopoverProps) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const { data: session } = useSession();
  const t = useTranslations("dashboard.setup");
  const [open, setOpen] = useState(false);

  const isCustomer = role === "customer";
  const {
    data: rawCustomer,
    isPending: customerPending,
  } = useCustomerSetupChecklist(isCustomer);
  const {
    data: rawWelper,
    isPending: welperPending,
  } = useWelperSetupChecklist(!isCustomer);

  const emailVerified = session?.user?.emailVerified === true;
  const isInitialLoad = isCustomer ? customerPending : welperPending;

  const customerData = useMemo(() => {
    if (!isCustomer || !rawCustomer) return undefined;
    return normalizeCustomerSetupChecklist(rawCustomer, emailVerified);
  }, [isCustomer, rawCustomer, emailVerified]);

  const welperData = useMemo(() => {
    if (isCustomer || !rawWelper) return undefined;
    return normalizeWelperSetupChecklist(rawWelper, emailVerified);
  }, [isCustomer, rawWelper, emailVerified]);

  const data = isCustomer ? customerData : welperData;

  const requiredTasks = useMemo(
    () => data?.setupTasks.filter((task) => task.required) ?? [],
    [data],
  );
  const pendingTasks = useMemo(
    () => requiredTasks.filter((task) => !task.completed),
    [requiredTasks],
  );
  const completedRequired = requiredTasks.length - pendingTasks.length;
  const remainingCount = pendingTasks.length;
  const progressPct = Math.round(
    (completedRequired / Math.max(requiredTasks.length, 1)) * 100,
  );

  if (isInitialLoad || !data || data.setupComplete || remainingCount === 0) {
    return null;
  }

  const sessionEmail = session?.user?.email ?? undefined;

  return (
    <Box style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <DashboardHeaderIconTrigger aria-label={t("header.aria", { count: remainingCount })}>
            <ListChecks size={DASHBOARD_HEADER_GLYPH_SIZE} />
          </DashboardHeaderIconTrigger>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          collisionPadding={12}
          style={{
            padding: 16,
            width: "min(360px, calc(100vw - 24px))",
          }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Flex direction="column" gap="3">
            <Box>
              <Text size="3" weight="bold" as="p" mb="1">
                {t("header.title")}
              </Text>
              <Text size="2" color="gray" as="p">
                {t("header.subtitle", {
                  done: completedRequired,
                  total: requiredTasks.length,
                })}
              </Text>
            </Box>
            <Progress
              value={progressPct}
              size="1"
              color={SEMANTIC_COLOR.primary}
              aria-label={t("progressAria", { percent: progressPct })}
            />
            <Flex direction="column" gap="1" asChild>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {pendingTasks.map((task) => (
                  <li key={task.id}>
                    <Button
                      variant="ghost"
                      color="gray"
                      highContrast
                      style={{
                        width: "100%",
                        justifyContent: "space-between",
                        height: "auto",
                        padding: "10px 8px",
                      }}
                      onClick={() => {
                        setOpen(false);
                        router.push(taskHref(task, role, locale, sessionEmail));
                      }}
                    >
                      <Text size="2" weight="medium" align="left">
                        {taskLabel(task, role, t)}
                      </Text>
                      <ChevronRight size={16} aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            </Flex>
          </Flex>
        </PopoverContent>
      </Popover>
      <Badge
        color={badgeColor}
        variant="solid"
        size="1"
        style={{
          position: "absolute",
          top: -4,
          right: -4,
          minWidth: 16,
          height: 16,
          padding: 0,
          fontSize: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-2)",
          pointerEvents: "none",
        }}
      >
        {remainingCount > 9 ? "9+" : remainingCount}
      </Badge>
    </Box>
  );
}
