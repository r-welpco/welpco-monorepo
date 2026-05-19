import { Suspense } from "react";
import { AuthSearchParamsFallback } from "@/components/layout/auth-search-params-fallback";
import SearchRedirectClient from "../../search/search-redirect-client";

/**
 * Locale-prefixed search entry (e.g. /fr/search). next-intl Link localizes `/search`
 * for French; the unprefixed route lives at `app/search/page.tsx`.
 */
export default function LocaleSearchRedirectPage() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <SearchRedirectClient />
    </Suspense>
  );
}
