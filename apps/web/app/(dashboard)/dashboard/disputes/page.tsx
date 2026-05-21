import { requireOnboardingComplete } from "@/lib/auth/server-auth";
import DisputesPageClient from "./page-client";

export default async function DisputesPage() {
  await requireOnboardingComplete();
  return <DisputesPageClient />;
}
