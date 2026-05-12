import { Suspense } from "react";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import LoginPageClient from "./login-page-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <LoginPageClient />
    </Suspense>
  );
}
