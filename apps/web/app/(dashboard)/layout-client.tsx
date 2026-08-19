"use client";

import { CustomerHeader, WelperHeader } from "@welpco/ui/platform/layout";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePersonalizationStore } from "@/stores/personalizationStore";
import { useQueryClient } from "@tanstack/react-query";
import { performClientSignOut } from "@/lib/auth/client-sign-out";
import { apiClient } from "@/lib/api/client";
import { clearTokenCache } from "@/lib/api/get-token";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useDashboardUser } from "@/lib/hooks/use-dashboard-user";
import { useCustomerProfile, useWelperProfile } from "@/lib/hooks/use-profile";
import { AuthBackgroundSVG } from "@/components/features/personalization/auth-background-svg";
import { useUnreadCount } from "@/lib/hooks/use-notifications";
import { NotificationBellPopover } from "@/components/layout/notification-bell-popover";
import { SetupChecklistPopover } from "@/components/layout/setup-checklist-popover";
import { SetupIncompleteHeaderBanner } from "@/components/layout/setup-incomplete-header-banner";
import {
  useCustomerNavLabels,
  useWelperNavLabels,
} from "@/lib/i18n/use-dashboard-labels";
import { useDashboardLocale } from "@/lib/i18n/dashboard-locale";
import { getDashboardTabStripStyle } from "@/lib/personalization/dashboard-tab-strip-style";
import { AppearanceTunerEffects } from "@/components/features/personalization/appearance-tuner-effects";
import { DashboardAppearanceTuner } from "@/components/features/personalization/dashboard-appearance-tuner";
import { useAppearanceTunerStore } from "@/stores/appearanceTunerStore";
import { AppFooter } from "@/components/layout/app-footer";

const showAppearanceTuner = process.env.NODE_ENV === "development";
interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    role: string;
    /** Earned account type ("Welper" | "Customer"); `role` is the acting role. */
    accountType?: string;
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
  const { data: session, update: updateSession } = useSession();
  // Dual-role accounts: the earned account type never changes with the acting
  // mode, so it decides whether the role switcher is available at all.
  const isWelperAccount =
    (session?.user?.accountType ?? serverUser.accountType)?.toLowerCase() ===
    "welper";
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const { data: customerProfile } = useCustomerProfile(user.id, userRole === "customer");
  const { data: welperProfile } = useWelperProfile(user.id, userRole === "welper");
  const backgroundId = usePersonalizationStore((s) => s.backgroundId);
  const tabStripAccentMix = useAppearanceTunerStore((s) => s.tabStripAccentMix);
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
    if (pathname.startsWith("/dashboard/marketplace")) return "marketplace";
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
      marketplace: "/dashboard/marketplace",
      bookings: "/dashboard/bookings",
      messages: "/dashboard/messages",
      profile: "/dashboard/profile",
      settings: "/dashboard/settings",
    };
    router.push(tabMap[tab] || "/dashboard");
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

  const handleGuidesClick = useCallback(() => {
    router.push("/dashboard/guides");
  }, [router]);

  const handleLogout = useCallback(async () => {
    await performClientSignOut({ callbackUrl: "/", queryClient });
  }, [queryClient]);

  const handleRoleSwitch = useCallback(async () => {
    if (!isWelperAccount || isSwitchingRole) return;
    setIsSwitchingRole(true);
    try {
      if (userRole === "welper") {
        // Entering customer mode: bootstrap the customer profile row first
        // (idempotent) so the customer dashboard never renders against
        // missing data. The explicit header makes the BFF authorize this
        // call as customer before the session flips.
        await apiClient.post("/api/profiles/me/customer-profile", undefined, {
          headers: { "X-Welpco-Role": "customer" },
        });
        await updateSession({ roleMode: "customer" });
      } else {
        await updateSession({ roleMode: null });
      }
      // Session role changed: drop the cached token+role snapshot, refetch
      // active queries under the new acting role, re-render server components.
      clearTokenCache();
      await queryClient.invalidateQueries();
      router.refresh();
    } catch (error) {
      console.error(
        "Role switch failed:",
        error instanceof Error ? error.message : error,
      );
    } finally {
      setIsSwitchingRole(false);
    }
  }, [isWelperAccount, isSwitchingRole, userRole, updateSession, queryClient, router]);

  const tRoleSwitch = useTranslations("dashboard.nav.roleSwitch");
  const roleSwitchLabels = useMemo(
    () => ({
      menuLabel: tRoleSwitch("menuLabel"),
      switchTo:
        userRole === "welper"
          ? tRoleSwitch("toCustomer")
          : tRoleSwitch("toWelper"),
    }),
    [tRoleSwitch, userRole],
  );

  const setupRole = userRole === "welper" ? "welper" : "customer";

  const headerActionsSlot = useMemo(
    () => (
      <Flex align="center" gap="3" mr="2">
        <SetupChecklistPopover
          role={setupRole}
          badgeColor={userRole === "welper" ? "green" : "blue"}
        />
        <NotificationBellPopover badgeColor={userRole === "welper" ? "green" : "blue"} />
      </Flex>
    ),
    [setupRole, userRole],
  );

  const headerBannerSlot = useMemo(
    () => <SetupIncompleteHeaderBanner role={setupRole} />,
    [setupRole],
  );

  const tabStripStyle = useMemo(
    () =>
      getDashboardTabStripStyle(backgroundId, {
        accentMixPercent: showAppearanceTuner ? tabStripAccentMix : undefined,
      }),
    [backgroundId, tabStripAccentMix],
  );

  const customerNavLabels = useCustomerNavLabels();
  const welperNavLabels = useWelperNavLabels();
  const welperHeaderLabels = welperNavLabels;
  const { locale, setLocale } = useDashboardLocale();

  if (!mounted) {
    // Render a lightweight shell to avoid full-page flash / CLS
    return (
      <Flex direction="column" style={{ minHeight: "100vh" }}>
        <Box style={{ height: "64px", backgroundColor: "var(--gray-2)" }} />
        <Box
          py="7"
          px="6"
          style={{
            flex: 1,
            backgroundColor: "var(--gray-1)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {children}
        </Box>
        <AppFooter />
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
    notificationSlot: headerActionsSlot,
    onTabChange: handleTabChange,
    onThemeChange: handleThemeChange,
    locale,
    onLocaleChange: setLocale,
    onProfileClick: handleProfileClick,
    onSettingsClick: handleSettingsClick,
    onGuidesClick: handleGuidesClick,
    onLogout: handleLogout,
    bannerSlot: headerBannerSlot,
  };

  return (
    <Flex direction="column" style={{ minHeight: "100vh", position: "relative" }}>
      {userRole === "customer" ? (
        <CustomerHeader
          {...headerProps}
          labels={customerNavLabels}
          tabStripStyle={tabStripStyle}
          onRoleSwitch={isWelperAccount ? handleRoleSwitch : undefined}
          roleSwitchLabels={roleSwitchLabels}
        />
      ) : (
        <WelperHeader
          {...headerProps}
          labels={welperHeaderLabels}
          tabStripStyle={tabStripStyle}
          onRoleSwitch={isWelperAccount ? handleRoleSwitch : undefined}
          roleSwitchLabels={roleSwitchLabels}
        />
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
          style={{
            width: "100%",
            maxWidth: "1200px",
            minWidth: 0,
            position: "relative",
          }}
        >
          {children}
        </Box>
      </Box>
      <AppFooter />
      {showAppearanceTuner ? (
        <>
          <AppearanceTunerEffects />
          <DashboardAppearanceTuner />
        </>
      ) : null}
    </Flex>
  );
}