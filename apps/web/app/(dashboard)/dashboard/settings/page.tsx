"use client";

import { useState, useMemo } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Container } from "@welpco/ui/container";
import { Card } from "@welpco/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@welpco/ui/tabs";
import { Callout } from "@welpco/ui/callout";
import { Button } from "@welpco/ui/button";
import { Skeleton } from "@welpco/ui/skeleton";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useAuthStore } from "@/stores/authStore";
import {
  useChangePassword,
  useUpdateEmail,
  useDeleteAccount,
} from "@/lib/hooks/use-settings";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/lib/hooks/use-notifications";
import { useWelperProfile, useUpdateWelperProfile } from "@/lib/hooks/use-profile";
import { useQueryClient } from "@tanstack/react-query";
import { performClientSignOut } from "@/lib/auth/client-sign-out";
import { Dialog, DialogContentRaw } from "@welpco/ui/dialog";
import { EmailUpdateForm } from "@welpco/ui/platform/user-management/email-update-form";
import { PasswordChangeForm } from "@welpco/ui/platform/user-management/password-change-form";
import { AccountDeletionForm } from "@welpco/ui/platform/user-management/account-deletion-form";
import { PrivacySettings } from "@welpco/ui/platform/profile-management";
import {
  NotificationPreferences,
  type NotificationPreference,
} from "@welpco/ui/platform/notification";
import { Trash2 } from "lucide-react";
import { CustomerPaymentSettings } from "@/components/features/payments/customer-payment-settings";
import { useBookableAction } from "@/lib/hooks/use-bookable-action";
import { EmailVerificationRequiredDialog } from "@/components/features/dashboard/email-verification-required-dialog";
import { EmailVerificationRequiredError } from "@/lib/api/client";

const PersonalizationSettings = dynamic(
  () =>
    import("@/components/features/personalization/personalization-settings").then((mod) => ({
      default: mod.PersonalizationSettings,
    })),
  { ssr: false }
);

const ALL_SETTINGS_TABS = [
  "appearance",
  "account",
  "privacy",
  "notifications",
  "payment",
] as const;
type SettingsTab = (typeof ALL_SETTINGS_TABS)[number];

function visibleSettingsTabs(isCustomer: boolean, isWelper: boolean): SettingsTab[] {
  const tabs: SettingsTab[] = ["account", "appearance"];
  if (!isWelper) {
    tabs.splice(1, 0, "privacy", "notifications");
  }
  if (isCustomer) {
    tabs.push("payment");
  }
  return tabs;
}

function isSettingsTab(value: string | null, allowed: readonly SettingsTab[]): value is SettingsTab {
  return value !== null && (allowed as readonly string[]).includes(value);
}

