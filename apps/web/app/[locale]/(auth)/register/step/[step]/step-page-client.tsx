"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { localizedPath } from "@/i18n/locale-routes";
import {
  useIdentityStepLabels,
  useOptionalProfileStepLabels,
  useSelectRoleStepLabels,
  useWelperAvailabilityStepLabels,
  useWelperBackgroundCheckStepLabels,
  useWelperBioStepLabels,
  useWelperOfferingStepLabels,
  useWelperPayoutStepLabels,
  useWelperServiceAreaStepLabels,
} from "@/lib/i18n/use-auth-labels";
import { useCategoryDisplayName } from "@/lib/i18n/category-display-name";
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
  WelperAvailabilityStep,
  type WelperAvailabilityStepValues,
  WelperBioStep,
  type WelperBioStepValues,
  WelperOfferingStep,
  type WelperOfferingStepValues,
  WelperServiceAreaStep,
  type WelperServiceAreaStepValues,
  WelperBackgroundCheckStep,
  WelperPayoutStep,
  type WelperPayoutStepValues,
} from "@welpco/ui/platform/user-management";
import {
  useBackgroundCheckStatus,
  useCompleteIdentityStep,
  useCompleteOptionalProfileStep,
  useCompleteSelectRoleStep,
  useConfirmBackgroundCheckReturn,
  useCreateBackgroundCheckCheckout,
  useCompleteWelperAvailabilityStep,
  useCompleteWelperBackgroundCheckStep,
  useCompleteWelperPayoutStep,
  useCreateStripeConnectLink,
  useStripeConnectStatus,
  useSyncStripeConnect,
  useCompleteWelperBioStep,
  useCompleteWelperOfferingStep,
  useCompleteWelperServiceAreaStep,
  useSignupState,
} from "@/lib/hooks/use-signup";
import { getSignupState } from "@/lib/services/signup-service";
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
const MAX_OFFERINGS = 5;

