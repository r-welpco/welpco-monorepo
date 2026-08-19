"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Container } from "@welpco/ui/container";
import { Button } from "@welpco/ui/button";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Avatar } from "@welpco/ui/avatar";
import { Card } from "@welpco/ui/card";
import { Callout } from "@welpco/ui/callout";
import { Skeleton } from "@welpco/ui/skeleton";
import { Grid } from "@welpco/ui/grid";
import { Separator } from "@welpco/ui/separator";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { CustomerHeader } from "@welpco/ui/platform/layout";
import { ServiceOfferingCard, ReviewList, VerifiedTrustBadge } from "@welpco/ui/platform";
import { BriefcaseBusiness, Star, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePublicWelperProfile } from "@/lib/hooks/use-service-discovery";
import { apiClient } from "@/lib/api/client";
import { publicWelperDisplayName } from "@/lib/display-name";
import { useWelperReviews } from "@/lib/hooks/use-booking-review";
import { useCategoryDisplayName } from "@/lib/i18n/category-display-name";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";
import { localizedPath } from "@/i18n/locale-routes";
import type { Locale } from "@/i18n/routing";
import { PublicSiteFooter } from "@/components/layout/public-site-footer";
import { useIsAuthenticated } from "@/stores/authStore";
import type { PublicPortfolioPhoto, PublicWelperProfile } from "@/types";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@welpco/ui/dialog";

/**
 * Trust signals (`verified`, `averageRating`, `reviewCount`,
 * `completedBookingsCount`, `responseTimeMinutes`, and `serviceAreaInfo`) are
 * part of the typed PublicWelperProfile. The alias is retained for older
 * snapshot data still in flight.
 */
type PublicWelperProfileWithTrust = PublicWelperProfile;

