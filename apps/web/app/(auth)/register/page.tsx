import { Suspense } from "react";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import RegisterPageClient from "./register-page-client";

/**
 * Day 15 — Phase 2 Dispatch A. Entry point for the unified signup wizard.
 *
 * The actual routing logic lives in `RegisterPageClient`:
 *   - unauthenticated → render the begin step (`<EmailPasswordStep>`)
 *   - authenticated + signupCompleted false → redirect to `/register/step/<nextStep>`
 *   - authenticated + signupCompleted true → redirect to `?next=…` or `/dashboard`
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <RegisterPageClient />
    </Suspense>
  );
}
