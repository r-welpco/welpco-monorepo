"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import type { CustomerSetupTaskDto, WelperSetupTaskDto } from "@welpco/types";
import { normalizeCustomerSetupChecklist } from "@/lib/dashboard/normalize-customer-setup-checklist";
import { normalizeWelperSetupChecklist } from "@/lib/dashboard/normalize-welper-setup-checklist";
import {
  buildCustomerSetupGroupedView,
  firstPendingSectionATask,
} from "@/lib/dashboard/customer-setup-groups";
import { buildWelperSetupGroupedView, firstPendingSectionATask as firstPendingWelperSectionATask } from "@/lib/dashboard/welper-setup-groups";
import {
  useCustomerSetupChecklist,
  useWelperSetupChecklist,
} from "@/lib/hooks/use-signup";

export interface SetupReadinessState {
  isLoading: boolean;
  /** True when required setup steps are incomplete (not ready for booking). */
  requiredIncomplete: boolean;
  completedRequired: number;
  totalRequired: number;
  nextTask: CustomerSetupTaskDto | WelperSetupTaskDto | undefined;
}

export function useSetupReadiness(role: "customer" | "welper"): SetupReadinessState {
  const { data: session } = useSession();
  const isCustomer = role === "customer";
  const { data: rawCustomer, isPending: customerPending } = useCustomerSetupChecklist(isCustomer);
  const { data: rawWelper, isPending: welperPending } = useWelperSetupChecklist(!isCustomer);

  const emailVerified = session?.user?.emailVerified === true;

  return useMemo(() => {
    const isLoading = isCustomer ? customerPending && !rawCustomer : welperPending && !rawWelper;

    if (isCustomer) {
      if (!rawCustomer) {
        return {
          isLoading,
          requiredIncomplete: false,
          completedRequired: 0,
          totalRequired: 0,
          nextTask: undefined,
        };
      }
      const data = normalizeCustomerSetupChecklist(rawCustomer, emailVerified);
      const grouped = buildCustomerSetupGroupedView(data.setupTasks);
      const pendingAccount = grouped.account.tasks.filter((task) => !task.completed);
      return {
        isLoading,
        requiredIncomplete: !grouped.sectionAComplete,
        completedRequired: grouped.account.completedCount,
        totalRequired: grouped.account.totalCount,
        nextTask: firstPendingSectionATask(data.setupTasks) ?? pendingAccount[0],
      };
    }

    if (!rawWelper) {
      return {
        isLoading,
        requiredIncomplete: false,
        completedRequired: 0,
        totalRequired: 0,
        nextTask: undefined,
      };
    }

    const data = normalizeWelperSetupChecklist(rawWelper, emailVerified);
    const grouped = buildWelperSetupGroupedView(data.setupTasks);

    return {
      isLoading,
      requiredIncomplete: !grouped.sectionAComplete,
      completedRequired: grouped.goLive.completedCount,
      totalRequired: grouped.goLive.totalCount,
      nextTask: firstPendingWelperSectionATask(data.setupTasks),
    };
  }, [
    isCustomer,
    rawCustomer,
    rawWelper,
    customerPending,
    welperPending,
    emailVerified,
  ]);
}
