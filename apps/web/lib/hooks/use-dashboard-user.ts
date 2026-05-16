import { useEffect, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@/types";

/** Minimal server-rendered user passed from dashboard layouts/pages. */
export interface DashboardServerUser {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  /** Day 15 — post signup-merge source of truth. */
  signupCompleted?: boolean;
  /** Legacy mirror; kept until BFF column drops. */
  onboardingCompleted?: boolean;
  name?: string | null;
  image?: string | null;
}

/**
 * Keeps Zustand auth user in sync with the server user and exposes a stable
 * `user` reference (memoized fallback when the client store is empty).
 */
export function useDashboardUser(serverUser: DashboardServerUser): { user: User } {
  const clientUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const current = useAuthStore.getState().user;
    if (
      !current ||
      current.id !== serverUser.id ||
      current.role !== serverUser.role
    ) {
      setUser({
        id: serverUser.id,
        email: serverUser.email,
        name: serverUser.name ?? null,
        role: serverUser.role as "customer" | "welper",
        image: serverUser.image ?? null,
        emailVerified: serverUser.emailVerified,
        onboardingCompleted: serverUser.onboardingCompleted,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [
    serverUser.id,
    serverUser.email,
    serverUser.role,
    serverUser.emailVerified,
    serverUser.onboardingCompleted,
    serverUser.name,
    serverUser.image,
    setUser,
  ]);

  const fallbackUser = useMemo(
    (): User => ({
      id: serverUser.id,
      email: serverUser.email,
      name: serverUser.name ?? null,
      role: serverUser.role as "customer" | "welper",
      image: serverUser.image ?? null,
      emailVerified: serverUser.emailVerified,
      onboardingCompleted: serverUser.onboardingCompleted,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    [
      serverUser.id,
      serverUser.email,
      serverUser.role,
      serverUser.emailVerified,
      serverUser.onboardingCompleted,
      serverUser.name,
      serverUser.image,
    ],
  );

  return { user: clientUser ?? fallbackUser };
}
