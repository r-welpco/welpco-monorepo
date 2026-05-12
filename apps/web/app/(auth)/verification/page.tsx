import { Suspense } from "react";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import VerificationPageClient from "./verification-page-client";

export default function VerificationPage() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <VerificationPageClient />
    </Suspense>
  );
}