export default function StepPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const { status, update: updateSession } = useSession();
  const isAuthenticated = status === "authenticated";
  const tPage = useTranslations("auth.register.steps.page");
  const tCommon = useTranslations("auth.common");
  const selectRoleLabels = useSelectRoleStepLabels();
  const identityLabels = useIdentityStepLabels();
  const welperBioLabels = useWelperBioStepLabels();
  const welperServiceAreaLabels = useWelperServiceAreaStepLabels();
  const welperOfferingLabels = useWelperOfferingStepLabels(MAX_OFFERINGS);
  const getCategoryDisplayName = useCategoryDisplayName();
  const welperAvailabilityLabels = useWelperAvailabilityStepLabels();
  const welperBackgroundCheckLabels = useWelperBackgroundCheckStepLabels();
  const welperPayoutLabels = useWelperPayoutStepLabels();
  const optionalProfileLabels = useOptionalProfileStepLabels();

  const queryClient = useQueryClient();
  const { data: state, isPending, isError: signupStateError, error: signupStateErr, refetch: refetchSignupState } = useSignupState();
  const stepName = stepSlugToName(slug);
  const paymentReturn = searchParams.get("payment");
  const checkoutSessionId = searchParams.get("session_id");
  const connectReturn = searchParams.get("connect");

  const completeSelectRole = useCompleteSelectRoleStep();
  const completeIdentity = useCompleteIdentityStep();
  const completeWelperBio = useCompleteWelperBioStep();
  const completeWelperServiceArea = useCompleteWelperServiceAreaStep();
  const completeWelperOffering = useCompleteWelperOfferingStep();
  const completeWelperAvailability = useCompleteWelperAvailabilityStep();
  const completeWelperBackgroundCheck = useCompleteWelperBackgroundCheckStep();
  const completeWelperPayout = useCompleteWelperPayoutStep();
  const completeOptionalProfile = useCompleteOptionalProfileStep();
  const pendingStripeReturn =
    paymentReturn === "success" && Boolean(checkoutSessionId);
  const bgCheckStatus = useBackgroundCheckStatus(
    stepName === "welperBackgroundCheck" || pendingStripeReturn,
  );
  const createBgCheckout = useCreateBackgroundCheckCheckout();
  const confirmBgReturn = useConfirmBackgroundCheckReturn();
  const stripeConnectStatus = useStripeConnectStatus(
    stepName === "welperPayout" || connectReturn !== null,
  );
  const createConnectLink = useCreateStripeConnectLink();
  const syncConnect = useSyncStripeConnect();

  // Categories are needed only for the welper-offering step, but React Query
  // caches by key so an early call is essentially free.
  const categoriesQuery = useContentCategories(false);
  const categoryOptions = useMemo(() => {
    const rows = categoriesQuery.data ?? [];
    const parents = rows.filter((c) => c.level === 1);
    const children = rows.filter((c) => c.level === 2);
    const childByParent = new Map<string, typeof rows>();
    for (const child of children) {
      if (!child.parentId) continue;
      const list = childByParent.get(child.parentId) ?? [];
      list.push(child);
      childByParent.set(child.parentId, list);
    }
    return [
      ...parents.map((p) => ({
        id: p.id,
        name: p.name,
        parentId: null as string | null,
        level: 1,
      })),
      ...parents.flatMap((p) =>
        (childByParent.get(p.id) ?? p.children ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          parentId: p.id,
          level: 2,
        })),
      ),
    ];
  }, [categoriesQuery.data]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const confirmedStripeSessionRef = useRef<string | null>(null);
  const syncedConnectReturnRef = useRef(false);
  const localeForStripe = (locale === "fr" ? "fr" : "en") as "en" | "fr";

  // Stripe success_url must land on the background-check step — never skip ahead to optional profile.
  useEffect(() => {
    if (!pendingStripeReturn || !checkoutSessionId) return;
    if (stepName === "welperBackgroundCheck") return;
    router.replace(
      `/register/step/background-check?payment=success&session_id=${encodeURIComponent(checkoutSessionId)}`,
    );
  }, [pendingStripeReturn, checkoutSessionId, stepName, router]);

  // After Stripe Checkout success, sync payment once (avoid effect loop in step UI).
  useEffect(() => {
    if (stepName !== "welperBackgroundCheck") return;
    if (!pendingStripeReturn || !checkoutSessionId) return;
    if (confirmedStripeSessionRef.current === checkoutSessionId) return;

    confirmedStripeSessionRef.current = checkoutSessionId;
    let cancelled = false;

    void (async () => {
      setSubmitError(null);
      try {
        await confirmBgReturn.mutateAsync(checkoutSessionId);
        if (!cancelled) {
          await Promise.all([bgCheckStatus.refetch(), refetchSignupState()]);
        }
      } catch (err) {
        if (!cancelled) {
          confirmedStripeSessionRef.current = null;
          setSubmitError(messageFor(err, tCommon("somethingWentWrong")));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per session_id
  }, [stepName, pendingStripeReturn, checkoutSessionId]);

  // After Stripe Connect return, refresh onboarding status once.
  useEffect(() => {
    if (stepName !== "welperPayout") return;
    if (connectReturn !== "return" && connectReturn !== "refresh") return;
    if (syncedConnectReturnRef.current) return;
    syncedConnectReturnRef.current = true;

    void (async () => {
      setSubmitError(null);
      try {
        await syncConnect.mutateAsync();
      } catch (err) {
        syncedConnectReturnRef.current = false;
        setSubmitError(messageFor(err, tCommon("somethingWentWrong")));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per return
  }, [stepName, connectReturn]);

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

  // Guard: URL slug must match the server's nextStep. Prevents skipping.
  useEffect(() => {
    if (!state || !stepName) return;
    // Wait for confirm-return before applying nextStep (avoids jumping to optional profile).
    if (pendingStripeReturn && stepName === "welperBackgroundCheck") {
      const stillSyncing =
        confirmBgReturn.isPending ||
        confirmedStripeSessionRef.current !== checkoutSessionId;
      if (stillSyncing) return;
    }
    if (state.nextStep && state.nextStep !== stepName) {
      router.replace(`/register/step/${stepNameToSlug(state.nextStep)}`);
    } else if (!state.nextStep) {
      router.replace("/register/finish");
    }
  }, [
    state,
    stepName,
    router,
    pendingStripeReturn,
    checkoutSessionId,
    confirmBgReturn.isPending,
  ]);

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
        customerRegistrationEnabled={false}
        loading={completeSelectRole.isPending}
        error={submitError ?? completeSelectRole.error?.message ?? null}
        onSubmit={(values: { role: SelectedRole }) =>
          guard(async () => {
            const next = await completeSelectRole.mutateAsync(values);
            await updateSession({ user: { role: values.role } });
            advanceTo(next.nextStep);
          })
        }
      />
    );
  }

  if (stepName === "identity") {
    return (
      <IdentityStep
        labels={identityLabels}
        termsHref={localizedPath("/legal/terms", locale)}
        privacyHref={localizedPath("/legal/privacy", locale)}
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
        labels={welperBioLabels}
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
        labels={welperServiceAreaLabels}
        state={liteState}
        loading={completeWelperServiceArea.isPending}
        error={submitError ?? completeWelperServiceArea.error?.message ?? null}
        onSubmit={(values: WelperServiceAreaStepValues) =>
          guard(async () => {
            const addr = values.serviceArea.centerAddress;
            const next = await completeWelperServiceArea.mutateAsync({
              serviceArea: {
                type: "radius",
                centerAddress: {
                  streetAddress: addr?.streetAddress,
                  city: addr?.city ?? "",
                  stateProvince: addr?.stateProvince ?? "",
                  zipPostalCode: addr?.zipPostalCode,
                  country: addr?.country,
                },
                radiusMiles: values.serviceArea.radiusMiles ?? 25,
              },
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
        labels={welperOfferingLabels}
        getCategoryDisplayName={getCategoryDisplayName}
        state={liteState}
        categories={categoryOptions}
        categoriesLoading={categoriesQuery.isLoading}
        loading={completeWelperOffering.isPending}
        error={submitError ?? completeWelperOffering.error?.message ?? null}
        onSubmit={(values: WelperOfferingStepValues) =>
          guard(async () => {
            const next = await completeWelperOffering.mutateAsync({
              offerings: values.offerings.map((o) => ({
                subcategoryId: o.subcategoryId,
                title: o.title,
                hourlyRate: o.hourlyRate,
                description: o.description,
              })),
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
        labels={welperAvailabilityLabels}
        state={liteState}
        loading={completeWelperAvailability.isPending}
        error={submitError ?? completeWelperAvailability.error?.message ?? null}
        onSubmit={(values: WelperAvailabilityStepValues) =>
          guard(async () => {
            const next = await completeWelperAvailability.mutateAsync({
              weeklySlots: values.weeklySlots,
            });
            advanceTo(next.nextStep);
          })
        }
      />
    );
  }

  if (stepName === "welperBackgroundCheck") {
    const bg = bgCheckStatus.data;
    const filledBg = liteState.filledData.welperBackgroundCheck as
      | {
          listPriceCents?: number;
          promoPriceCents?: number;
          promoEnabled?: boolean;
        }
      | undefined;
    return (
      <WelperBackgroundCheckStep
        labels={welperBackgroundCheckLabels}
        state={liteState}
        loading={
          createBgCheckout.isPending ||
          confirmBgReturn.isPending ||
          completeWelperBackgroundCheck.isPending
        }
        pricingLoading={bgCheckStatus.isPending && !filledBg}
        error={
          submitError ??
          bgCheckStatus.error?.message ??
          createBgCheckout.error?.message ??
          confirmBgReturn.error?.message ??
          completeWelperBackgroundCheck.error?.message ??
          null
        }
        listPriceCents={bg?.pricing.listPriceCents ?? filledBg?.listPriceCents}
        promoPriceCents={bg?.pricing.promoPriceCents ?? filledBg?.promoPriceCents}
        promoEnabled={bg?.pricing.promoEnabled ?? filledBg?.promoEnabled ?? true}
        paymentStatus={bg?.paymentStatus ?? null}
        failureReason={bg?.failureReason ?? null}
        signupStepComplete={bg?.signupStepComplete ?? false}
        confirmingReturn={confirmBgReturn.isPending}
        onPay={() =>
          guard(async () => {
            const { url } = await createBgCheckout.mutateAsync(localeForStripe);
            window.location.href = url;
          })
        }
        onContinue={() =>
          guard(async () => {
            const next = await completeWelperBackgroundCheck.mutateAsync();
            advanceTo(next.nextStep);
          })
        }
      />
    );
  }

  if (stepName === "welperPayout") {
    const connect = stripeConnectStatus.data;
    const filledPayout = liteState.filledData.welperPayout as
      | { stripeOnboardingCompleted?: boolean }
      | undefined;
    const onboardingComplete =
      connect?.onboardingComplete === true ||
      filledPayout?.stripeOnboardingCompleted === true;

    return (
      <WelperPayoutStep
        labels={welperPayoutLabels}
        state={liteState}
        onboardingComplete={onboardingComplete}
        connectLoading={createConnectLink.isPending || syncConnect.isPending}
        loading={completeWelperPayout.isPending}
        error={
          submitError ??
          stripeConnectStatus.error?.message ??
          createConnectLink.error?.message ??
          syncConnect.error?.message ??
          completeWelperPayout.error?.message ??
          null
        }
        onStripeOnboardingStart={() =>
          guard(async () => {
            const { url } = await createConnectLink.mutateAsync(localeForStripe);
            window.location.href = url;
          })
        }
        onSubmit={(values: WelperPayoutStepValues) =>
          guard(async () => {
            const next = await completeWelperPayout.mutateAsync(values);
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
