"use client";

import { CustomerHeader, WelperHeader } from "@welpco/ui/platform/layout";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { usePathname, useRouter } from "next/navigation";
import { usePersonalizationStore } from "@/stores/personalizationStore";
import { useQueryClient } from "@tanstack/react-query";
import { performClientSignOut } from "@/lib/auth/client-sign-out";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useDashboardUser } from "@/lib/hooks/use-dashboard-user";
import { useCustomerProfile, useWelperProfile } from "@/lib/hooks/use-profile";
import { AuthBackgroundSVG } from "@/components/features/personalization/auth-background-svg";
import { useUnreadCount } from "@/lib/hooks/use-notifications";
import { NotificationBellPopover } from "@/components/layout/notification-bell-popover";
import {
  useDashboardUserMenuLabels,
  useWelperNavLabels,
} from "@/lib/i18n/use-dashboard-labels";
import { useDashboardLocale } from "@/lib/i18n/dashboard-locale";
interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
    /** Day 15 — post signup-merge source of truth. */
    signupCompleted: boolean;
    /** Legacy mirror; kept until BFF column drops. */
    onboardingCompleted: boolean;
    name?: string | null;
    image?: string | null;
  };
}

export default function DashboardLayoutClient({
  children,
  user: serverUser,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useDashboardUser(serverUser);
  const userRole = user?.role || "customer";
  const { data: customerProfile } = useCustomerProfile(user.id, userRole === "customer");
  const { data: welperProfile } = useWelperProfile(user.id, userRole === "welper");
  const backgroundId = usePersonalizationStore((s) => s.backgroundId);
  const themeMode = usePersonalizationStore((s) => s.themeMode);
  const setThemeMode = usePersonalizationStore((s) => s.setThemeMode);
  const { data: unreadData } = useUnreadCount();
  const [mounted, setMounted] = useState(false);
  const notificationCount = unreadData?.count ?? 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine active tab from pathname
  const activeTab = useMemo(() => {
    if (pathname.startsWith("/dashboard/search")) return "search";
    if (pathname.startsWith("/dashboard/bookings")) return "bookings";
    if (pathname.startsWith("/dashboard/messages")) return "messages";
    if (pathname.startsWith("/dashboard/profile")) return "profile";
    if (pathname.startsWith("/dashboard/settings")) return "settings";
    return "dashboard";
  }, [pathname]);

  const contentAnimationKey = useMemo(() => {
    if (/^\/dashboard\/messages\/[^/]+$/.test(pathname)) {
      return "/dashboard/messages";
    }
    return pathname;
  }, [pathname]);

  const handleTabChange = useCallback((tab: string) => {
    const tabMap: Record<string, string> = {
      dashboard: "/dashboard",
      search: "/dashboard/search",
      bookings: "/dashboard/bookings",
      messages: "/dashboard/messages",
      profile: "/dashboard/profile",
      settings: "/dashboard/settings",
    };
    router.push(tabMap[tab] || "/dashboard");
  }, [router]);

  const handleSearch = useCallback((query: string) => {
    const q = (query || "").trim();
    if (q) {
      router.push(`/dashboard/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/dashboard/search");
    }
  }, [router]);

  const handleThemeChange = useCallback(
    (mode: "light" | "dark" | "system") => {
      setThemeMode(mode);
    },
    [setThemeMode]
  );

  const handleProfileClick = useCallback(() => {
    router.push("/dashboard/profile");
  }, [router]);

  const handleSettingsClick = useCallback(() => {
    router.push("/dashboard/settings");
  }, [router]);

  const handleLogout = useCallback(async () => {
    await performClientSignOut({ callbackUrl: "/", queryClient });
  }, [queryClient]);

  const notificationSlot = useMemo(
    () => <NotificationBellPopover badgeColor={userRole === "welper" ? "green" : "blue"} />,
    [userRole]
  );

  const welperNavLabels = useWelperNavLabels();
  const userMenuLabels = useDashboardUserMenuLabels();
  const { locale, setLocale } = useDashboardLocale();

  if (!mounted) {
    // Render a lightweight shell to avoid full-page flash / CLS
    return (
      <Flex direction="column" style={{ minHeight: "100vh" }}>
        <Box style={{ height: "64px", backgroundColor: "var(--gray-2)" }} />
        <Box py="7" px="6" style={{ flex: 1, backgroundColor: "var(--gray-1)" }}>
          {children}
        </Box>
      </Flex>
    );
  }

  const profilePhotoUrl =
    userRole === "customer" ? customerProfile?.photoUrl : userRole === "welper" ? welperProfile?.photoUrl : undefined;
  const headerDisplayName =
    userRole === "customer" && customerProfile
      ? [customerProfile.firstName, customerProfile.lastName].filter(Boolean).join(" ").trim() || user.name || undefined
      : userRole === "welper" && welperProfile
        ? welperProfile.displayName?.trim() || user.name || undefined
        : user.name || undefined;

  const headerProps = {
    activeTab,
    themeMode,
    user: user
      ? {
          name: headerDisplayName,
          email: user.email,
          image: profilePhotoUrl || user.image || undefined,
        }
      : undefined,
    notificationCount,
    notificationSlot,
    onTabChange: handleTabChange,
    ...(userRole === "customer"
      ? {
          onSearch: handleSearch,
          onRoleSwitch: () => router.push("/dashboard"),
          onFeedbackClick: () => {
            // TODO: Open feedback modal
          },
          onDocsClick: () => window.open("https://docs.welpco.com", "_blank"),
        }
      : {}),
    onThemeChange: handleThemeChange,
    locale,
    onLocaleChange: setLocale,
    onProfileClick: handleProfileClick,
    onSettingsClick: handleSettingsClick,
    onLogout: handleLogout,
  };

  return (
    <Flex direction="column" style={{ minHeight: "100vh", position: "relative" }}>
      {userRole === "customer" ? (
        <CustomerHeader {...headerProps} labels={userMenuLabels} />
      ) : (
        <WelperHeader {...headerProps} labels={welperNavLabels} />
      )}
      <Box
        py={{ initial: "5", sm: "7" }}
        px={{ initial: "4", sm: "6" }}
        style={{
          flex: 1,
          backgroundColor: "var(--gray-1)",
          display: "flex",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        <AuthBackgroundSVG backgroundId={backgroundId} />
        <Box
          key={contentAnimationKey}
          className="animate-fade-in-up"
          style={{
            width: "100%",
            maxWidth: "1200px",
            minWidth: 0,
            position: "relative",
            animationFillMode: "both",
          }}
        >
          {children}
        </Box>
      </Box>
    </Flex>
  );
}