function HeroSkeleton() {
  return (
    <Card size="4" variant="surface">
      <Flex gap="5" direction={{ initial: "column", sm: "row" }} align="start">
        <Skeleton width="96px" height="96px" style={{ borderRadius: "9999px" }} />
        <Flex direction="column" gap="3" style={{ flex: 1, minWidth: 0 }}>
          <Skeleton width="60%" height="28px" />
          <Skeleton width="40%" height="16px" />
          <Skeleton width="90%" height="16px" />
          <Skeleton width="80%" height="16px" />
          <Flex gap="2" mt="2">
            <Skeleton width="120px" height="40px" />
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}

function ServicesSkeleton() {
  return (
    <Box>
      <Box mb="3">
        <Skeleton width="120px" height="24px" />
      </Box>
      <Flex direction="column" gap="3">
        {[1, 2, 3].map((key) => (
          <Card key={key} size="3" variant="surface">
            <Flex direction="column" gap="2">
              <Skeleton width="50%" height="20px" />
              <Skeleton width="30%" height="16px" />
              <Skeleton width="80%" height="16px" />
            </Flex>
          </Card>
        ))}
      </Flex>
    </Box>
  );
}

function ProfileLoading() {
  return (
    <Flex direction="column" gap="6" aria-busy="true" aria-live="polite">
      <HeroSkeleton />
      <ServicesSkeleton />
    </Flex>
  );
}

function ProfileError({ error }: { error: unknown }) {
  const t = useTranslations("publicWelperProfile");
  return (
    <Callout.Root color={SEMANTIC_COLOR.danger} role="alert">
      <Callout.Text>
        {t("loadError")}{" "}
        {error instanceof Error && error.message
          ? error.message
          : t("loadErrorFallback")}{" "}
        {t("loadErrorHint")}
      </Callout.Text>
      <Box mt="3">
        <Flex gap="2" wrap="wrap">
          <Button asChild color={SEMANTIC_COLOR.primary} size="2">
            <Link href="/search">{t("backToSearch")}</Link>
          </Button>
        </Flex>
      </Box>
    </Callout.Root>
  );
}

function RatingLine({
  averageRating,
  reviewCount,
}: {
  averageRating?: number | null;
  reviewCount?: number | null;
}) {
  const t = useTranslations("publicWelperProfile");
  const hasRating =
    typeof averageRating === "number" &&
    averageRating > 0 &&
    typeof reviewCount === "number" &&
    reviewCount > 0;

  if (!hasRating) {
    return (
      <Text size="2" color="gray" highContrast>
        {t("noReviewsYet")}
      </Text>
    );
  }

  const rating = (averageRating ?? 0).toFixed(2);
  const reviewLabel = reviewCount === 1 ? t("review") : t("reviews");
  return (
    <Flex
      align="center"
      gap="2"
      role="group"
      aria-label={t("ratedAria", { rating, count: reviewCount ?? 0, reviewLabel })}
    >
      <Star
        size={16}
        aria-hidden="true"
        style={{ fill: "var(--amber-9)", color: "var(--amber-9)" }}
      />
      <Text size="3" weight="bold">
        {rating}
      </Text>
      <Text size="2" color="gray" highContrast aria-hidden="true">
        ·
      </Text>
      <Text size="2" color="gray" highContrast>
        {reviewCount} {reviewLabel}
      </Text>
    </Flex>
  );
}

/**
 * Reviews on the public welper profile. Wave 1 (BFF) ships the aggregator;
 * Day 12 audit found the rating headline was the *only* surface — the
 * individual reviews were stored but never rendered. Bible §22.6: a rating
 * without the reviews behind it is half a trust signal. Show up to 5 most
 * recent customer reviews; deeper history is paginated by the BFF.
 *
 * Filter to `reviewerType === "customer"` because welper→customer reviews are
 * not part of the welper's public score (Wave 1 contract) — they shouldn't
 * appear next to the score either.
 */
function PublicReviewsSection({ welperId }: { welperId: string }) {
  const t = useTranslations("publicWelperProfile");
  const dateLocale = useDateFnsLocale();
  const { data, isLoading } = useWelperReviews(welperId, { limit: 5 });
  const reviews =
    data?.data.filter((r) => r.reviewerType === "customer") ?? [];
  const total = data?.total ?? 0;

  // Hide entirely while loading on first paint — the aggregate "No reviews yet"
  // line in the hero already communicates the empty state.
  if (isLoading) return null;
  if (reviews.length === 0) return null;

  return (
    <Box>
      <Heading as="h2" size="5" mb="3" trim="start">
        {t("reviewsHeading")}
      </Heading>
      <ReviewList
        reviews={reviews.map((r) => ({
          // Reviewer identity is intentionally minimal — bible §22.6 + privacy:
          // we don't expose reviewer profiles publicly. A plain human label beats
          // an id-derived hex handle, which reads as fabricated (adoption report
          // C2). When customer profiles surface a public display name, swap in.
          reviewerName: t("welpcoCustomer"),
          rating: r.rating,
          comment: r.comment ?? undefined,
          date: (() => {
            try {
              return format(new Date(r.createdAt), "MMM d, yyyy", {
                locale: dateLocale,
              });
            } catch {
              return r.createdAt;
            }
          })(),
          // Every review is tied to a real booking (BFF enforces it), so the
          // verified-booking signal is always true. When a moderation/flag
          // workflow exists, this can be conditional.
          verified: true,
        }))}
      />
      {total > reviews.length ? (
        <Box mt="3">
          <Text size="2" color="gray" highContrast>
            {t("showingReviews", { shown: reviews.length, total })}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}

/**
 * Signed-out conversion strip — a quiet, honest explanation of the booking
 * flow, shown between the hero and the services list. Every claim (the
 * one-hour hold, charge-after-completion, 24h free cancellation) is verified
 * policy — bible §22.6: never promise what the product doesn't do. The
 * grass-2 tint matches the /search hero band treatment so the public funnel
 * reads as one surface. Signed-in users already know the flow — hidden.
 */
function HowBookingWorksStrip() {
  const t = useTranslations("publicWelperProfile");
  const steps = [
    { title: t("bookingStep1Title"), detail: t("bookingStep1Detail") },
    { title: t("bookingStep2Title"), detail: t("bookingStep2Detail") },
    { title: t("bookingStep3Title"), detail: t("bookingStep3Detail") },
  ] as const;

  return (
    <Box
      p={{ initial: "4", sm: "5" }}
      style={{
        backgroundColor: "var(--grass-2)",
        borderRadius: "var(--radius-4)",
      }}
      role="note"
      aria-label={t("howBookingWorksAria")}
    >
      <Heading as="h2" size="3" mb="3" trim="start">
        {t("howBookingWorks")}
      </Heading>
      <Flex gap={{ initial: "3", sm: "5" }} wrap="wrap">
        {steps.map((step, index) => (
          <Flex
            key={step.title}
            gap="2"
            align="start"
            style={{ flex: "1 1 200px", minWidth: 0 }}
          >
            <Flex
              align="center"
              justify="center"
              flexShrink="0"
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "9999px",
                backgroundColor: "var(--grass-4)",
                color: "var(--grass-11)",
              }}
            >
              <Text size="1" weight="bold">
                {index + 1}
              </Text>
            </Flex>
            <Box style={{ minWidth: 0 }}>
              <Text as="p" size="2" weight="medium">
                {step.title}
              </Text>
              <Text as="p" size="2" color="gray" highContrast>
                {step.detail}
              </Text>
            </Box>
          </Flex>
        ))}
      </Flex>
      <Text as="p" size="2" color="gray" highContrast mt="3">
        {t("freeCancellation")}
      </Text>
    </Box>
  );
}

/**
 * SHARE-001 (web half): public "Work photos" gallery. The BFF only serves
 * approved photos here, so there is no moderation state to render. Hidden
 * entirely when empty (honest empty = absent — no aspirational placeholder).
 * Lightbox is a simple Dialog with the full image; photos whose `url` is
 * null (storage unconfigured) are skipped rather than rendered broken.
 */
function WorkPhotosSection({ photos }: { photos: PublicPortfolioPhoto[] }) {
  const t = useTranslations("publicWelperProfile");
  const [openPhoto, setOpenPhoto] = useState<PublicPortfolioPhoto | null>(null);
  const displayable = photos.filter(
    (photo): photo is PublicPortfolioPhoto & { url: string } =>
      typeof photo.url === "string" && photo.url.length > 0,
  );

  if (displayable.length === 0) return null;

  return (
    <Box>
      <Heading as="h2" size="5" mb="3" trim="start">
        {t("workPhotos")}
      </Heading>
      <Grid columns={{ initial: "2", sm: "3" }} gap="3">
        {displayable.map((photo, index) => (
          <Box key={photo.id}>
            <button
              type="button"
              aria-label={
                photo.caption
                  ? t("viewPhotoCaption", { caption: photo.caption })
                  : t("viewWorkPhoto", { index: index + 1 })
              }
              onClick={() => setOpenPhoto(photo)}
              style={{
                display: "block",
                width: "100%",
                padding: 0,
                border: 0,
                // The image fills the button, so the UA button background
                // never paints — no override needed (design-lint §15.5).
                cursor: "pointer",
                borderRadius: "var(--radius-3)",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- S3 host is env-dependent */}
              <img
                src={photo.url}
                alt={photo.caption || t("workPhotoAlt", { index: index + 1 })}
                loading="lazy"
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  display: "block",
                  backgroundColor: "var(--gray-3)",
                }}
              />
            </button>
            {photo.caption ? (
              <Text as="p" size="1" color="gray" highContrast mt="1">
                {photo.caption}
              </Text>
            ) : null}
          </Box>
        ))}
      </Grid>

      <Dialog
        open={openPhoto !== null}
        onOpenChange={(open) => {
          if (!open) setOpenPhoto(null);
        }}
      >
        <DialogContent aria-describedby={undefined}>
          {openPhoto?.url ? (
            <Flex direction="column" gap="2">
              {/* eslint-disable-next-line @next/next/no-img-element -- S3 host is env-dependent */}
              <img
                src={openPhoto.url}
                alt={openPhoto.caption || t("workPhoto")}
                style={{
                  width: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                  display: "block",
                  borderRadius: "var(--radius-3)",
                }}
              />
              {openPhoto.caption ? (
                <Text as="p" size="2" color="gray" highContrast>
                  {openPhoto.caption}
                </Text>
              ) : null}
            </Flex>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function ServicesEmptyState({ welperName }: { welperName: string }) {
  const t = useTranslations("publicWelperProfile");
  return (
    <Card size="3" variant="surface">
      <Flex direction="column" gap="3" align="center" py="4">
        <Heading as="h3" size="4" align="center" trim="start">
          {t("noServicesTitle")}
        </Heading>
        <Text as="p" size="2" color="gray" highContrast align="center">
          {t("noServicesBody", { name: welperName })}
        </Text>
        <Button asChild variant="soft" color="gray" size="2">
          <Link href="/search">{t("browseWelpers")}</Link>
        </Button>
      </Flex>
    </Card>
  );
}

function PublicWelperProfileContent({ welperId }: { welperId: string }) {
  const t = useTranslations("publicWelperProfile");
  const locale = useLocale() as Locale;
  const categoryDisplayName = useCategoryDisplayName();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const { data, isLoading, isError, error } = usePublicWelperProfile(welperId);
  const profile = data as PublicWelperProfileWithTrust | undefined;

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (isError || !profile) {
    return <ProfileError error={error} />;
  }

  const displayName = publicWelperDisplayName(profile);
  const profileHref = `/welper/${profile.welperId}`;
  const hasOfferings =
    Array.isArray(profile.serviceOfferings) && profile.serviceOfferings.length > 0;
  const singleOffering =
    profile.serviceOfferings.length === 1 ? profile.serviceOfferings[0] : null;
  const bookingPath = singleOffering
    ? `/dashboard/booking/new?welperId=${encodeURIComponent(
        profile.welperId
      )}&offeringId=${encodeURIComponent(singleOffering.id)}`
    : `/dashboard/booking/new?welperId=${encodeURIComponent(profile.welperId)}`;
  const loginPath = localizedPath("/login", locale);
  const bookHref = isAuthenticated
    ? singleOffering
      ? bookingPath
      : "#services"
    : `${loginPath}?next=${encodeURIComponent(
        singleOffering ? bookingPath : profileHref
      )}`;
  const bookLabel = isAuthenticated
    ? singleOffering
      ? t("book")
      : t("chooseService")
    : t("signInToBook");
  const handleBookOffering = (offeringId: string) => {
    const next = `/dashboard/booking/new?welperId=${encodeURIComponent(
      profile.welperId,
    )}&offeringId=${encodeURIComponent(offeringId)}`;
    if (isAuthenticated) {
      router.push(next);
    } else {
      router.push(`${loginPath}?next=${encodeURIComponent(next)}`);
    }
  };

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return t("respondsInMinutes", { minutes });
    return t("respondsInHours", {
      hours: Math.max(1, Math.round(minutes / 60)),
    });
  };

  return (
    <Flex direction="column" gap="6">
      {/* Hero — trust-critical above-the-fold block. Bible §20.1–20.3:
          identity → rating → verified → CTAs. */}
      <Card size="4" variant="surface">
        <Flex gap="5" direction={{ initial: "column", sm: "row" }} align="start">
          <Avatar
            src={profile.profilePhotoUrl ?? undefined}
            fallback={displayName.charAt(0)}
            size="7"
            alt={displayName}
          />
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Flex
              align={{ initial: "start", sm: "center" }}
              gap="3"
              wrap="wrap"
              mb="2"
            >
              <Heading as="h1" size="7" trim="start">
                {displayName}
              </Heading>
              <VerifiedTrustBadge
                passed={profile.verified === true}
                passedLabel={t("verifiedBadgePassed")}
                notPassedLabel={t("verifiedBadgeNotPassed")}
              />
            </Flex>

            <Box mb="3">
              <Flex align="center" gap="3" wrap="wrap">
                <RatingLine
                  averageRating={profile.averageRating}
                  reviewCount={profile.reviewCount}
                />
                <Flex align="center" gap="1">
                  <BriefcaseBusiness size={16} aria-hidden="true" />
                  <Text size="2" color="gray" highContrast>
                    {t("completedJobs", { count: profile.completedBookingsCount })}
                  </Text>
                </Flex>
              </Flex>
              {typeof profile.responseTimeMinutes === "number" && (
                <Text as="p" size="2" color="gray" highContrast mt="1">
                  {formatResponseTime(profile.responseTimeMinutes)}
                </Text>
              )}
            </Box>

            {profile.bio && (
              <Text as="p" size="3" color="gray" highContrast mb="4">
                {profile.bio}
              </Text>
            )}

            <Flex gap="3" wrap="wrap" mt="3">
              {hasOfferings && (
                <Button asChild size="3" color={SEMANTIC_COLOR.primary}>
                  <Link href={bookHref}>{bookLabel}</Link>
                </Button>
              )}
            </Flex>
          </Box>
        </Flex>
      </Card>

      {!isAuthenticated && <HowBookingWorksStrip />}

      {/* Services — bible §25.6 nested cards under a sub-heading. */}
      <Box id="services">
        <Flex justify="between" align="center" mb="3" gap="3" wrap="wrap">
          <Heading as="h2" size="5" trim="start">
            {t("services")}
          </Heading>
          {!isAuthenticated && hasOfferings && (
            <Button asChild variant="soft" size="2">
              <Link
                href={`${loginPath}?next=${encodeURIComponent(profileHref)}`}
              >
                {t("signInToBook")}
              </Link>
            </Button>
          )}
        </Flex>
        {hasOfferings ? (
          <Flex direction="column" gap="3">
            {profile.serviceOfferings.map((offering) => {
              const categoryName = categoryDisplayName(offering.categoryName);
              const parentName = offering.parentCategoryName
                ? categoryDisplayName(offering.parentCategoryName)
                : categoryName;
              return (
                <ServiceOfferingCard
                  key={offering.id}
                  title={categoryName}
                  category={parentName}
                  hourlyRate={offering.hourlyRate}
                  description={offering.serviceDescription}
                  bookLabel={t("bookNow")}
                  onBook={() => handleBookOffering(offering.id)}
                />
              );
            })}
          </Flex>
        ) : (
          <ServicesEmptyState welperName={displayName} />
        )}
      </Box>

      {/* Work photos — SHARE-001. Approved-only from the BFF; hidden when
          empty. Missing field tolerated for older cached payloads. */}
      <WorkPhotosSection photos={profile.portfolioPhotos ?? []} />

      {/* Reviews — Day 12 audit fix: the aggregate line in the hero claimed
          a rating with no way to read the underlying reviews. Bible §22.6
          honesty: show the substance behind the score. */}
      <PublicReviewsSection welperId={profile.welperId} />
    </Flex>
  );
}

/**
 * SHARE-005 wiring — count a public-profile view with `src` attribution
 * (`?src=qr|link|story|…`, default "direct"). Fire-and-forget: the BFF
 * endpoint lands separately, so any failure (404 included) is swallowed —
 * analytics must never break the public page. Reads `window.location.search`
 * directly instead of `useSearchParams()` so the page needs no Suspense
 * boundary for a metric ping.
 */
function useProfileViewPing(welperId: string) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (!welperId || sentRef.current) return;
    sentRef.current = true;

    let src = "direct";
    try {
      const raw = new URLSearchParams(window.location.search).get("src");
      if (raw && raw.trim()) src = raw.trim().slice(0, 32);
    } catch {
      // Malformed query string — keep "direct".
    }

    try {
      void apiClient
        .post(
          `/api/search/welpers/${encodeURIComponent(welperId)}/view`,
          { src },
          { skipAuth: true },
        )
        .catch(() => {
          // Endpoint may not exist yet (SHARE-005 BFF half) — no-op.
        });
    } catch {
      // Never let tracking break the page.
    }
  }, [welperId]);
}

export default function WelperProfilePageClient({
  welperId,
}: {
  welperId: string;
}) {
  const id = welperId;
  const t = useTranslations("publicWelperProfile");
  const isAuthenticated = useIsAuthenticated();
  const profileHref = `/welper/${id}`;

  useProfileViewPing(id);

  return (
    <Flex direction="column" minHeight="100vh">
      <CustomerHeader
        signedIn={isAuthenticated}
        signedOutReturnTo={profileHref}
        signedOutLabels={{
          signIn: t("signIn"),
          signUp: t("signUp"),
        }}
      />

      <Box py={{ initial: "5", sm: "7" }} flexGrow="1">
        <Container size="3" px={{ initial: "4", sm: "6" }}>
          <Box mb="4">
            <Button asChild variant="ghost" color="gray" size="2">
              <Link href="/search">
                <ArrowLeft size={16} aria-hidden="true" />
                {t("backToSearch")}
              </Link>
            </Button>
          </Box>
          <PublicWelperProfileContent welperId={id} />
        </Container>
      </Box>

      <Separator size="4" />
      <PublicSiteFooter />
    </Flex>
  );
}
