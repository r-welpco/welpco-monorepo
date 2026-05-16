"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Box } from "@welpco/ui/box";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Spinner } from "@welpco/ui/spinner";
import { Text } from "@welpco/ui/text";
import { FORM_SPACING } from "@welpco/ui/tokens";
import {
  IdentityStep,
  type IdentityStepSubmitValues,
  NotificationPrefsStep,
  type NotificationPrefsStepValues,
  OptionalProfileStep,
  type OptionalProfileStepValues,
  SelectRoleStep,
  type SignupStateLite,
  WelperAvailabilityStep,
  type WelperAvailabilityStepValues,
  WelperBioStep,
  type WelperBioStepValues,
  WelperOfferingStep,
  type WelperOfferingStepValues,
  WelperServiceAreaStep,
  type WelperServiceAreaStepValues,
} from "@welpco/ui/platform/user-management";
import {
  useCompleteIdentityStep,
  useCompleteNotificationPrefsStep,
  useCompleteOptionalProfileStep,
  useCompleteSelectRoleStep,
  useCompleteWelperAvailabilityStep,
  useCompleteWelperBioStep,
  useCompleteWelperOfferingStep,
  useCompleteWelperServiceAreaStep,
  useSignupState,
} from "@/lib/hooks/use-signup";
import { useContentCategories } from "@/lib/hooks/use-content";
import { stepNameToSlug, stepSlugToName } from "../../step-name-utils";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";
import { getPresignedUrl, uploadFileToS3 } from "@/lib/services/upload-service";
import type { SelectedRole, SignupStepName } from "@welpco/types";

/**
 * Day 15 — Phase 2 Dispatch B. Dynamic step renderer with all 9 step
 * components wired (10 if you count the email-password step that owns
 * `/register` itself).
 *
 * The slug→step map covers every BFF step. The router still validates that
 * the URL slug matches the server's `nextStep` and redirects forward if a
 * user pastes a future step's URL.
 */
