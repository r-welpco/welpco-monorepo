"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableColumnHeaderCell,
  TableCell,
} from "@welpco/ui/table";

export interface ReferralAnalyticsProps {
  totalReferrals?: number;
  completedReferrals?: number;
  pendingReferrals?: number;
  rewardsEarned?: string;
  referralHistory?: Array<{
    id: string;
    refereeEmail: string;
    status: "pending" | "completed" | "rewarded";
    date: string;
    reward?: string;
  }>;
  loading?: boolean;
}

const statusConfig: Record<
  "pending" | "completed" | "rewarded",
  { label: string; color: "gray" | "blue" | "green" }
> = {
  pending: { label: "Pending", color: "blue" },
  completed: { label: "Completed", color: "green" },
  rewarded: { label: "Rewarded", color: "green" },
};

export function ReferralAnalytics({
  totalReferrals = 0,
  completedReferrals = 0,
  pendingReferrals = 0,
  rewardsEarned = "$0.00",
  referralHistory = [],
  loading,
}: ReferralAnalyticsProps) {
  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "800px", minWidth: 0 }}
    >
      <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="4" mb="1" trim="start">
            Referral analytics
          </Heading>
          <Text size="2" color="gray" highContrast>
            Track your referrals and rewards.
          </Text>
        </Box>

        <Flex
          direction={{ initial: "column", md: "row" }}
          gap="4"
          width="100%"
        >
          <Card size="3" variant="surface" style={{ flex: 1, minWidth: 0 }}>
            <Flex direction="column" gap="2">
              <Text size="2" color="gray" highContrast>
                Total referrals
              </Text>
              <Heading size="7">{totalReferrals}</Heading>
            </Flex>
          </Card>

          <Card size="3" variant="surface" style={{ flex: 1, minWidth: 0 }}>
            <Flex direction="column" gap="2">
              <Text size="2" color="gray" highContrast>
                Completed
              </Text>
              <Heading size="7" color={SEMANTIC_COLOR.success}>
                {completedReferrals}
              </Heading>
            </Flex>
          </Card>

          <Card size="3" variant="surface" style={{ flex: 1, minWidth: 0 }}>
            <Flex direction="column" gap="2">
              <Text size="2" color="gray" highContrast>
                Pending
              </Text>
              <Heading size="7" color={SEMANTIC_COLOR.info}>
                {pendingReferrals}
              </Heading>
            </Flex>
          </Card>

          <Card size="3" variant="surface" style={{ flex: 1, minWidth: 0 }}>
            <Flex direction="column" gap="2">
              <Text size="2" color="gray" highContrast>
                Rewards earned
              </Text>
              <Heading size="7" color={SEMANTIC_COLOR.success}>
                {rewardsEarned}
              </Heading>
            </Flex>
          </Card>
        </Flex>

        {referralHistory.length > 0 && (
          <Box>
            <Heading size="5" trim="start" mb="3">
              Referral history
            </Heading>
            {/* Desktop table (md+) */}
            <Box display={{ initial: "none", md: "block" }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableColumnHeaderCell>Email</TableColumnHeaderCell>
                    <TableColumnHeaderCell>Status</TableColumnHeaderCell>
                    <TableColumnHeaderCell>Date</TableColumnHeaderCell>
                    <TableColumnHeaderCell>Reward</TableColumnHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralHistory.map((referral) => {
                    const status = statusConfig[referral.status];
                    return (
                      <TableRow key={referral.id}>
                        <TableCell>
                          <Text size="2">{referral.refereeEmail}</Text>
                        </TableCell>
                        <TableCell>
                          <Badge color={status.color} variant="soft" size="1">
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Text size="2" color="gray">
                            {referral.date}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Text size="2" color="gray">
                            {referral.reward || "-"}
                          </Text>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            {/* Mobile card list (<md) */}
            <Box display={{ initial: "block", md: "none" }} asChild>
              <Flex direction="column" gap="3">
                {referralHistory.map((referral) => {
                  const status = statusConfig[referral.status];
                  return (
                    <Card key={referral.id} size="2">
                      <Flex direction="column" gap="2">
                        <Flex justify="between" align="center" gap="3">
                          <Text size="1" color="gray">
                            Email
                          </Text>
                          <Text size="2" weight="medium">
                            {referral.refereeEmail}
                          </Text>
                        </Flex>
                        <Flex justify="between" align="center" gap="3">
                          <Text size="1" color="gray">
                            Status
                          </Text>
                          <Badge color={status.color} variant="soft" size="1">
                            {status.label}
                          </Badge>
                        </Flex>
                        <Flex justify="between" align="center" gap="3">
                          <Text size="1" color="gray">
                            Date
                          </Text>
                          <Text size="2">{referral.date}</Text>
                        </Flex>
                        <Flex justify="between" align="center" gap="3">
                          <Text size="1" color="gray">
                            Reward
                          </Text>
                          <Text size="2">{referral.reward || "-"}</Text>
                        </Flex>
                      </Flex>
                    </Card>
                  );
                })}
              </Flex>
            </Box>
          </Box>
        )}

        {referralHistory.length === 0 && !loading && (
          <Box p="6">
            <Text size="2" color="gray" align="center" highContrast as="div">
              No referrals yet. Start sharing your referral code!
            </Text>
          </Box>
        )}
      </Flex>
    </Card>
  );
}

