import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import PublicSearchPageClient from "./search-page-client";

/**
 * Public welper search (adoption report item 10). Previously this route
 * redirected into the authed dashboard, so strangers could never see
 * inventory. It now renders a real public search page backed by the
 * unauthenticated BFF search endpoints.
 */
export const metadata: Metadata = {
  title: "Find local Welpers near you | Welpco",
  description:
    "Browse welpers offering services near you — no account needed. Search by postal code and category.",
};

export default function PublicSearchPage() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <PublicSearchPageClient />
    </Suspense>
  );
}
