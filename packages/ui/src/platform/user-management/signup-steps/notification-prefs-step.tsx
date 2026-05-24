"use client";

import { useState } from "react";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Switch } from "@welpco/ui/switch";
import { Separator } from "@welpco/ui/separator";
import { Text } from "@welpco/ui/text";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { SIGNUP_STEP_CARD_STYLE, signupStepNavButtonStyle, type SignupStateLite } from "./types";

/**
 * Day 15 — Phase 2 Dispatch B. Both-roles step 8.
 *
 * Notification preferences. The platform `<NotificationPreferences>` primitive
 * renders email × in-app columns per category, but expects already-flattened
 * preference rows. The wizard step ships a focused matrix per category with
 * sane defaults pre-checked (per Wave 3, SMS is hidden until SMS ships).
 *
 * Server defaults are already opt-in for everything; an empty submission keeps
 * those defaults. We submit the full set anyway so users have full control on
 * day one.
 */

const CATEGORIES: ReadonlyArray<{
  id: string;
  label: string;
  description: string;
}> = [
  {
    id: "booking",
    label: "Bookings",
    description:
      "Requests, confirmations, schedule changes, cancellations.",
  },
  {
    id: "payment",
    label: "Payments",
    description: "Receipts, payouts, refunds.",
  },
  {
    id: "review",
    label: "Reviews",
    description: "When someone leaves you a review or replies.",
  },
  {
    id: "security",
    label: "Account & security",
    description: "Sign-in alerts and account changes. We strongly recommend keeping these on.",
  },
  {
    id: "system",
    label: "Product news",
    description: "Occasional updates about new Welpco features.",
  },
];

export interface NotificationPrefsItem {
  category: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

export interface NotificationPrefsStepValues {
  preferences: NotificationPrefsItem[];
}

export interface NotificationPrefsStepProps {
  state: SignupStateLite;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: NotificationPrefsStepValues) => void | Promise<void>;
  onBack?: () => void;
}

export function NotificationPrefsStep({
  state,
  loading,
  error,
  onSubmit,
  onBack,
}: NotificationPrefsStepProps) {
  const filled = state.filledData.notificationPrefs as
    | { preferences?: NotificationPrefsItem[] }
    | undefined;

  const initial = (() => {
    const filledByCat = new Map<string, NotificationPrefsItem>();
    for (const p of filled?.preferences ?? []) {
      filledByCat.set(p.category, p);
    }
    return CATEGORIES.map((c) => ({
      category: c.id,
      emailEnabled: filledByCat.get(c.id)?.emailEnabled ?? true,
      inAppEnabled: filledByCat.get(c.id)?.inAppEnabled ?? true,
    }));
  })();

  const [prefs, setPrefs] = useState<NotificationPrefsItem[]>(initial);

  const togglePref = (
    category: string,
    channel: "emailEnabled" | "inAppEnabled",
    value: boolean,
  ) => {
    setPrefs((prev) =>
      prev.map((p) => (p.category === category ? { ...p, [channel]: value } : p)),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({ preferences: prefs });
  };

  const navButtonStyle = signupStepNavButtonStyle(Boolean(onBack));

  return (
    <Card
      size="4"
      variant="surface"
      style={SIGNUP_STEP_CARD_STYLE}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            How should we reach you?
          </Heading>
          <Text size="2" color="gray">
            We&apos;ll only message you about things that matter. You can
            change any of this from your settings later.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Flex direction="column" gap="4">
            {CATEGORIES.map((cat, idx) => {
              const pref =
                prefs.find((p) => p.category === cat.id) ?? {
                  category: cat.id,
                  emailEnabled: true,
                  inAppEnabled: true,
                };
              return (
                <Box key={cat.id}>
                  {idx > 0 && <Separator size="4" mb="3" />}
                  <Flex justify="between" align="start" gap="3" wrap="wrap">
                    <Box style={{ flex: 1, minWidth: "200px" }}>
                      <Text size="2" weight="bold" id={`pref-${cat.id}-label`}>
                        {cat.label}
                      </Text>
                      <Text size="1" color="gray" as="div" mt="1">
                        {cat.description}
                      </Text>
                    </Box>
                    <Flex direction="column" gap="2" align="end">
                      <Flex align="center" gap="2">
                        <Text size="1" color="gray">
                          Email
                        </Text>
                        <Switch
                          aria-labelledby={`pref-${cat.id}-label`}
                          aria-label={`${cat.label} email`}
                          checked={pref.emailEnabled}
                          onCheckedChange={(c) =>
                            togglePref(cat.id, "emailEnabled", Boolean(c))
                          }
                          disabled={loading}
                          size="2"
                        />
                      </Flex>
                      <Flex align="center" gap="2">
                        <Text size="1" color="gray">
                          In-app
                        </Text>
                        <Switch
                          aria-labelledby={`pref-${cat.id}-label`}
                          aria-label={`${cat.label} in-app`}
                          checked={pref.inAppEnabled}
                          onCheckedChange={(c) =>
                            togglePref(cat.id, "inAppEnabled", Boolean(c))
                          }
                          disabled={loading}
                          size="2"
                        />
                      </Flex>
                    </Flex>
                  </Flex>
                </Box>
              );
            })}
          </Flex>

          <Flex
            direction={{ initial: "column", sm: "row-reverse" }}
            gap="3"
            mt={FORM_SPACING.submitGap}
            style={{ width: "100%" }}
          >
            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading}
              style={navButtonStyle}
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
            {onBack && (
              <Button
                type="button"
                size="3"
                variant="soft"
                color="gray"
                disabled={loading}
                onClick={onBack}
                style={navButtonStyle}
              >
                Back
              </Button>
            )}
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
