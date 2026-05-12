"use client";

import { useMemo } from "react";
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
import { useDashboardUser } from "@/lib/hooks/use-dashboard-user";
import {
  useCustomerProfile,
  useWelperProfile,
  useFavoriteWelpers,
  useServiceOfferings,
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

  const userRole = user?.role || "customer";
  const bookingsRole =
    userRole === "customer" ? "customer" : userRole === "welper" ? "welper" : null;

  const {
    data: bookingsResponse,
    isLoading: bookingsLoading,
  } = useBookings(
    { page: 1, limit: BOOKINGS_DASHBOARD_LIMIT, role: bookingsRole ?? "customer" },
    { enabled: !!bookingsRole },
  );

  const { data: customerProfile, isSuccess: customerProfileLoaded } = useCustomerProfile(
    user.id,
    userRole === "customer",
  );
  const { data: welperProfile } = useWelperProfile(user.id, userRole === "welper");
  const { data: favoriteWelpers = [] } = useFavoriteWelpers(user.id);
  const { data: serviceOfferings = [] } = useServiceOfferings(user.id);

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
    if (userRole === "customer") {
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
    }
    const steps = [
      { id: "bio", completed: !!welperProfile?.bio, required: true },
      { id: "photo", completed: !!welperProfile?.photoUrl, required: false },
      { id: "serviceArea", completed: !!welperProfile?.serviceArea, required: true },
      { id: "offerings", completed: serviceOfferings.length > 0, required: true },
    ];
    const required = steps.filter((s) => s.required && s.completed).length;
    const totalRequired = steps.filter((s) => s.required).length;
    return { required, totalRequired };
  }, [userRole, customerProfile, welperProfile, favoriteWelpers, serviceOfferings]);

  const isProfileIncomplete =
    userRole === "customer"
      ? !!(
          customerProfileLoaded &&
          customerProfile &&
          customerProfile.profileCompletionStatusLabel !== "Complete"
        )
      : completion.required < completion.totalRequired;

  // The single concrete state line below the greeting. Avoids generic
  // "here's what's happening" copy — names a number when there is one.
  const stateLine = useMemo(() => {
    if (bookingsLoading) return "Loading your dashboard…";
    if (userRole === "welper") {
      if (pendingForWelper > 0) {
        return `${pendingForWelper} ${pendingForWelper === 1 ? "job needs" : "jobs need"} your answer.`;
      }
      const active = bookings.filter((b) =>
        ["accepted", "in_progress"].includes(b.status),
      ).length;
      if (active > 0) {
        return `You have ${active} active ${active === 1 ? "job" : "jobs"}.`;
      }
      return "No active jobs right now — you're discoverable, customers will reach out.";
    }
    if (upcomingCount > 0) {
      return `You have ${upcomingCount} upcoming ${upcomingCount === 1 ? "booking" : "bookings"}.`;
    }
    return "No upcoming bookings — find a Welper to get started.";
  }, [bookingsLoading, userRole, upcomingCount, pendingForWelper, bookings]);

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

        {/* 2. Attend — anything actionable, stacked. Today this is just the
             profile-completion callout (and welper-side pending bookings is
             surfaced via the state line above; richer attention items are
             follow-ups blocked on the BFF). */}
        {isProfileIncomplete && (
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
        )}

        {/* 3. Quick actions — 3 tiles, equal weight, position carries primacy. */}
        <QuickActions role={userRole === "welper" ? "welper" : "customer"} />

        {/* 4. Stats — read after the user knows what to do. */}
        <DashboardStats
          role={userRole === "welper" ? "welper" : "customer"}
          stats={dashboardStats ?? undefined}
          loading={statsLoading}
          footnote={statsFootnote}
        />

        {/* 5. Recent activity — secondary, full-width at the bottom. */}
        <RecentActivity
          activities={activities}
          role={userRole === "welper" ? "welper" : "customer"}
          loading={statsLoading}
        />
      </Flex>
    </Container>
  );
}
