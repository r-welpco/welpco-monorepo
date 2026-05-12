import { requireOnboardingComplete } from "@/lib/auth/server-auth";
import DashboardLayoutClient from "./layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOnboardingComplete();
  if (!user) return null;
  return <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>;
}
