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
  welperGuardian: "taskLabels.welperGuardian",
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
  welperGuardian: "/dashboard/profile?tab=guardian",
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

/** True when the user is on the dashboard home (setup checklist lives here). */
export function isDashboardHomePath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return normalized === "/dashboard";
}

/**
 * True when the current route matches a setup task destination (path + relevant query).
 */
export function isSetupTaskDestination(
  pathname: string,
  searchParams: URLSearchParams,
  destinationHref: string,
): boolean {
  const [destPath, destQuery = ""] = destinationHref.split("?");
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  const normalizedDest = destPath.replace(/\/$/, "") || "/";
  if (normalizedPath !== normalizedDest) return false;
  if (!destQuery) return true;
  const target = new URLSearchParams(destQuery);
  for (const [key, value] of target.entries()) {
    if (searchParams.get(key) !== value) return false;
  }
  return true;
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
