import { requireOnboardingComplete } from "@/lib/auth/server-auth";
import BackgroundCheckSetupPageClient from "./page-client";

export default async function BackgroundCheckSetupPage() {
  await requireOnboardingComplete();
  return <BackgroundCheckSetupPageClient />;
}
