"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import { ProfilePhotoAvatar } from "@welpco/ui/platform/profile-management";

import { DashboardStats } from "@/components/features/dashboard/dashboard-stats";
import { RecentNotifications } from "@/components/features/dashboard/recent-notifications";
import { QuickActions } from "@/components/features/dashboard/quick-actions";
import { CustomerSetupChecklist } from "@/components/features/dashboard/customer-setup-checklist";
import { WelperSetupChecklist } from "@/components/features/dashboard/welper-setup-checklist";
import { normalizeCustomerSetupChecklist } from "@/lib/dashboard/normalize-customer-setup-checklist";
import { normalizeWelperSetupChecklist } from "@/lib/dashboard/normalize-welper-setup-checklist";
import { buildCustomerSetupGroupedView } from "@/lib/dashboard/customer-setup-groups";
import { buildWelperSetupGroupedView } from "@/lib/dashboard/welper-setup-groups";
import { useCustomerSetupChecklist, useWelperSetupChecklist } from "@/lib/hooks/use-signup";
import { useDashboardUser } from "@/lib/hooks/use-dashboard-user";
import { useCustomerProfile, useFavoriteWelpers, useWelperProfile } from "@/lib/hooks/use-profile";
import { useBookings } from "@/lib/hooks/use-bookings";
import {
  computeCustomerStatsFromBookings,
  computeWelperStatsFromBookings,
  countUpcomingBookings,
  countPendingForWelper,
  type DashboardStatItem,
} from "@/lib/dashboard/booking-dashboard";
import {
  useCustomerHomeLabels,
  useWelperHomeLabels,
} from "@/lib/i18n/use-dashboard-labels";

const BOOKINGS_DASHBOARD_LIMIT = 50;

interface DashboardPageClientProps {
  user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
    /** Day 15 — post signup-merge source of truth. */
    signupCompleted: boolean;
    /** Legacy mirror; kept until BFF column drops. */
    onboardingCompleted: boolean;
  };
}

/** Pull "Sam Carter" -> "Sam"; falls back to email local-part; never empty. */
function firstNameOf(name: string | null | undefined, email: string | undefined): string {
  const n = (name ?? "").trim();
  if (n) return n.split(/\s+/)[0]!;
  if (email) return email.split("@")[0]!;
  return "there";
}

