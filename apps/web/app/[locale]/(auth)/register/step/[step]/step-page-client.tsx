"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAppRouter } from "@/lib/i18n/use-app-router";
import { useSession } from "next-auth/react";
import { localizedPath } from "@/i18n/locale-routes";
import {
  useIdentityStepLabels,
  useOptionalProfileStepLabels,
  useSelectRoleStepLabels,
  useWelperBioStepLabels,
} from "@/lib/i18n/use-auth-labels";
import type { Locale } from "@/i18n/routing";
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
  OptionalProfileStep,
  type OptionalProfileStepValues,
  SelectRoleStep,
  type SignupStateLite,
  WelperBioStep,
  type WelperBioStepValues,
} from "@welpco/ui/platform/user-management";
import {
  useCompleteIdentityStep,
  useCompleteOptionalProfileStep,
  useCompleteSelectRoleStep,
  useCompleteWelperBioStep,
  useSignupState,
} from "@/lib/hooks/use-signup";
import { getSignupState } from "@/lib/services/signup-service";
import {
  getRegisterEscapeTarget,
  getSignupBackStep,
  isAllowedSignupStep,
  stepNameToSlug,
  stepSlugToName,
} from "../../step-name-utils";
import { WelperRegisterEscape } from "../../welper-register-escape";
import { useRegisterEdu } from "../../register-edu-context";
import { safeNextPath, withNext } from "@/lib/auth/safe-next";
import { getPresignedUrl, uploadFileToS3 } from "@/lib/services/upload-service";
import type { SelectedRole, SignupStepName } from "@welpco/types";

/**
 * Day 15 — Phase 2 Dispatch B. Dynamic step renderer with all 9 step
 * components wired (10 if you count the email-password step that owns
 * `/register` itself).
 *
 * The slug→step map covers every BFF step. The router allows the current
 * `nextStep`, earlier completed steps (Back / browser back), and redirects
 * forward if a user pastes a future step's URL.
 */
