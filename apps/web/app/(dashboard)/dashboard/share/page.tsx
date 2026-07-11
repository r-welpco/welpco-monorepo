import { requireRole } from "@/lib/auth/server-auth";
import SharePageClient from "./page-client";

/**
 * SHARE-004 — Share hub (welper-only).
 * Server-side gate mirrors the other role-locked dashboard pages
 * (e.g. /dashboard/booking/new): non-welpers bounce to /dashboard.
 */
export default async function SharePage() {
  const user = await requireRole("welper");
  if (!user) return null;

  return <SharePageClient user={user} />;
}