export default function DashboardPageClient({ user: serverUser }: DashboardPageClientProps) {
  const { user } = useDashboardUser(serverUser);
  const { data: session } = useSession();
  const welperHome = useWelperHomeLabels();
  const customerHome = useCustomerHomeLabels();

  const userRole = user?.role || "customer";
  const bookingsRole =
    userRole === "customer" ? "customer" : userRole === "welper" ? "welper" : null;

  const { data: welperSetup, isPending: welperSetupPending } = useWelperSetupChecklist(
    userRole === "welper",
  );

  const normalizedWelperSetup = useMemo(
    () =>
      welperSetup
        ? normalizeWelperSetupChecklist(
            welperSetup,
            session?.user?.emailVerified === true,
          )
        : undefined,
    [welperSetup, session?.user?.emailVerified],
  );

  const { data: customerSetup, isPending: customerSetupPending } = useCustomerSetupChecklist(
    userRole === "customer",
  );

  const normalizedCustomerSetup = useMemo(
    () =>
      customerSetup
        ? normalizeCustomerSetupChecklist(
            customerSetup,
            session?.user?.emailVerified === true,
          )
        : undefined,
    [customerSetup, session?.user?.emailVerified],
  );

  const customerGroupedSetup = useMemo(
    () =>
      normalizedCustomerSetup
        ? buildCustomerSetupGroupedView(normalizedCustomerSetup.setupTasks)
        : undefined,
    [normalizedCustomerSetup],
  );

  const customerSectionAIncomplete =
    userRole === "customer" &&
    ((customerSetupPending && !customerSetup) ||
      !customerGroupedSetup ||
      !customerGroupedSetup.sectionAComplete);

  const customerChecklistVisible =
    userRole === "customer" &&
    ((customerSetupPending && !customerSetup) ||
      !normalizedCustomerSetup ||
      !customerGroupedSetup?.allComplete);

  const customerSetupIncomplete = customerSectionAIncomplete;

  const welperGroupedSetup = useMemo(
    () =>
      normalizedWelperSetup
        ? buildWelperSetupGroupedView(normalizedWelperSetup.setupTasks)
        : undefined,
    [normalizedWelperSetup],
  );

  /** Section A (go live) — bookings and dashboard extras unlock when this is complete. */
  const welperSectionAIncomplete =
    userRole === "welper" &&
    ((welperSetupPending && !welperSetup) ||
      !welperGroupedSetup ||
      !welperGroupedSetup.sectionAComplete);

  const welperChecklistVisible =
    userRole === "welper" &&
    ((welperSetupPending && !welperSetup) ||
      !normalizedWelperSetup ||
      normalizedWelperSetup.allSetupComplete !== true);

  const {
    data: bookingsResponse,
    isLoading: bookingsLoading,
  } = useBookings(
    { page: 1, limit: BOOKINGS_DASHBOARD_LIMIT, role: bookingsRole ?? "customer" },
    { enabled: !!bookingsRole && !welperSectionAIncomplete && !customerSetupIncomplete },
  );

  const { data: customerProfile } = useCustomerProfile(user.id, userRole === "customer");
  const { data: welperProfile } = useWelperProfile(user.id, userRole === "welper");
  const { data: favoriteWelpersList } = useFavoriteWelpers(
    userRole === "customer" ? user.id : "",
  );

  const bookings = useMemo(() => bookingsResponse?.data ?? [], [bookingsResponse?.data]);

  const dashboardStats = useMemo(() => {
    if (userRole === "customer") {
      return computeCustomerStatsFromBookings(
        bookings,
        favoriteWelpersList?.total ?? 0,
        customerHome.stats,
      );
    }
    if (userRole === "welper") {
      return computeWelperStatsFromBookings(bookings, welperHome.stats);
    }
    return null;
  }, [userRole, bookings, favoriteWelpersList?.total, welperHome.stats, customerHome.stats]);

  // DASHBOARD-003 — trust stats the welper already earns but never saw.
  // GET /api/profiles/me hydrates averageRating / reviewCount /
  // responseTimeMinutes; render them as extra stat tiles. Rating shows only
  // with ≥ 1 review; `undefined` (older cached payload) shows nothing —
  // unknown ≠ zero (bible §22.6).
  const welperTrustStats = useMemo<DashboardStatItem[]>(() => {
    if (userRole !== "welper" || !welperProfile) return [];
    const items: DashboardStatItem[] = [];
    const reviewCount = welperProfile.reviewCount;
    if (
      typeof welperProfile.averageRating === "number" &&
      typeof reviewCount === "number" &&
      reviewCount >= 1
    ) {
      items.push({
        title: welperHome.stats.rating,
        value: `${welperProfile.averageRating.toFixed(1)} / 5`,
      });
      items.push({ title: welperHome.stats.reviews, value: reviewCount });
    }
    if (typeof welperProfile.responseTimeMinutes === "number") {
      const minutes = welperProfile.responseTimeMinutes;
      items.push({
        title: welperHome.stats.responseTime,
        value:
          minutes < 60
            ? welperHome.statsResponseMinutes(minutes)
            : welperHome.statsResponseHours(Math.max(1, Math.round(minutes / 60))),
      });
    }
    return items;
  }, [userRole, welperProfile, welperHome]);

  const showReviewsEmptyHint =
    userRole === "welper" && welperProfile?.reviewCount === 0;

  const upcomingCount = useMemo(() => countUpcomingBookings(bookings), [bookings]);
  const pendingForWelper = useMemo(
    () => (userRole === "welper" ? countPendingForWelper(bookings) : 0),
    [userRole, bookings],
  );

  const statsFootnote = useMemo(() => {
    if (!bookingsResponse || bookingsResponse.total <= bookings.length) return undefined;
    if (userRole === "welper") {
      return welperHome.statsFootnote(bookings.length);
    }
    return customerHome.statsFootnote(bookings.length);
  }, [bookingsResponse, bookings.length, userRole, welperHome, customerHome]);

  const welperShowSetupChecklist = welperChecklistVisible;
  const customerShowSetupChecklist = customerChecklistVisible;
  const hideDashboardExtras = welperSectionAIncomplete || customerSectionAIncomplete;

  // The single concrete state line below the greeting. Avoids generic
  // "here's what's happening" copy — names a number when there is one.
  const stateLine = useMemo(() => {
    if (bookingsLoading) {
      return userRole === "welper" ? welperHome.loading : customerHome.loading;
    }
    if (userRole === "welper") {
      if (welperShowSetupChecklist) {
        if (pendingForWelper > 0) {
          return welperHome.pendingJobs(pendingForWelper);
        }
        const active = bookings.filter((b) =>
          ["accepted", "in_progress"].includes(b.status),
        ).length;
        if (active > 0) {
          return welperHome.activeJobs(active);
        }
        return welperSectionAIncomplete
          ? welperHome.setupIncomplete
          : welperHome.recommendedSetupRemaining;
      }
      if (welperSectionAIncomplete) {
        return welperHome.setupIncomplete;
      }
      if (pendingForWelper > 0) {
        return welperHome.pendingJobs(pendingForWelper);
      }
      const active = bookings.filter((b) =>
        ["accepted", "in_progress"].includes(b.status),
      ).length;
      if (active > 0) {
        return welperHome.activeJobs(active);
      }
      if (normalizedWelperSetup?.discoverable) {
        return welperHome.noJobsDiscoverable;
      }
      return welperHome.noJobsNotDiscoverable;
    }
    if (customerSectionAIncomplete && !customerShowSetupChecklist) {
      return customerHome.setupIncomplete;
    }
    if (customerShowSetupChecklist && !customerSectionAIncomplete) {
      return customerHome.recommendedSetupRemaining;
    }
    if (upcomingCount > 0) {
      return customerHome.upcomingBookings(upcomingCount);
    }
    return customerHome.noUpcomingBookings;
  }, [
    bookingsLoading,
    userRole,
    upcomingCount,
    pendingForWelper,
    bookings,
    welperSectionAIncomplete,
    customerSectionAIncomplete,
    customerSetupIncomplete,
    customerShowSetupChecklist,
    welperShowSetupChecklist,
    normalizedWelperSetup,
    welperHome,
    customerHome,
  ]);

  const statsLoading = !!bookingsRole && bookingsLoading;
  const greetingName = useMemo(() => {
    if (userRole === "customer") {
      const first = customerProfile?.firstName?.trim();
      if (first) return first;
    }
    if (userRole === "welper") {
      const fromProfile =
        welperProfile?.firstName?.trim() || welperProfile?.displayName?.trim();
      if (fromProfile) return firstNameOf(fromProfile, user?.email);
    }
    return firstNameOf(user?.name ?? null, user?.email);
  }, [
    userRole,
    customerProfile?.firstName,
    welperProfile?.firstName,
    welperProfile?.displayName,
    user?.name,
    user?.email,
  ]);

  const profilePhotoUrl =
    userRole === "customer"
      ? customerProfile?.photoUrl
      : userRole === "welper"
        ? welperProfile?.photoUrl
        : undefined;
  const avatarSrc = profilePhotoUrl || user?.image || undefined;
  const avatarFallback = greetingName.charAt(0).toUpperCase() || "U";

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="6" minWidth="0">
        {/* 1. Orient — greeting + concrete state line. */}
        <Flex gap="4" align="start" wrap="wrap">
          <ProfilePhotoAvatar
            src={avatarSrc}
            alt={greetingName}
            fallback={avatarFallback}
            size="6"
          />
          <Box flexGrow="1" style={{ minWidth: "min(100%, 12rem)" }}>
            <Heading as="h1" size="7" mb="2" trim="start">
              {userRole === "welper"
                ? welperHome.greeting(greetingName)
                : customerHome.greeting(greetingName)}
            </Heading>
            <Text as="p" size="3" color="gray" highContrast>
              {stateLine}
            </Text>
          </Box>
        </Flex>

        {welperShowSetupChecklist ? (
          <WelperSetupChecklist variant="full" />
        ) : null}

        {customerShowSetupChecklist ? (
          <CustomerSetupChecklist variant="full" />
        ) : null}

        {!hideDashboardExtras ? (
          <>
            <QuickActions
              role={userRole === "welper" ? "welper" : "customer"}
              welperLabels={userRole === "welper" ? welperHome.quickActions : undefined}
              customerLabels={userRole === "customer" ? customerHome.quickActions : undefined}
            />

            <Box>
              <DashboardStats
                role={userRole === "welper" ? "welper" : "customer"}
                stats={
                  dashboardStats
                    ? [...dashboardStats, ...welperTrustStats]
                    : undefined
                }
                loading={statsLoading}
                footnote={statsFootnote}
                welperSectionTitle={
                  userRole === "welper" ? welperHome.statsSectionTitle : customerHome.statsSectionTitle
                }
              />
              {showReviewsEmptyHint && (
                <Text as="p" size="1" color="gray" mt="2">
                  {welperHome.statsReviewsEmptyHint}
                </Text>
              )}
            </Box>

            <RecentNotifications />
          </>
        ) : null}
      </Flex>
    </Container>
  );
}
