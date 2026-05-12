"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState } from "react";

export interface ReferralCodeDisplayProps {
  referralCode: string;
  referralLink?: string;
  onCopy?: (code: string) => void;
  onShare?: (link: string) => void;
  loading?: boolean;
}

export function ReferralCodeDisplay({
  referralCode,
  referralLink,
  onCopy,
  onShare,
  loading,
}: ReferralCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const fullLink = referralLink || `https://welpco.com/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(referralCode);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullLink);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
    onShare?.(fullLink);
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="4" mb="1" trim="start">
            Your referral code
          </Heading>
          <Text size="2" color="gray" highContrast>
            Share your code with friends and earn rewards when they join and complete their first booking.
          </Text>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2" htmlFor="referral-code">
            Referral code
          </Text>
          <Flex gap="3" align="center" direction={{ initial: "column", sm: "row" }}>
            <TextField.Root
              id="referral-code"
              value={referralCode}
              readOnly
              size="2"
              style={{ flex: 1 }}
            />
            <Button
              color={SEMANTIC_COLOR.primary}
              size="2"
              onClick={handleCopy}
              disabled={loading}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2" htmlFor="referral-link">
            Referral link
          </Text>
          <Flex gap="3" align="center" direction={{ initial: "column", sm: "row" }}>
            <TextField.Root
              id="referral-link"
              value={fullLink}
              readOnly
              size="2"
              style={{ flex: 1 }}
            />
            <Button
              color={SEMANTIC_COLOR.primary}
              size="2"
              onClick={handleCopyLink}
              disabled={loading}
            >
              {shared ? "Copied!" : "Copy link"}
            </Button>
          </Flex>
        </Box>

        <Callout.Root color={SEMANTIC_COLOR.info} variant="surface">
          <Callout.Text>
            <Text weight="bold" mb="1">
              How it works:
            </Text>
            <Flex direction="column" gap="1" asChild>
              <ul>
                <li>• Share your code or link with friends</li>
                <li>• They sign up using your referral code</li>
                <li>• When they complete their first booking, you both earn rewards</li>
              </ul>
            </Flex>
          </Callout.Text>
        </Callout.Root>
      </Flex>
    </Card>
  );
}

