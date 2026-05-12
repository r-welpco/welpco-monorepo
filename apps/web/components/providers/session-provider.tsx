"use client";

import { useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@/types";

export function AuthSessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  
  // Track last synced user ID to prevent unnecessary updates
  const lastSyncedUserIdRef = useRef<string | null>(null);
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
    if (userFromSession) {
      const userId = userFromSession.id;
      
      // Only update if user ID changed - this prevents loops when other fields change
      if (lastSyncedUserIdRef.current !== userId) {
        setUser(userFromSession);
        lastSyncedUserIdRef.current = userId;
      }
    } else if (status === "unauthenticated" && lastSyncedUserIdRef.current !== null) {
      // Only clear user if we had one before
      setUser(null);
      lastSyncedUserIdRef.current = null;
    }
  }, [userFromSession, status, setUser, setLoading]); // Use memoized user object

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset refs on unmount to prevent stale state
      lastSyncedUserIdRef.current = null;
      lastStatusRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
