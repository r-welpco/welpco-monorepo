"use client";

import { useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { clearTokenCache } from "@/lib/api/get-token";
import { isClientSigningOut } from "@/lib/auth/client-sign-out";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@/types";

export function AuthSessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  
  const lastSyncedUserIdRef = useRef<string | null>(null);
  const lastSyncedRoleRef = useRef<string | null>(null);
  const lastStatusRef = useRef<string | null>(null);

  // Memoize user object creation to avoid recreating on every render
  const userFromSession = useMemo<User | null>(() => {
    if (status === "authenticated" && session?.user) {
      const u = session.user as { id?: string; email?: string | null; name?: string | null; role?: string; image?: string | null; emailVerified?: boolean };
      return {
        id: u.id || "",
        email: u.email || "",
        name: u.name || null,
        role: (u.role as "customer" | "welper") || "customer",
        image: u.image || null,
        emailVerified: u.emailVerified ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return null;
  }, [status, session?.user]);

  useEffect(() => {
    // Only update loading state if it actually changed
    if (lastStatusRef.current !== status) {
      setLoading(status === "loading");
      lastStatusRef.current = status;
    }

    // Only update user if user ID changed (prevents infinite loops)
    // When user ID changes, update all fields from session
    if (userFromSession && !isClientSigningOut()) {
      const userId = userFromSession.id;
      const role = userFromSession.role;

      if (
        lastSyncedUserIdRef.current !== userId ||
        lastSyncedRoleRef.current !== role
      ) {
        setUser(userFromSession);
        lastSyncedUserIdRef.current = userId;
        lastSyncedRoleRef.current = role;
      }
    } else if (status === "unauthenticated" && lastSyncedUserIdRef.current !== null) {
      clearTokenCache();
      setUser(null);
      lastSyncedUserIdRef.current = null;
      lastSyncedRoleRef.current = null;
    }
  }, [userFromSession, status, setUser, setLoading]); // Use memoized user object

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset refs on unmount to prevent stale state
      lastSyncedUserIdRef.current = null;
      lastSyncedRoleRef.current = null;
      lastStatusRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
