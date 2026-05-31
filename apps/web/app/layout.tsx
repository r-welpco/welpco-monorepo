import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { AuthSessionSync } from "@/components/providers/session-provider";
import { SessionProvider } from "next-auth/react";
import { ThemeInitScript } from "@/components/providers/theme-init-script";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

/** Required with `cacheComponents`: client providers + pages must not block prerender without a boundary. */
function RouterTreeFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--gray-2, #f5f5f5)",
      }}
      aria-hidden
    />
  );
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Welpco - Connect with Your Community",
  description: "Welpco connects people in need of services with service providers within their community. Find trusted Welpers for babysitting, tutoring, home maintenance, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <SessionProvider
            refetchInterval={4 * 60} // Re-check session every 4 min so the JWT callback can refresh tokens proactively (access tokens live 15 min, refresh window starts at 5 min before expiry)
            refetchOnWindowFocus={true} // Re-check session when tab regains focus (catches idle-tab expiry)
            refetchWhenOffline={false}
          >
            <AuthSessionSync>
              <ThemeProvider>
                <Suspense fallback={<RouterTreeFallback />}>{children}</Suspense>
              </ThemeProvider>
            </AuthSessionSync>
          </SessionProvider>
        </QueryProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
