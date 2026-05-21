"use client";

import { useMemo } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { useRouter as useIntlRouter } from "@/i18n/navigation";
import { isDashboardPath } from "@/lib/i18n/dashboard-navigation";

type NavigateOptions = Parameters<ReturnType<typeof useIntlRouter>["push"]>[1];

function shouldUseNextRouterForHref(href: string): boolean {
  const path = href.split("?")[0]?.split("#")[0] ?? href;
  return isDashboardPath(path);
}

/** Locale-aware router: next-intl for marketing/auth; plain Next router for `/dashboard/*`. */
export function useAppRouter() {
  const nextRouter = useNextRouter();
  const intlRouter = useIntlRouter();

  return useMemo(
    () => ({
      push(href: string, options?: NavigateOptions) {
        if (shouldUseNextRouterForHref(href)) {
          nextRouter.push(href, options);
        } else {
          intlRouter.push(href, options);
        }
      },
      replace(href: string, options?: NavigateOptions) {
        if (shouldUseNextRouterForHref(href)) {
          nextRouter.replace(href, options);
        } else {
          intlRouter.replace(href, options);
        }
      },
      back() {
        intlRouter.back();
      },
      refresh() {
        nextRouter.refresh();
      },
      forward: nextRouter.forward,
      prefetch: nextRouter.prefetch,
    }),
    [nextRouter, intlRouter],
  );
}
