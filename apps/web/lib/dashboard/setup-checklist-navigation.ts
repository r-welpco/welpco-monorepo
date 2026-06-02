import { verificationHref } from "@/lib/auth/verification-href";
import { resolveAppHref } from "@/lib/i18n/dashboard-navigation";
import type { Locale } from "@/i18n/routing";
import type {
  CustomerSetupTaskDto,
  CustomerSetupTaskId,
  WelperSetupTaskDto,
  WelperSetupTaskId,
} from "@welpco/types";

export const CUSTOMER_SETUP_TASK_LABEL_KEYS = {
  emailVerification: "taskLabels.emailVerification",
  optionalProfile: "taskLabels.customerHomeAddress",
  customerPayment: "taskLabels.customerPayment",
} as const satisfies Partial<Record<CustomerSetupTaskId, string>>;

export const WELPER_SETUP_TASK_LABEL_KEYS = {
  emailVerification: "taskLabels.emailVerification",
  welperServiceArea: "taskLabels.welperServiceArea",
  welperOffering: "taskLabels.welperOffering",
  welperAvailability: "taskLabels.welperAvailability",
  welperBackgroundCheck: "taskLabels.welperBackgroundCheck",
  welperPayout: "taskLabels.welperPayout",
  optionalProfile: "taskLabels.optionalProfile",
} as const satisfies Record<WelperSetupTaskId, `taskLabels.${WelperSetupTaskId}`>;

const CUSTOMER_TASK_HREFS: Partial<Record<CustomerSetupTaskId, string>> = {
  optionalProfile: "/dashboard/profile?tab=profile",
  customerPayment: "/dashboard/settings?tab=payment",
};

const WELPER_PROFILE_SETUP_TAB_HREFS: Partial<Record<WelperSetupTaskId, string>> = {
  welperServiceArea: "/dashboard/profile?tab=serviceArea",
  welperOffering: "/dashboard/profile?tab=offerings",
  welperAvailability: "/dashboard/profile?tab=availability",
  welperBackgroundCheck: "/dashboard/profile?tab=backgroundCheck",
  welperPayout: "/dashboard/profile?tab=payout",
  optionalProfile: "/dashboard/profile?tab=profile",
};

export function customerTaskActionHref(
  task: CustomerSetupTaskDto,
  locale: Locale,
  sessionEmail?: string,
): string {
  if (task.id === "emailVerification" && sessionEmail) {
    return resolveAppHref(verificationHref(sessionEmail, "/dashboard"), locale);
  }
  const href = CUSTOMER_TASK_HREFS[task.id];
  if (href) return href;
  return resolveAppHref(task.href, locale);
}

export function welperTaskActionHref(
  task: WelperSetupTaskDto,
  locale: Locale,
  sessionEmail?: string,
): string {
  if (task.id === "emailVerification" && sessionEmail) {
    return resolveAppHref(verificationHref(sessionEmail, "/dashboard"), locale);
  }
  const profileTab = WELPER_PROFILE_SETUP_TAB_HREFS[task.id];
  if (profileTab) return profileTab;
  return resolveAppHref(task.href, locale);
}
