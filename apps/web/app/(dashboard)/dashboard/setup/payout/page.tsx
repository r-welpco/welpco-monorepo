import { requireOnboardingComplete } from "@/lib/auth/server-auth";
import PayoutSetupPageClient from "./page-client";

export default async function PayoutSetupPage() {
  await requireOnboardingComplete();
  return <PayoutSetupPageClient />;
}
