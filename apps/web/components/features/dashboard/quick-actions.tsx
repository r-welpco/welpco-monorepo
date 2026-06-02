"use client";

import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Box } from "@welpco/ui/box";
import { Grid } from "@welpco/ui/grid";
import Link from "next/link";
import {
  Search,
  Calendar,
  MessageSquare,
  ListChecks,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";
import styles from "./quick-actions.module.css";

type WelperQuickActionLabels = {
  title: string;
  viewJobs: string;
  viewJobsDescription: string;
  setAvailability: string;
  setAvailabilityDescription: string;
  openMessages: string;
  openMessagesDescription: string;
};

type CustomerQuickActionLabels = {
  title: string;
  findWelper: string;
  findWelperDescription: string;
  viewBookings: string;
  viewBookingsDescription: string;
  openMessages: string;
  openMessagesDescription: string;
};

interface QuickActionsProps {
  role: "customer" | "welper";
  welperLabels?: WelperQuickActionLabels;
  customerLabels?: CustomerQuickActionLabels;
}

interface ActionTile {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Per WEB-APP-PLAN.md Tier 4 + bible §15: top 3 actions only. The avatar menu
 * already canonicalises Profile + Settings; surfacing them again here is noise.
 *
 * Customer top-3: Find a Welper · View bookings · Open messages.
 * Welper top-3:   View jobs · Set availability · Open messages.
 *
 * No "primary" colour highlight — the leftmost tile carries primacy by
 * position, which is enough. Equal weight reinforces "these are your three
 * doors", not "here's a CTA + two also-rans".
 */
export function QuickActions({ role, welperLabels, customerLabels }: QuickActionsProps) {
  const actions: ActionTile[] =
    role === "customer"
      ? [
          {
            href: "/dashboard/search",
            label: customerLabels?.findWelper ?? "Find a Welper",
            description: customerLabels?.findWelperDescription ?? "Browse and book.",
            icon: Search,
          },
          {
            href: "/dashboard/bookings",
            label: customerLabels?.viewBookings ?? "View bookings",
            description: customerLabels?.viewBookingsDescription ?? "Upcoming and past.",
            icon: Calendar,
          },
          {
            href: "/dashboard/messages",
            label: customerLabels?.openMessages ?? "Open messages",
            description: customerLabels?.openMessagesDescription ?? "Talk to your Welpers.",
            icon: MessageSquare,
          },
        ]
      : [
          {
            href: "/dashboard/bookings",
            label: welperLabels?.viewJobs ?? "View jobs",
            description: welperLabels?.viewJobsDescription ?? "Pending and active.",
            icon: ListChecks,
          },
          {
            href: "/dashboard/profile?tab=availability",
            label: welperLabels?.setAvailability ?? "Set availability",
            description:
              welperLabels?.setAvailabilityDescription ?? "Adjust when you're available.",
            icon: CalendarClock,
          },
          {
            href: "/dashboard/messages",
            label: welperLabels?.openMessages ?? "Open messages",
            description: welperLabels?.openMessagesDescription ?? "Talk to your customers.",
            icon: MessageSquare,
          },
        ];

  const sectionTitle =
    role === "welper"
      ? (welperLabels?.title ?? "Quick actions")
      : (customerLabels?.title ?? "Quick actions");

  return (
    <Box>
      <Heading as="h2" size="5" mb="3" trim="start">
        {sectionTitle}
      </Heading>
      <Grid columns={{ initial: "1", sm: "3" }} gap="3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={styles.tileLink}
              aria-label={`${action.label}. ${action.description}`}
            >
              <Card size="3" variant="surface" className={styles.tileCard}>
                <Flex direction="column" gap="3" height="100%">
                  <Box className={styles.iconBubble} aria-hidden="true">
                    <Icon size={20} />
                  </Box>
                  <Box>
                    <Text as="div" size="3" weight="bold">
                      {action.label}
                    </Text>
                    <Text as="p" size="2" color="gray" highContrast>
                      {action.description}
                    </Text>
                  </Box>
                </Flex>
              </Card>
            </Link>
          );
        })}
      </Grid>
    </Box>
  );
}
