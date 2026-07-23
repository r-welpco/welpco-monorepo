"use client";

import { useSession } from "next-auth/react";

import { getSearchDestination } from "@/lib/search/search-destination";

export function useSearchDestination(
  publicSearchHref = "/search",
): string {
  const { data: session, status } = useSession();
  const role = status === "authenticated" ? session?.user?.role : null;

  return getSearchDestination(publicSearchHref, role);
}
