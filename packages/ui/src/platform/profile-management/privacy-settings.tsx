"use client";

import { Card } from "@welpco/ui/card";
import { Switch } from "@welpco/ui/switch";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Separator } from "@welpco/ui/separator";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export interface PrivacySettingsProps {
  /** Welper-only: whether the welper's profile appears in customer search. */
  profileVisible?: boolean;
  loading?: boolean;
  /** Welper-only: whether to render the visibility toggle. */
  isWelper?: boolean;
  onProfileVisibilityChange?: (visible: boolean) => void | Promise<void>;
}

interface PrivacyRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  loading?: boolean;
  onCheckedChange?: (checked: boolean) => void | Promise<void>;
  icon?: React.ReactNode;
}

function PrivacyRow({
  id,
  label,
  description,
  checked,
  loading,
  onCheckedChange,
  icon,
}: PrivacyRowProps) {
  const labelId = `${id}-label`;
  return (
    <Flex align="center" justify="between" gap="3">
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Flex align="center" gap="2" mb="1">
          {icon}
          <Text size="2" weight="medium" id={labelId}>
            {label}
          </Text>
        </Flex>
        <Text size="1" color="gray" highContrast>
          {description}
        </Text>
      </Box>
      <Switch
        aria-labelledby={labelId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={loading}
      />
    </Flex>
  );
}

/**
 * Privacy controls. Welpers can toggle profile-search visibility (e.g. for a
 * vacation pause); contact-info exposure is NOT user-controllable — by policy,
 * email and phone are never shown to other Welpco users so every conversation
 * stays in our chat (gives each booking a record, makes trust + dispute
 * systems work). The explainer Callout makes this policy visible.
 */
export function PrivacySettings({
  profileVisible = false,
  loading,
  isWelper = false,
  onProfileVisibilityChange,
}: PrivacySettingsProps) {
  return (
    <Card
      size="3"
      variant="surface"
      style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      <Flex direction="column" gap="3">
        <Heading size="4" mb="0" trim="start">
          Privacy
        </Heading>
        <Separator />
        <Flex direction="column" gap="3">
          {isWelper && (
            <PrivacyRow
              id="profile-visibility"
              label="Profile visibility"
              description="Make your profile visible to customers"
              checked={profileVisible}
              loading={loading}
              onCheckedChange={onProfileVisibilityChange}
              icon={
                profileVisible ? (
                  <Eye
                    size={16}
                    aria-hidden="true"
                    style={{ color: "var(--green-9)" }}
                  />
                ) : (
                  <EyeOff
                    size={16}
                    aria-hidden="true"
                    style={{ color: "var(--gray-9)" }}
                  />
                )
              }
            />
          )}
          <Callout.Root color={SEMANTIC_COLOR.info} variant="surface">
            <Callout.Icon>
              <ShieldCheck size={16} aria-hidden="true" />
            </Callout.Icon>
            <Callout.Text>
              Your email and phone are never shown to other people on Welpco.
              Every conversation happens in our chat — that gives each booking
              a record and keeps our trust and dispute systems working.
            </Callout.Text>
          </Callout.Root>
        </Flex>
      </Flex>
    </Card>
  );
}

PrivacySettings.displayName = "PrivacySettings";
