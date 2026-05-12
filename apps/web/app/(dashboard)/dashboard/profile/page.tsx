import { requireOnboardingComplete } from "@/lib/auth/server-auth";
import ProfilePageClient from "./page-client";

export default async function ProfilePage() {
  const user = await requireOnboardingComplete();
  if (!user) return null;
  return <ProfilePageClient user={user} />;
}
