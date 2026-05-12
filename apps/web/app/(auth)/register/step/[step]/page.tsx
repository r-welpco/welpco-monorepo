import { Suspense } from "react";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import StepPageClient from "./step-page-client";

/**
 * Day 15 — Phase 2 Dispatch A. Dynamic step route for the wizard.
 *
 * Renders the right step component for the URL slug. Validates that the URL
 * slug matches the server-computed `nextStep` — if it doesn't, redirects to
 * prevent the user from skipping ahead. The actual rendering + submit logic
 * lives in `StepPageClient`.
 */
export default async function StepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <StepPageClient slug={step} />
    </Suspense>
  );
}
