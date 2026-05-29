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
import { RecentActivity } from "@/components/features/dashboard/recent-activity";
import { QuickActions } from "@/components/features/dashboard/quick-actions";
import { CustomerSetupChecklist } from "@/components/features/dashboard/customer-setup-checklist";
import { WelperSetupChecklist } from "@/components/features/dashboard/welper-setup-checklist";
import { normalizeCustomerSetupChecklist } from "@/lib/dashboard/normalize-customer-setup-checklist";
import { normalizeWelperSetupChecklist } from "@/lib/dashboard/normalize-welper-setup-checklist";
import { useCustomerSetupChecklist, useWelperSetupChecklist } from "@/lib/hooks/use-signup";
import { useDashboardUser } from "@/lib/hooks/use-dashboard-user";
import { useCustomerProfile, useFavoriteWelpers, useWelperProfile } from "@/lib/hooks/use-profile";
import { useBookings } from "@/lib/hooks/use-bookings";
import {
  buildDashboardActivities,
  computeCustomerStatsFromBookings,
  computeWelperStatsFromBookings,
  countUpcomingBookings,
  countPendingForWelper,
} from "@/lib/dashboard/booking-dashboard";
import {
  useBookingStatusLabel,
  useWelperHomeLabels,
} from "@/lib/i18n/use-dashboard-labels";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";

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
  const dateFnsLocale = useDateFnsLocale();
  const bookingStatusLabel = useBookingStatusLabel();

  const userRole = user?.role || "customer";
  const bookingsRole =
    userRole === "customer" ? "customer" : userRole === "welper" ? "welper" : null;

  const { data: welperSetup, isLoading: welperSetupLoading } = useWelperSetupChecklist(
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

  const { data: customerSetup, isLoading: customerSetupLoading } = useCustomerSetupChecklist(
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

  const customerSetupIncomplete =
    userRole === "customer" &&
    (customerSetupLoading ||
      !normalizedCustomerSetup ||
      !normalizedCustomerSetup.setupComplete);

  const welperSetupIncomplete =
    userRole === "welper" &&
    (welperSetupLoading ||
      !normalizedWelperSetup ||
      !normalizedWelperSetup.setupComplete);

  const {
    data: bookingsResponse,
    isLoading: bookingsLoading,
  } = useBookings(
    { page: 1, limit: BOOKINGS_DASHBOARD_LIMIT, role: bookingsRole ?? "customer" },
    { enabled: !!bookingsRole && !welperSetupIncomplete && !customerSetupIncomplete },
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
      );
    }
    if (userRole === "welper") {
      return computeWelperStatsFromBookings(bookings, welperHome.stats);
    }
    return null;
  }, [userRole, bookings, favoriteWelpersList?.total, welperHome.stats]);

  const activities = useMemo(() => {
    if (!bookingsRole) return [];
    return buildDashboardActivities(
      bookings,
      bookingsRole,
      8,
      bookingsRole === "welper"
        ? {
            jobTitle: welperHome.activityTitle,
            formatStatus: bookingStatusLabel,
            dateLocale: dateFnsLocale,
          }
        : undefined,
    );
  }, [bookings, bookingsRole, welperHome.activityTitle, bookingStatusLabel, dateFnsLocale]);

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
    return `Counts use your ${bookings.length} most recent bookings — open Bookings for the full list.`;
  }, [bookingsResponse, bookings.length, userRole, welperHome]);

  const welperShowSetupChecklist = userRole === "welper" && welperSetupIncomplete;
  const customerShowSetupChecklist = userRole === "customer" && customerSetupIncomplete;
  const hideDashboardExtras = welperSetupIncomplete || customerSetupIncomplete;

  // The single concrete state line below the greeting. Avoids generic
  // "here's what's happening" copy — names a number when there is one.
  const stateLine = useMemo(() => {
    if (bookingsLoading) {
      return userRole === "welper" ? welperHome.loading : "Loading your dashboard…";
    }
    if (userRole === "welper") {
      if (welperSetupIncomplete && !welperShowSetupChecklist) {
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
    if (customerSetupIncomplete && !customerShowSetupChecklist) {
      return "Finish setting up your account to start booking.";
    }
    if (upcomingCount > 0) {
      return `You have ${upcomingCount} upcoming ${upcomingCount === 1 ? "booking" : "bookings"}.`;
    }
    return "No upcoming bookings — find a Welper to get started.";
  }, [
    bookingsLoading,
    userRole,
    upcomingCount,
    pendingForWelper,
    bookings,
    welperSetupIncomplete,
    customerSetupIncomplete,
    customerShowSetupChecklist,
    welperShowSetupChecklist,
    normalizedWelperSetup,
    welperHome,
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
            size="3"
          />
          <Box flexGrow="1" style={{ minWidth: "min(100%, 12rem)" }}>
            <Heading as="h1" size="7" mb="2" trim="start">
              {welperHome.greeting(greetingName)}
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
            />

            <DashboardStats
              role={userRole === "welper" ? "welper" : "customer"}
              stats={dashboardStats ?? undefined}
              loading={statsLoading}
              footnote={statsFootnote}
              welperSectionTitle={
                userRole === "welper" ? welperHome.statsSectionTitle : undefined
              }
            />

            <RecentActivity
              activities={activities}
              role={userRole === "welper" ? "welper" : "customer"}
              loading={statsLoading}
              welperLabels={
                userRole === "welper" ? welperHome.recentActivity : undefined
              }
            />
          </>
        ) : null}
      </Flex>
    </Container>
  );
}
