import { Suspense } from "react";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import ResetPasswordPageClient from "./reset-password-page-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <ResetPasswordPageClient />
    </Suspense>
  );
}
