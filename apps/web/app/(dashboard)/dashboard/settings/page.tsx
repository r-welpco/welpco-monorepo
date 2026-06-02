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
import { useQueryClient } from "@tanstack/react-query";
import { performClientSignOut } from "@/lib/auth/client-sign-out";
import { Dialog, DialogContentRaw } from "@welpco/ui/dialog";
import { EmailUpdateForm } from "@welpco/ui/platform/user-management/email-update-form";
import { PasswordChangeForm } from "@welpco/ui/platform/user-management/password-change-form";
import { AccountDeletionForm } from "@welpco/ui/platform/user-management/account-deletion-form";
import { Trash2 } from "lucide-react";
import { CustomerPaymentSettings } from "@/components/features/payments/customer-payment-settings";
import { useBookableAction } from "@/lib/hooks/use-bookable-action";
import { EmailVerificationRequiredDialog } from "@/components/features/dashboard/email-verification-required-dialog";
import { EmailVerificationRequiredError } from "@/lib/api/client";
import {
  useDashboardSettingsFormLabels,
  useDashboardSettingsLabels,
  usePersonalizationSettingsLabels,
} from "@/lib/i18n/use-dashboard-labels";

const PersonalizationSettings = dynamic(
  () =>
    import("@/components/features/personalization/personalization-settings").then((mod) => ({
      default: mod.PersonalizationSettings,
    })),
  { ssr: false }
);

const ALL_SETTINGS_TABS = ["appearance", "account", "payment"] as const;
type SettingsTab = (typeof ALL_SETTINGS_TABS)[number];

