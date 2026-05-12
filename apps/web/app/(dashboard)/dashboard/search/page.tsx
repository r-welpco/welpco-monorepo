import { Suspense } from "react";
import { requireOnboardingComplete } from "@/lib/auth/server-auth";
import DashboardSearchPageClient from "./page-client";
import SearchLoading from "./loading";

export default async function DashboardSearchPage() {
  await requireOnboardingComplete();
  return (
    <Suspense fallback={<SearchLoading />}>
      <DashboardSearchPageClient />
    </Suspense>
  );
}