function SettingsPageContent() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  const changePasswordMutation = useChangePassword();
  const updateEmailMutation = useUpdateEmail();
  const deleteAccountMutation = useDeleteAccount();
  // Day 15 Dispatch C — bookable-action wrapper for email-change + payment
  // method writes (both BFF `EmailVerifiedGuard`-gated).
  const bookable = useBookableAction();
  const isLoading =
    changePasswordMutation.isPending ||
    updateEmailMutation.isPending ||
    deleteAccountMutation.isPending;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isCustomer = user?.role === "customer";
  const isWelper = user?.role === "welper";
  const allowedTabs = useMemo(
    () => visibleSettingsTabs(!!isCustomer, !!isWelper),
    [isCustomer, isWelper],
  );

  // Resolve tab from URL params synchronously — no setState-in-effect cascade.
  const tabFromQuery = searchParams.get("tab");
  const initialTab: SettingsTab =
    isSettingsTab(tabFromQuery, allowedTabs) ? tabFromQuery : "account";
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Welper profile (privacy fields)
  const { data: welperProfile } = useWelperProfile(user?.id ?? "", isWelper);
  const updateWelperProfileMutation = useUpdateWelperProfile();

  // Notification preferences (BFF returns one row per category with email + in-app flags)
  const { data: prefRows = [], isLoading: prefsLoading } = useNotificationPreferences();
  const updatePreferencesMutation = useUpdateNotificationPreferences();

  // Friendly category copy — the BFF stores raw names, we name them in the user's voice (bible §22).
  const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
    booking: {
      label: "Bookings",
      description: "When a booking is confirmed, rescheduled, or cancelled.",
    },
    payment: {
      label: "Payments",
      description: "Receipts, payouts, and any payment that needs your attention.",
    },
    message: {
      label: "Messages",
      description: "When someone sends you a message about a booking.",
    },
    review: {
      label: "Reviews",
      description: "When a review is posted or you have a review to leave.",
    },
    dispute: {
      label: "Problem reports",
      description: "When a problem report is filed, withdrawn, or resolved.",
    },
    security: {
      label: "Account & security",
      description: "Sign-in alerts and changes to your account.",
    },
    system: {
      label: "Welpco updates",
      description: "Occasional product news and important platform changes.",
    },
  };

  // Map BFF prefs into the platform component's flat shape (one row per channel × category).
  const flattenedPrefs = useMemo<NotificationPreference[]>(() => {
    return prefRows.flatMap((row) => {
      const meta = CATEGORY_LABELS[row.category] ?? {
        label: row.category,
        description: "",
      };
      return [
        {
          id: `${row.category}__email`,
          label: meta.label,
          description: meta.description,
          enabled: row.emailEnabled,
          category: "email" as const,
        },
        {
          id: `${row.category}__push`,
          label: meta.label,
          description: meta.description,
          enabled: row.inAppEnabled,
          category: "push" as const,
        },
      ];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefRows]);

  const handlePrefChange = (id: string, enabled: boolean) => {
    const [category, channel] = id.split("__");
    if (!category || !channel) return;
    updatePreferencesMutation.mutate([
      {
        category,
        ...(channel === "email" ? { emailEnabled: enabled } : {}),
        ...(channel === "push" ? { inAppEnabled: enabled } : {}),
      },
    ]);
  };

  // Day 15 Dispatch C — email-change is `EmailVerifiedGuard`-gated BFF-side
  // (PUT /users/me). Wrap the mutation through `useBookableAction` so an
  // unverified user gets the focused dialog with one-click resend instead of
  // a generic 403 toast.
  const handleUpdateEmail = async (values: { email: string }) => {
    setSuccessMessage(null);
    try {
      await bookable.run(() =>
        updateEmailMutation.mutateAsync({ email: values.email }),
      );
      setSuccessMessage(
        "Email updated. Sign in with the new address next time, and verify it from the verification screen so we know it’s really you."
      );
    } catch (err) {
      if (err instanceof EmailVerificationRequiredError) {
        // bookable.run already opened the dialog; swallow.
        return;
      }
      throw err;
    }
  };

  const handleUpdatePassword = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    setSuccessMessage(null);
    await changePasswordMutation.mutateAsync({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    setSuccessMessage("Password updated.");
  };

  const handleDeleteAccount = async () => {
    await deleteAccountMutation.mutateAsync();
    void performClientSignOut({ callbackUrl: "/", queryClient });
  };

  const handleProfileVisibilityChange = async (visible: boolean) => {
    if (!isWelper || !user?.id) return;
    await updateWelperProfileMutation.mutateAsync({
      userId: user.id,
      data: { profileVisibility: visible ? "Public" : "Private" },
    });
  };

  if (!user) {
    return (
      <Container size="3" px={{ initial: "4", sm: "6" }}>
        <Card size="3" variant="surface">
          <Flex direction="column" align="center" gap="3" py="6" px="3">
            <Heading as="h1" size="5" align="center" trim="start">
              Sign in to view settings
            </Heading>
            <Text size="2" color="gray" highContrast align="center" as="p">
              Your settings are private. Sign in to manage your account.
            </Text>
          </Flex>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <EmailVerificationRequiredDialog
        open={bookable.dialogOpen}
        onOpenChange={bookable.setDialogOpen}
        email={bookable.email}
        pending={bookable.resendPending}
        onResend={bookable.resend}
      />
      <Flex direction="column" gap="6">
        <Box>
          <Heading as="h1" size="7" mb="2" trim="start">
            Settings
          </Heading>
          <Text as="p" size="2" color="gray" highContrast>
            {isWelper
              ? "Manage your account and appearance."
              : "Configure your account, privacy, and notifications."}
          </Text>
        </Box>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (isSettingsTab(value, allowedTabs)) setActiveTab(value);
          }}
        >
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            {!isWelper ? <TabsTrigger value="privacy">Privacy</TabsTrigger> : null}
            {!isWelper ? (
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            ) : null}
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            {isCustomer ? <TabsTrigger value="payment">Payment</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="account">
            <Box pt="5">
              <Flex direction="column" gap="5">
                {successMessage && (
                  <Callout.Root color={SEMANTIC_COLOR.success} role="status">
                    <Callout.Text>{successMessage}</Callout.Text>
                  </Callout.Root>
                )}
                {(updateEmailMutation.error || changePasswordMutation.error) && (
                  <Callout.Root color={SEMANTIC_COLOR.danger} role="alert">
                    <Callout.Text>
                      {(updateEmailMutation.error as Error)?.message ||
                        (changePasswordMutation.error as Error)?.message ||
                        "Something went wrong. Try again in a moment."}
                    </Callout.Text>
                  </Callout.Root>
                )}

                <Grid columns={{ initial: "1", lg: "2" }} gap="5">
                  <EmailUpdateForm
                    defaultEmail={user.email || ""}
                    loading={isLoading}
                    onSubmit={handleUpdateEmail}
                  />
                  <PasswordChangeForm
                    loading={isLoading}
                    onSubmit={handleUpdatePassword}
                  />
                </Grid>

                <Card size="3" variant="surface">
                  <Flex direction="column" gap="3">
                    <Flex align="center" gap="2">
                      <Trash2
                        size={18}
                        aria-hidden="true"
                        color="var(--red-9)"
                      />
                      <Heading
                        size="5"
                        mb="0"
                        trim="start"
                        color={SEMANTIC_COLOR.danger}
                      >
                        Delete account
                      </Heading>
                    </Flex>
                    <Text size="2" color="gray" highContrast>
                      We&apos;ll deactivate your account and sign you out. Active bookings and reviews stay attached to those records. If something&apos;s wrong, we&apos;d rather hear it &mdash; let us know before you go.
                    </Text>
                    <Flex justify="end" mt="2">
                      <Button
                        size="2"
                        color={SEMANTIC_COLOR.danger}
                        variant="soft"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        Delete my account…
                      </Button>
                    </Flex>
                  </Flex>
                </Card>
              </Flex>
            </Box>
          </TabsContent>

          <TabsContent value="privacy">
            <Box pt="5">
              <Flex direction="column" gap="4">
                <PrivacySettings
                  isWelper={isWelper}
                  profileVisible={welperProfile?.profileVisibility === "Public"}
                  loading={updateWelperProfileMutation.isPending}
                  onProfileVisibilityChange={
                    isWelper ? handleProfileVisibilityChange : undefined
                  }
                />
                {!isWelper && (
                  <Text size="2" color="gray" highContrast as="p">
                    Customer profiles aren&apos;t shown to Welpers, so there&apos;s nothing else to manage here yet. As we add reviews and ratings, you&apos;ll be able to choose what appears publicly.
                  </Text>
                )}
              </Flex>
            </Box>
          </TabsContent>

          <TabsContent value="notifications">
            <Box pt="5">
              {prefsLoading ? (
                <Card size="3" variant="surface">
                  <Flex direction="column" gap="3" aria-busy="true" aria-live="polite">
                    <Skeleton height="20px" width="40%" />
                    <Skeleton height="48px" />
                    <Skeleton height="48px" />
                    <Skeleton height="48px" />
                  </Flex>
                </Card>
              ) : (
                <NotificationPreferences
                  preferences={flattenedPrefs}
                  loading={updatePreferencesMutation.isPending}
                  onPreferenceChange={handlePrefChange}
                />
              )}
            </Box>
          </TabsContent>

          <TabsContent value="appearance">
            <Box pt="5">
              <PersonalizationSettings />
            </Box>
          </TabsContent>

          {isCustomer ? (
            <TabsContent value="payment">
              <Box pt="5">
                <CustomerPaymentSettings />
              </Box>
            </TabsContent>
          ) : null}
        </Tabs>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContentRaw maxWidth="640px">
            <AccountDeletionForm
              loading={isLoading}
              onSubmit={async () => {
                await handleDeleteAccount();
                setShowDeleteDialog(false);
              }}
              onCancel={() => setShowDeleteDialog(false)}
            />
          </DialogContentRaw>
        </Dialog>
      </Flex>
    </Container>
  );
}

function SettingsPageFallback() {
  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="6" aria-busy="true" aria-label="Loading settings">
        <Box>
          <Skeleton height="32px" width="160px" mb="2" />
          <Skeleton height="16px" width="280px" />
        </Box>
        <Skeleton height="320px" />
      </Flex>
    </Container>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageFallback />}>
      <SettingsPageContent />
    </Suspense>
  );
}