export default function StepPageClient({ slug }: { slug: string }) {
  const router = useAppRouter();
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const tPage = useTranslations("auth.register.steps.page");
  const tCommon = useTranslations("auth.common");
  const selectRoleLabels = useSelectRoleStepLabels();
  const identityLabels = useIdentityStepLabels();
  const welperBioLabels = useWelperBioStepLabels();
  const optionalProfileLabels = useOptionalProfileStepLabels();

  const queryClient = useQueryClient();
  const edu = useRegisterEdu();
  const { data: state, isPending, isError: signupStateError, error: signupStateErr, refetch: refetchSignupState } = useSignupState();
  const stepName = stepSlugToName(slug);

  const completeSelectRole = useCompleteSelectRoleStep();
  const completeIdentity = useCompleteIdentityStep();
  const completeWelperBio = useCompleteWelperBioStep();
  const completeOptionalProfile = useCompleteOptionalProfileStep();

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Photo state for the optional-profile step (customer signup only). Wires `<ProfilePhotoUpload>`
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
        err instanceof Error ? err.message : tPage("photoUploadFailed"),
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

  // Guard: allow current or earlier signup steps; redirect future/skipped URLs.
  useEffect(() => {
    if (!state || !stepName) return;
    if (getRegisterEscapeTarget(state, stepName)) return;
    if (isAllowedSignupStep(stepName, state)) return;
    if (state.nextStep) {
      router.replace(`/register/step/${stepNameToSlug(state.nextStep)}`);
    } else {
      router.replace("/register/finish");
    }
  }, [state, stepName, router]);

  // Only block on the first load. Background refetches (e.g. tab focus) must not
  // replace the step with a spinner — that unmounts react-hook-form and clears input.
  const waitingForSession = status === "loading" && !state;
  const waitingForSignupState = isAuthenticated && !state && isPending;

  if (waitingForSession || waitingForSignupState) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "40vh" }} aria-busy>
        <Spinner size="3" />
      </Flex>
    );
  }

  if (status !== "loading" && !isAuthenticated) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: "40vh" }} aria-busy>
        <Spinner size="3" />
      </Flex>
    );
  }

  if (!state) {
    if (signupStateError) {
      return (
        <ComingSoonCard
          title={tPage("loadProgressTitle")}
          message={
            signupStateErr instanceof Error
              ? signupStateErr.message
              : tPage("loadProgressMessage")
          }
          fallbackMessage={tPage("comingSoonDefault")}
        />
      );
    }
    return (
      <Flex justify="center" align="center" style={{ minHeight: "40vh" }} aria-busy>
        <Spinner size="3" />
      </Flex>
    );
  }

  const registerEscape = getRegisterEscapeTarget(state, stepName);
  if (registerEscape === "dashboard") {
    return <WelperRegisterEscape state={state} nextRaw={nextRaw} />;
  }

  if (!stepName) {
    return (
      <ComingSoonCard
        title={tPage("stepNotFoundTitle")}
        message={tPage("stepNotFoundMessage")}
        fallbackMessage={tPage("comingSoonDefault")}
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
      setSubmitError(messageFor(err, tCommon("somethingWentWrong")));
    }
  };

  // ─── Step renderers ──────────────────────────────────────────────────────

  if (stepName === "selectRole") {
    return (
      <SelectRoleStep
        labels={selectRoleLabels}
        state={liteState}
        customerRegistrationEnabled={true}
        loading={completeSelectRole.isPending}
        error={submitError ?? completeSelectRole.error?.message ?? null}
        onSelectionChange={edu?.setPreviewRole}
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
    const backStep = getSignupBackStep("identity", state.requiredSteps);
    return (
      <IdentityStep
        labels={identityLabels}
        termsHref={localizedPath("/legal/terms", locale)}
        privacyHref={localizedPath("/legal/privacy", locale)}
        state={liteState}
        loading={completeIdentity.isPending}
        error={submitError ?? completeIdentity.error?.message ?? null}
        onBack={
          backStep
            ? () => router.replace(`/register/step/${stepNameToSlug(backStep)}`)
            : undefined
        }
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
    const backStep = getSignupBackStep("welperBio", state.requiredSteps);
    return (
      <WelperBioStep
        labels={welperBioLabels}
        state={liteState}
        loading={completeWelperBio.isPending}
        error={submitError ?? completeWelperBio.error?.message ?? null}
        onBack={
          backStep
            ? () => router.replace(`/register/step/${stepNameToSlug(backStep)}`)
            : undefined
        }
        onSubmit={(values: WelperBioStepValues) =>
          guard(async () => {
            const next = await completeWelperBio.mutateAsync({ bio: values.bio });
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
        labels={optionalProfileLabels}
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
      />
    );
  }

  return (
    <ComingSoonCard
      title={stepLabel(stepName, tPage)}
      fallbackMessage={tPage("comingSoonDefault")}
    />
  );
}

function messageFor(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

function stepLabel(
  name: SignupStepName,
  t: ReturnType<typeof useTranslations<"auth.register.steps.page">>,
): string {
  const key = name === "welperBio"
    ? "labels.welperBio"
    : name === "welperServiceArea"
      ? "labels.welperServiceArea"
      : name === "welperOffering"
        ? "labels.welperOffering"
        : name === "welperAvailability"
          ? "labels.welperAvailability"
          : name === "welperBackgroundCheck"
            ? "labels.welperBackgroundCheck"
            : name === "welperPayout"
              ? "labels.welperPayout"
              : name === "optionalProfile"
              ? "labels.optionalProfile"
              : "labels.default";
  return t(key);
}

function ComingSoonCard({
  title,
  message,
  fallbackMessage,
}: {
  title: string;
  message?: string;
  fallbackMessage: string;
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
            {message ?? fallbackMessage}
          </Text>
        </Box>
      </Flex>
    </Card>
  );
}
