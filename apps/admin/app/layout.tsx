import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { AdminThemeProvider } from "@/components/providers/admin-theme-provider";
import { QueryProvider } from "@/lib/providers/query-provider";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Welpco Admin",
  description: "Platform administration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AdminThemeProvider>
          <SessionProvider
            refetchInterval={4 * 60}
            refetchOnWindowFocus={true}
            refetchWhenOffline={false}
          >
            <QueryProvider>{children}</QueryProvider>
          </SessionProvider>
        </AdminThemeProvider>
      </body>
    </html>
  );
}
