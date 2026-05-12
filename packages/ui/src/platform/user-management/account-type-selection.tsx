"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Link } from "@welpco/ui/link";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { User, Briefcase, Check } from "lucide-react";

export interface AccountTypeSelectionProps {
  onSelectCustomer?: () => void;
  onSelectWelper?: () => void;
  onSignIn?: () => void;
  loading?: boolean;
}

interface RoleCardProps {
  role: "customer" | "welper";
  title: string;
  description: string;
  highlights: string[];
  ctaLabel: string;
  onSelect?: () => void;
  loading?: boolean;
}

function RoleCard({
  role,
  title,
  description,
  highlights,
  ctaLabel,
  onSelect,
  loading,
}: RoleCardProps) {
  const accent = role === "welper" ? "green" : "blue";
  const Icon = role === "welper" ? Briefcase : User;

  return (
    <Card
      size="4"
      variant="surface"
      style={{
        flex: 1,
        width: "100%",
        minWidth: 0,
      }}
    >
      <Flex direction="column" gap="4" height="100%">
        {/* Icon medallion in role accent */}
        <Flex
          align="center"
          justify="center"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "9999px",
            backgroundColor: `var(--${accent}-3)`,
            color: `var(--${accent}-11)`,
          }}
        >
          <Icon size={24} aria-hidden="true" />
        </Flex>

        <Box>
          <Heading size="5" mb="1" trim="start">
            {title}
          </Heading>
          <Text size="2" color="gray" highContrast>
            {description}
          </Text>
        </Box>

        <Flex direction="column" gap="2" asChild>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {highlights.map((item) => (
              <Flex key={item} align="start" gap="2" asChild>
                <li>
                  <Box flexShrink="0" mt="1">
                    <Check
                      size={14}
                      aria-hidden="true"
                      style={{ color: `var(--${accent}-9)` }}
                    />
                  </Box>
                  <Text size="2">{item}</Text>
                </li>
              </Flex>
            ))}
          </ul>
        </Flex>

        {/* Spacer pushes CTA to bottom */}
        <Box flexGrow="1" />

        <Button
          size="3"
          color={SEMANTIC_COLOR.primary}
          disabled={loading || !onSelect}
          onClick={onSelect}
          style={{ width: "100%" }}
        >
          {ctaLabel}
        </Button>
      </Flex>
    </Card>
  );
}

/**
 * Journey fork — the first major decision a new user makes. Two equally-
 * weighted cards (Customer vs Welper) with a role accent, icon medallion,
 * and a clear CTA. Entire card uses role-accented visuals so the user can
 * scan at a glance; button stays as the single tap target (better a11y
 * than clickable-card-with-mouseenter-hacks).
 */
export function AccountTypeSelection({
  onSelectCustomer,
  onSelectWelper,
  onSignIn,
  loading,
}: AccountTypeSelectionProps) {
  return (
    <Box width="100%" style={{ maxWidth: "840px", minWidth: 0 }}>
      <Flex direction="column" gap="6" align="center">
        <Box>
          <Heading size="7" align="center" mb="2" trim="start">
            Get started
          </Heading>
          <Text size="3" color="gray" highContrast align="center" as="p">
            Choose how you want to use Welpco. You can switch later.
          </Text>
        </Box>

        <Flex
          direction={{ initial: "column", md: "row" }}
          gap="4"
          align="stretch"
          width="100%"
        >
          <RoleCard
            role="customer"
            title="I'm a Customer"
            description="Book trusted Welpers for help with cleaning, moving, repairs, and more."
            highlights={[
              "Find reliable service providers",
              "Book services on demand",
              "Manage your requests in one place",
            ]}
            ctaLabel="Continue as Customer"
            onSelect={onSelectCustomer}
            loading={loading}
          />
          <RoleCard
            role="welper"
            title="I'm a Welper"
            description="Offer your services, set your rates, and grow your business on Welpco."
            highlights={[
              "Offer your services",
              "Set your own rates",
              "Grow your service business",
            ]}
            ctaLabel="Become a Welper"
            onSelect={onSelectWelper}
            loading={loading}
          />
        </Flex>

        {onSignIn && (
          <Flex align="center" gap="2">
            <Text size="2" color="gray" highContrast>
              Already have an account?
            </Text>
            <Link
              size="2"
              weight="medium"
              onClick={(e) => {
                e.preventDefault();
                onSignIn();
              }}
              href="#"
            >
              Sign in
            </Link>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

AccountTypeSelection.displayName = "AccountTypeSelection";
