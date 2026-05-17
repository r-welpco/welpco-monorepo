import type { Session } from "next-auth";

/**
 * True when NextAuth has a session that can call the BFF (access JWT present).
 * `useSession().status === "authenticated"` alone is insufficient — the session
 * callback may clear tokens while the client still reports authenticated.
 */
export function hasApiSession(
  status: "loading" | "authenticated" | "unauthenticated",
  session: Session | null | undefined,
): boolean {
  return (
    status === "authenticated" &&
    Boolean(session?.accessToken && session?.user?.id)
  );
}
