import { Suspense } from "react";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import SearchRedirectClient from "./search-redirect-client";

export default function SearchRedirectPage() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <SearchRedirectClient />
    </Suspense>
  );
}