export default function StepPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const { data: state, isFetching } = useSignupState();
  const completeSelectRole = useCompleteSelectRoleStep();
  const completeIdentity = useCompleteIdentityStep();
  const completeWelperBio = useCompleteWelperBioStep();
  const completeWelperServiceArea = useCompleteWelperServiceAreaStep();
  const completeWelperOffering = useCompleteWelperOfferingStep();
  const completeWelperAvailability = useCompleteWelperAvailabilityStep();
  const completeNotificationPrefs = useCompleteNotificationPrefsStep();
  const completeOptionalProfile = useCompleteOptionalProfileStep();

  const stepName = stepSlugToName(slug);

  // Categories are needed only for the welper-offering step, but React Query
  // caches by key so an early call is essentially free.
  const categoriesQuery = useContentCategories(false);
  const categoryOptions = useMemo(
    () =>
      (categoriesQuery.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
      })),
    [categoriesQuery.data],
  );

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Photo state for the optional-profile step. Wires `<ProfilePhotoUpload>`
  // through the existing presigned-S3 upload service (the same one the
  // dashboard profile page uses). Without this wiring, the picker fired
  // `onUpload` against undefined and the photo silently never reached S3 —
  // user clicked "Finish signup" with photoUrl: undefined.
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const handleUploadPhoto = async (file: File) => {
    setUploadingPhoto(true);
    setSubmitError(null);
    try {
      const { uploadUrl, publicUrl } = await getPresignedUrl(file.name, file.type);
      await uploadFileToS3(uploadUrl, file);
      setPhotoUrl(publicUrl);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "We couldn't upload that photo. Try again, or skip and add it from your profile later.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };
  const handleRemovePhoto = () => {
    setPhotoUrl(null);
  };

  // Bounce to login if not authenticated. Phase 3's middleware will catch
  // this earlier; the client-side guard keeps the flow honest in the meantime.
  useEffect(() => {
    if (status === "loading") return;
    if (!isAuthenticated) {
      router.replace(withNext("/login", nextRaw));
    }
  }, [status, isAuthenticated, router, nextRaw]);

  // If signup is already done, send the user where they were headed.
  useEffect(() => {
    if (!state) return;
    if (state.signupCompleted) {
      router.replace(safeNextPath(nextRaw, "/dashboard"));
    }
  }, [state, router, nextRaw]);

  // Guard: URL slug must match the server's nextStep. Prevents skipping.
  useEffect(() => {
    if (!state || !stepName) return;
    if (state.nextStep && state.nextStep !== stepName) {
      router.replace(`/register/step/${stepNameToSlug(state.nextStep)}`);
    } else if (!state.nextStep) {
      // All required steps complete — finalize.
      router.replace("/register/finish");
    }
  }, [state, stepName, router]);

  if (!isAuthenticated || !state || isFetching) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "40vh" }} aria-busy>
        <Spinner size="3" />
      </Flex>
    );
  }

  if (!stepName) {
    return (
      <ComingSoonCard
        title="Step not found"
        message="That URL doesn't match a wizard step. Head back to where you left off."
      />
    );
  }

  const liteState = state as unknown as SignupStateLite;
  const role: SelectedRole = state.selectedRole ?? "customer";

  const advanceTo = (next: SignupStepName | null) => {
    if (!next) {
      router.replace("/register/finish");
    } else {
      router.replace(`/register/step/${stepNameToSlug(next)}`);
    }
  };

  const guard = async <T,>(run: () => Promise<T>) => {
    setSubmitError(null);
    try {
      await run();
    } catch (err) {
      setSubmitError(messageFor(err));
    }
  };

  // ─── Step renderers ──────────────────────────────────────────────────────

  if (stepName === "selectRole") {
    return (
      <SelectRoleStep
        state={liteState}
        customerRegistrationEnabled={false}
        loading={completeSelectRole.isPending}
        error={submitError ?? completeSelectRole.error?.message ?? null}
        onSubmit={(values: { role: SelectedRole }) =>
          guard(async () => {
            const next = await completeSelectRole.mutateAsync(values);
            advanceTo(next.nextStep);
          })
        }
      />
    );
  }

  if (stepName === "identity") {
    return (
      <IdentityStep
        state={liteState}
        loading={completeIdentity.isPending}
        error={submitError ?? completeIdentity.error?.message ?? null}
        onSubmit={(values: IdentityStepSubmitValues) =>
          guard(async () => {
            const next = await completeIdentity.mutateAsync({
              firstName: values.firstName,
              lastName: values.lastName,
              phone: values.phone,
              dateOfBirth: values.dateOfBirth,
              tosAcceptedAt: values.tosAcceptedAt,
              privacyAcceptedAt: values.privacyAcceptedAt,
            });
            advanceTo(next.nextStep);
          })
        }
      />
    );
  }

  if (stepName === "welperBio") {
    return (
      <WelperBioStep
        state={liteState}
        loading={completeWelperBio.isPending}
        error={submitError ?? completeWelperBio.error?.message ?? null}
        onSubmit={(values: WelperBioStepValues) =>
          guard(async () => {
            const next = await completeWelperBio.mutateAsync({ bio: values.bio });
            advanceTo(next.nextStep);
          })
        }
      />
    );
  }

  if (stepName === "welperServiceArea") {
    return (
      <WelperServiceAreaStep
        state={liteState}
        loading={completeWelperServiceArea.isPending}
        error={submitError ?? completeWelperServiceArea.error?.message ?? null}
        onSubmit={(values: WelperServiceAreaStepValues) =>
          guard(async () => {
            const next = await completeWelperServiceArea.mutateAsync({
              city: values.city,
              province: values.province,
              country: values.country,
              postalCodes: values.postalCodes,
            });
            advanceTo(next.nextStep);
          })
        }
      />
    );
  }

  if (stepName === "welperOffering") {
    return (
      <WelperOfferingStep
        state={liteState}
        categories={categoryOptions}
        categoriesLoading={categoriesQuery.isLoading}
        loading={completeWelperOffering.isPending}
        error={submitError ?? completeWelperOffering.error?.message ?? null}
        onSubmit={(values: WelperOfferingStepValues) =>
          guard(async () => {
            const next = await completeWelperOffering.mutateAsync({
              categoryId: values.categoryId,
              title: values.title,
              hourlyRate: values.hourlyRate,
              description: values.description,
            });
            advanceTo(next.nextStep);
          })
        }
      />
    );
  }

  if (stepName === "welperAvailability") {
    return (
      <WelperAvailabilityStep
        state={liteState}
        loading={completeWelperAvailability.isPending}
        error={submitError ?? completeWelperAvailability.error?.message ?? null}
        onSubmit={(values: WelperAvailabilityStepValues) =>
          guard(async () => {
            const payload = values.acceptsAdHocOnly
              ? { acceptsAdHocOnly: true as const }
              : { weeklySlots: values.weeklySlots };
            const next = await completeWelperAvailability.mutateAsync(payload);
            advanceTo(next.nextStep);
          })
        }
      />
    );
  }

  if (stepName === "notificationPrefs") {
    return (
      <NotificationPrefsStep
        state={liteState}
        loading={completeNotificationPrefs.isPending}
        error={submitError ?? completeNotificationPrefs.error?.message ?? null}
        onSubmit={(values: NotificationPrefsStepValues) =>
          guard(async () => {
            const next = await completeNotificationPrefs.mutateAsync({
              preferences: values.preferences.map((p) => ({
                category: p.category,
                emailEnabled: p.emailEnabled,
                inAppEnabled: p.inAppEnabled,
              })),
            });
            advanceTo(next.nextStep);
          })
        }
      />
    );
  }

  if (stepName === "optionalProfile") {
    // Resume the photo URL from server state if the user already uploaded
    // one (e.g. after a drop-and-resume mid-wizard). Local `photoUrl` state
    // overrides — that's the just-uploaded one.
    const filledPhotoUrl =
      (liteState.filledData.optionalProfile as { photoUrl?: string } | undefined)
        ?.photoUrl ?? null;
    const effectivePhotoUrl = photoUrl ?? filledPhotoUrl;

    return (
      <OptionalProfileStep
        state={liteState}
        role={role}
        loading={completeOptionalProfile.isPending}
        error={submitError ?? completeOptionalProfile.error?.message ?? null}
        defaultPhotoUrl={effectivePhotoUrl}
        uploadingPhoto={uploadingPhoto}
        onUploadPhoto={handleUploadPhoto}
        onRemovePhoto={handleRemovePhoto}
        onSubmit={(values: OptionalProfileStepValues) =>
          guard(async () => {
            const next = await completeOptionalProfile.mutateAsync({
              // The form composes `defaultPhotoUrl` into `values.photoUrl` on
              // submit, but we ALSO fall back to `effectivePhotoUrl` so a
              // photo uploaded just before submit isn't dropped if state
              // sync hasn't completed.
              photoUrl: values.photoUrl ?? effectivePhotoUrl ?? undefined,
              address: values.address,
            });
            advanceTo(next.nextStep);
          })
        }
        onSkip={() =>
          guard(async () => {
            const next = await completeOptionalProfile.mutateAsync({
              skipped: true,
            });
            advanceTo(next.nextStep);
          })
        }
      />
    );
  }

  return <ComingSoonCard title={stepLabel(stepName)} />;
}

function messageFor(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong. Try again in a moment.";
}

function stepLabel(name: SignupStepName): string {
  switch (name) {
    case "welperBio":
      return "Tell people about yourself";
    case "welperServiceArea":
      return "Where do you work?";
    case "welperOffering":
      return "Add your first service";
    case "welperAvailability":
      return "When are you available?";
    case "notificationPrefs":
      return "Notification preferences";
    case "optionalProfile":
      return "Finish your profile";
    default:
      return "Next step";
  }
}

function ComingSoonCard({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "560px", minWidth: 0 }}
    >
      <Flex direction="column" gap="3">
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {title}
          </Heading>
          <Text size="2" color="gray">
            {message ??
              "We're putting the finishing touches on this step. Your progress is saved — sign out and check back shortly, or stay tuned and refresh in a few."}
          </Text>
        </Box>
      </Flex>
    </Card>
  );
}
