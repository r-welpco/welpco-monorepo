import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/lib/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Welpco Admin",
  description: "Platform administration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider
          refetchInterval={4 * 60}
          refetchOnWindowFocus={true}
          refetchWhenOffline={false}
        >
          <QueryProvider>{children}</QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
