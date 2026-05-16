import { Suspense } from "react";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import FinishPageClient from "./finish-page-client";

/**
 * Day 15 — Phase 2 Dispatch A. Wizard finalize step.
 *
 * Calls `POST /auth/signup/finish` once on mount. On success, redirects to
 * `?next=…` (if present) or `/dashboard`. On 422 (`INCOMPLETE_SIGNUP`),
 * shows the missing-fields list with a "Continue setup" affordance back into
 * the wizard.
 */
export default function FinishPage() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <FinishPageClient />
    </Suspense>
  );
}
