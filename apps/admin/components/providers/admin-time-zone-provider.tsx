"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const AdminTimeZoneContext = createContext<string | null>(null);

export function AdminTimeZoneProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const timeZone = useSyncExternalStore(
    () => () => undefined,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    () => null,
  );

  return (
    <AdminTimeZoneContext.Provider value={timeZone}>
      {children}
    </AdminTimeZoneContext.Provider>
  );
}

export function useAdminTimeZone(): string | null {
  return useContext(AdminTimeZoneContext);
}