function visibleSettingsTabs(isCustomer: boolean): SettingsTab[] {
  const tabs: SettingsTab[] = ["account", "appearance"];
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
  const settingsLabels = useDashboardSettingsLabels();
  const settingsFormLabels = useDashboardSettingsFormLabels();
  const personalizationLabels = usePersonalizationSettingsLabels();

  const emailFormLabels = {
    title: settingsFormLabels.emailTitle,
    description: settingsFormLabels.emailDescription,
    emailLabel: settingsFormLabels.emailLabel,
    emailPlaceholder: settingsFormLabels.emailPlaceholder,
    hint: settingsFormLabels.emailHint,
    submit: settingsFormLabels.emailSubmit,
    submitting: settingsFormLabels.emailSubmitting,
    validation: settingsFormLabels.emailValidation,
  };
  const passwordFormLabels = {
    title: settingsFormLabels.passwordTitle,
    description: settingsFormLabels.passwordDescription,
    currentPassword: settingsFormLabels.passwordCurrent,
    newPassword: settingsFormLabels.passwordNew,
    confirmPassword: settingsFormLabels.passwordConfirm,
    currentPasswordPlaceholder: settingsFormLabels.passwordCurrentPlaceholder,
    newPasswordPlaceholder: settingsFormLabels.passwordNewPlaceholder,
    confirmPasswordPlaceholder: settingsFormLabels.passwordConfirmPlaceholder,
    passwordStrength: settingsFormLabels.passwordStrength,
    passwordStrengthWeak: settingsFormLabels.passwordStrengthWeak,
    passwordStrengthMedium: settingsFormLabels.passwordStrengthMedium,
    passwordStrengthStrong: settingsFormLabels.passwordStrengthStrong,
    submit: settingsFormLabels.passwordSubmit,
    submitting: settingsFormLabels.passwordSubmitting,
    validation: settingsFormLabels.passwordValidation,
  };
  const accountDeletionLabels = {
    title: settingsFormLabels.deleteTitle,
    description: settingsFormLabels.deleteDescription,
    whatHappensTitle: settingsFormLabels.deleteWhatHappensTitle,
    bulletSignedOut: settingsFormLabels.deleteBulletSignedOut,
    bulletBookings: settingsFormLabels.deleteBulletBookings,
    bulletMessages: settingsFormLabels.deleteBulletMessages,
    bulletReviews: settingsFormLabels.deleteBulletReviews,
    supportNote: settingsFormLabels.deleteSupportNote,
    reasonLabel: settingsFormLabels.deleteReasonLabel,
    reasonPlaceholder: settingsFormLabels.deleteReasonPlaceholder,
    feedbackLabel: settingsFormLabels.deleteFeedbackLabel,
    feedbackPlaceholder: settingsFormLabels.deleteFeedbackPlaceholder,
    confirmLabel: settingsFormLabels.deleteConfirmLabel,
    confirmPlaceholder: settingsFormLabels.deleteConfirmPlaceholder,
    submit: settingsFormLabels.deleteSubmit,
    submitting: settingsFormLabels.deleteSubmitting,
    cancel: settingsFormLabels.deleteCancel,
    reasons: settingsFormLabels.deleteReasons,
    validation: settingsFormLabels.deleteValidation,
  };
  const allowedTabs = useMemo(
    () => visibleSettingsTabs(!!isCustomer),
    [isCustomer],
  );

  // Resolve tab from URL params synchronously — no setState-in-effect cascade.
  const tabFromQuery = searchParams.get("tab");
  const initialTab: SettingsTab =
    isSettingsTab(tabFromQuery, allowedTabs) ? tabFromQuery : "account";
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

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
      setSuccessMessage(settingsLabels.emailUpdated);
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
    setSuccessMessage(settingsLabels.passwordUpdated);
  };

  const handleDeleteAccount = async () => {
    await deleteAccountMutation.mutateAsync();
    void performClientSignOut({ callbackUrl: "/", queryClient });
  };

  if (!user) {
    return (
      <Container size="3" px={{ initial: "4", sm: "6" }}>
        <Card size="3" variant="surface">
          <Flex direction="column" align="center" gap="3" py="6" px="3">
            <Heading as="h1" size="5" align="center" trim="start">
              {settingsLabels.signInTitle}
            </Heading>
            <Text size="2" color="gray" highContrast align="center" as="p">
              {settingsLabels.signInDescription}
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
            {settingsLabels.title}
          </Heading>
          <Text as="p" size="2" color="gray" highContrast>
            {isWelper ? settingsLabels.subtitleWelper : settingsLabels.subtitle}
          </Text>
        </Box>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (isSettingsTab(value, allowedTabs)) setActiveTab(value);
          }}
        >
          <TabsList>
            <TabsTrigger value="account">{settingsLabels.tabs.account}</TabsTrigger>
            <TabsTrigger value="appearance">{settingsLabels.tabs.appearance}</TabsTrigger>
            {isCustomer ? (
              <TabsTrigger value="payment">{settingsLabels.tabs.payment}</TabsTrigger>
            ) : null}
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
                        settingsLabels.genericError}
                    </Callout.Text>
                  </Callout.Root>
                )}

                <Grid columns={{ initial: "1", lg: "2" }} gap="5">
                  <EmailUpdateForm
                    defaultEmail={user.email || ""}
                    loading={isLoading}
                    onSubmit={handleUpdateEmail}
                    labels={emailFormLabels}
                  />
                  <PasswordChangeForm
                    loading={isLoading}
                    onSubmit={handleUpdatePassword}
                    labels={passwordFormLabels}
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
                        {settingsLabels.deleteAccount}
                      </Heading>
                    </Flex>
                    <Text size="2" color="gray" highContrast>
                      {settingsLabels.deleteDescription}
                    </Text>
                    <Flex justify="end" mt="2">
                      <Button
                        size="2"
                        color={SEMANTIC_COLOR.danger}
                        variant="soft"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        {settingsLabels.deleteButton}
                      </Button>
                    </Flex>
                  </Flex>
                </Card>
              </Flex>
            </Box>
          </TabsContent>

          <TabsContent value="appearance">
            <Box pt="5">
              <PersonalizationSettings labels={personalizationLabels} />
            </Box>
          </TabsContent>

          {isCustomer ? (
            <TabsContent value="payment">
              <Box pt="5">
                <CustomerPaymentSettings
                  labels={{
                    title: settingsLabels.paymentTitle,
                    description: settingsLabels.paymentDescription,
                    ...settingsLabels.paymentMethods,
                  }}
                />
              </Box>
            </TabsContent>
          ) : null}
        </Tabs>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContentRaw maxWidth="640px">
            <AccountDeletionForm
              labels={accountDeletionLabels}
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
  const { loadingAria } = useDashboardSettingsLabels();
  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="6" aria-busy="true" aria-label={loadingAria}>
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
