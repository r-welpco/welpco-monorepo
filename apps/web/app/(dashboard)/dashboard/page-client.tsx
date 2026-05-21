"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import { Callout } from "@welpco/ui/callout";
import { Button } from "@welpco/ui/button";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { ArrowRight } from "lucide-react";

import { DashboardStats } from "@/components/features/dashboard/dashboard-stats";
import { RecentActivity } from "@/components/features/dashboard/recent-activity";
import { QuickActions } from "@/components/features/dashboard/quick-actions";
import { WelperSetupChecklist } from "@/components/features/dashboard/welper-setup-checklist";
import { normalizeWelperSetupChecklist } from "@/lib/dashboard/normalize-welper-setup-checklist";
import { useWelperSetupChecklist } from "@/lib/hooks/use-signup";
import { useDashboardUser } from "@/lib/hooks/use-dashboard-user";
import {
  useCustomerProfile,
  useFavoriteWelpers,
} from "@/lib/hooks/use-profile";
import { useBookings } from "@/lib/hooks/use-bookings";
import {
  buildDashboardActivities,
  computeCustomerStatsFromBookings,
  computeWelperStatsFromBookings,
  countUpcomingBookings,
  countPendingForWelper,
} from "@/lib/dashboard/booking-dashboard";

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
    { enabled: !!bookingsRole && !welperSetupIncomplete },
  );

  const { data: customerProfile, isSuccess: customerProfileLoaded } = useCustomerProfile(
    user.id,
    userRole === "customer",
  );
  const { data: favoriteWelpers = [] } = useFavoriteWelpers(user.id);

  const bookings = useMemo(() => bookingsResponse?.data ?? [], [bookingsResponse?.data]);

  const dashboardStats = useMemo(() => {
    if (userRole === "customer") {
      return computeCustomerStatsFromBookings(bookings, favoriteWelpers.length);
    }
    if (userRole === "welper") {
      return computeWelperStatsFromBookings(bookings);
    }
    return null;
  }, [userRole, bookings, favoriteWelpers.length]);

  const activities = useMemo(() => {
    if (!bookingsRole) return [];
    return buildDashboardActivities(bookings, bookingsRole);
  }, [bookings, bookingsRole]);

  const upcomingCount = useMemo(() => countUpcomingBookings(bookings), [bookings]);
  const pendingForWelper = useMemo(
    () => (userRole === "welper" ? countPendingForWelper(bookings) : 0),
    [userRole, bookings],
  );

  const statsFootnote = useMemo(() => {
    if (!bookingsResponse || bookingsResponse.total <= bookings.length) return undefined;
    return `Counts use your ${bookings.length} most recent bookings — open Bookings for the full list.`;
  }, [bookingsResponse, bookings.length]);

  const completion = useMemo(() => {
    const steps = [
      { id: "name", completed: !!(customerProfile?.firstName && customerProfile?.lastName), required: true },
      { id: "phone", completed: !!customerProfile?.phone, required: true },
      { id: "address", completed: !!customerProfile?.address?.streetAddress, required: true },
      { id: "payment", completed: !!customerProfile?.hasDefaultPaymentMethod, required: true },
      { id: "favorites", completed: favoriteWelpers.length > 0, required: false },
    ];
    const required = steps.filter((s) => s.required && s.completed).length;
    const totalRequired = steps.filter((s) => s.required).length;
    return { required, totalRequired };
  }, [customerProfile, favoriteWelpers]);

  const isProfileIncomplete =
    userRole === "customer"
      ? !!(
          customerProfileLoaded &&
          customerProfile &&
          customerProfile.profileCompletionStatusLabel !== "Complete"
        )
      : welperSetupIncomplete;

  const welperShowSetupChecklist = userRole === "welper" && welperSetupIncomplete;

  const welperHideDashboardExtras = welperSetupIncomplete;

  // The single concrete state line below the greeting. Avoids generic
  // "here's what's happening" copy — names a number when there is one.
  const stateLine = useMemo(() => {
    if (bookingsLoading) return "Loading your dashboard…";
    if (userRole === "welper") {
      if (welperSetupIncomplete) {
        return "Finish your setup below to appear in customer search.";
      }
      if (pendingForWelper > 0) {
        return `${pendingForWelper} ${pendingForWelper === 1 ? "job needs" : "jobs need"} your answer.`;
      }
      const active = bookings.filter((b) =>
        ["accepted", "in_progress"].includes(b.status),
      ).length;
      if (active > 0) {
        return `You have ${active} active ${active === 1 ? "job" : "jobs"}.`;
      }
      if (normalizedWelperSetup?.discoverable) {
        return "No active jobs right now — you're discoverable, customers will reach out.";
      }
      return "No active jobs right now — complete setup to become discoverable.";
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
    normalizedWelperSetup,
  ]);

  const customerPaymentMissing =
    userRole === "customer" && !customerProfile?.hasDefaultPaymentMethod;
  const profileIncompleteCopy = customerPaymentMissing
    ? "Add a payment method so you can book a Welper."
    : `Finish your profile — ${completion.required} of ${completion.totalRequired} steps done.`;

  const statsLoading = !!bookingsRole && bookingsLoading;
  const greetingName = firstNameOf(user?.name ?? null, user?.email);

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="6" minWidth="0">
        {/* 1. Orient — greeting + concrete state line. */}
        <Box>
          <Heading as="h1" size="7" mb="2" trim="start">
            Welcome back, {greetingName}.
          </Heading>
          <Text as="p" size="3" color="gray" highContrast>
            {stateLine}
          </Text>
        </Box>

        {welperShowSetupChecklist ? (
          <WelperSetupChecklist variant="full" />
        ) : null}

        {isProfileIncomplete && userRole === "customer" ? (
          <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface" role="status">
            <Flex
              align={{ initial: "stretch", sm: "center" }}
              justify="between"
              gap="4"
              wrap="wrap"
              direction={{ initial: "column", sm: "row" }}
            >
              <Callout.Text>{profileIncompleteCopy}</Callout.Text>
              <Button size="2" color={SEMANTIC_COLOR.warning} variant="soft" asChild>
                <Link href="/dashboard/profile">
                  Complete profile
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </Button>
            </Flex>
          </Callout.Root>
        ) : null}

        {!welperHideDashboardExtras ? (
          <>
            <QuickActions role={userRole === "welper" ? "welper" : "customer"} />

            <DashboardStats
              role={userRole === "welper" ? "welper" : "customer"}
              stats={dashboardStats ?? undefined}
              loading={statsLoading}
              footnote={statsFootnote}
            />

            <RecentActivity
              activities={activities}
              role={userRole === "welper" ? "welper" : "customer"}
              loading={statsLoading}
            />
          </>
        ) : null}
      </Flex>
    </Container>
  );
}
