import { requireOnboardingComplete } from "@/lib/auth/server-auth";
import DashboardPageClient from "./page-client";

export default async function DashboardPage() {
  // Server-side auth check - redirects if not authenticated/verified/onboarded
  const user = await requireOnboardingComplete();
  if (!user) return null;

  return <DashboardPageClient user={user} />;
}
