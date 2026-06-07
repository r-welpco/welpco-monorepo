import { Suspense } from "react";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import GuardianReviewPageClient from "./guardian-review-page-client";

export default function GuardianReviewPage() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <GuardianReviewPageClient />
    </Suspense>
  );
}
