"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

export type AccountStatus = "pending" | "active" | "suspended" | "deactivated";

export interface AccountStatusDisplayProps {
  status: AccountStatus;
  emailVerified?: boolean;
  backgroundCheckStatus?: "pending" | "completed" | "not_required";
  onVerifyEmail?: () => void;
  onReactivate?: () => void;
  onContactSupport?: () => void;
}

const statusConfig: Record<
  AccountStatus,
  { label: string; color: "gray" | "blue" | "green" | "red"; description: string }
> = {
  pending: {
    label: "Pending",
    color: "blue",
    description: "Your account is pending verification. Complete email verification to activate.",
  },
  active: {
    label: "Active",
    color: "green",
    description: "Your account is active and you have full access to the platform.",
  },
  suspended: {
    label: "Suspended",
    color: "red",
    description: "Your account has been suspended. Please contact support for assistance.",
  },
  deactivated: {
    label: "Deactivated",
    color: "gray",
    description: "Your account has been deactivated. You can reactivate it at any time.",
  },
};

export function AccountStatusDisplay({
  status,
  emailVerified = false,
  backgroundCheckStatus,
  onVerifyEmail,
  onReactivate,
  onContactSupport,
}: AccountStatusDisplayProps) {
  const config = statusConfig[status];

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
        <Flex align="center" justify="between">
          <Heading size="4" mb="1" trim="start">
            Account status
          </Heading>
          <Badge color={config.color} variant="soft" size="2">
            {config.label}
          </Badge>
        </Flex>

        <Text size="2" color="gray" highContrast>
          {config.description}
        </Text>

        <Box>
          <Flex direction="column" gap="3">
            <Flex align="center" justify="between">
              <Text size="2" weight="bold">
                Email verification
              </Text>
              <Badge
                color={emailVerified ? "green" : "amber"}
                variant="soft"
                size="1"
              >
                {emailVerified ? "Verified" : "Pending"}
              </Badge>
            </Flex>

            {backgroundCheckStatus && (
              <Flex align="center" justify="between">
                <Text size="2" weight="bold">
                  Background check
                </Text>
                <Badge
                  color={
                    backgroundCheckStatus === "completed"
                      ? "green"
                      : backgroundCheckStatus === "pending"
                        ? "amber"
                        : "gray"
                  }
                  variant="soft"
                  size="1"
                >
                  {backgroundCheckStatus === "completed"
                    ? "Completed"
                    : backgroundCheckStatus === "pending"
                      ? "Pending"
                      : "Not required"}
                </Badge>
              </Flex>
            )}
          </Flex>
        </Box>

        {status === "pending" && !emailVerified && onVerifyEmail && (
          <Callout.Root color={SEMANTIC_COLOR.info} variant="surface">
            <Callout.Text>
              Please verify your email to activate your account.
            </Callout.Text>
          </Callout.Root>
        )}

        {status === "suspended" && onContactSupport && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>
              Your account has been suspended. Contact support for assistance.
            </Callout.Text>
          </Callout.Root>
        )}

        <Flex
          gap="2"
          justify="end"
          wrap="wrap"
          direction={{ initial: "column", sm: "row" }}
        >
          {status === "suspended" && onContactSupport && (
            <Button
              color={SEMANTIC_COLOR.info}
              size="2"
              onClick={onContactSupport}
              style={{ width: "100%", flex: 1, minWidth: 0 }}
            >
              Contact support
            </Button>
          )}
          {status === "pending" && !emailVerified && onVerifyEmail && (
            <Button
              color={SEMANTIC_COLOR.primary}
              size="2"
              onClick={onVerifyEmail}
              style={{ width: "100%", flex: 1, minWidth: 0 }}
            >
              Verify email
            </Button>
          )}
          {status === "deactivated" && onReactivate && (
            <Button
              color={SEMANTIC_COLOR.primary}
              size="2"
              onClick={onReactivate}
              style={{ width: "100%", flex: 1, minWidth: 0 }}
            >
              Reactivate account
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

