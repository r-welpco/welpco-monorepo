"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Redirect /search to /dashboard/search, preserving query string.
 * Only /dashboard/search is used for search; this keeps old links working.
 */
export default function SearchRedirectClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `/dashboard/search?${qs}` : "/dashboard/search");
  }, [router, searchParams]);

  return null;
}
