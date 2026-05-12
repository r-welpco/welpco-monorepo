import { Suspense } from "react";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import RegisterLayoutClient from "./register-layout-client";

/**
 * Day 15 — Phase 2 Dispatch A. Wizard chrome for the unified signup flow.
 *
 * Wraps every `/register/**` route in:
 *   - `<AuthBackground>` (canonical auth backdrop)
 *   - A progress indicator that reads `useSignupState()` for the live
 *     "Step N of M" position
 *   - A "Save and continue later" affordance (sign-out link)
 *
 * The layout intentionally does NOT render its own `<h1>` — each step's
 * component owns its heading so the wizard's accessible structure follows
 * one h1-per-screen.
 */
export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <RegisterLayoutClient>{children}</RegisterLayoutClient>
    </Suspense>
  );
}
