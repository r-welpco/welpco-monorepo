"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Container } from "@welpco/ui/container";
import { Theme } from "@radix-ui/themes";
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
import { CustomerHeader, Footer } from "@welpco/ui/platform/layout";
import { ServiceOfferingCard, ReviewList, VerifiedTrustBadge } from "@welpco/ui/platform";
import { Star, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePublicWelperProfile } from "@/lib/hooks/use-service-discovery";
import { apiClient } from "@/lib/api/client";
import { publicWelperDisplayName } from "@/lib/display-name";
import { useWelperReviews } from "@/lib/hooks/use-booking-review";
import { useIsAuthenticated } from "@/stores/authStore";
import type { PublicPortfolioPhoto, PublicWelperProfile } from "@/types";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@welpco/ui/dialog";

/**
 * Wave 1 (BFF) shipped: `verified`, `averageRating`, `reviewCount`,
 * `responseTimeMinutes`, and `serviceAreaInfo` are now part of the typed
 * PublicWelperProfile. The legacy alias is preserved so we can land DTO
 * widening without breaking older snapshot data still in flight.
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
  return (
    <Callout.Root color={SEMANTIC_COLOR.danger} role="alert">
      <Callout.Text>
        We couldn&apos;t load this Welper&apos;s profile.{" "}
        {error instanceof Error && error.message
          ? error.message
          : "They may have removed it, or the link may be out of date."}{" "}
        Try again, or browse other Welpers.
      </Callout.Text>
      <Box mt="3">
        <Flex gap="2" wrap="wrap">
          <Button asChild color={SEMANTIC_COLOR.primary} size="2">
            <Link href="/search">Back to search</Link>
          </Button>
        </Flex>
      </Box>
    </Callout.Root>
  );
}

/**
 * C5 fix — the BFF has always populated `responseTimeMinutes` (null below
 * 5 accepted bookings in 90 days), but it was never rendered. Hidden when
 * null — never show a fabricated SLA (bible §22.6).
 */
function formatResponseTime(minutes: number): string {
  if (minutes < 60) return `Responds in ~${minutes} min`;
  return `Responds in ~${Math.max(1, Math.round(minutes / 60))}h`;
}

function RatingLine({
  averageRating,
  reviewCount,
}: {
  averageRating?: number | null;
  reviewCount?: number | null;
}) {
  const hasRating =
    typeof averageRating === "number" &&
    averageRating > 0 &&
    typeof reviewCount === "number" &&
    reviewCount > 0;

  if (!hasRating) {
    return (
      <Text size="2" color="gray" highContrast>
        No reviews yet
      </Text>
    );
  }

  const rating = (averageRating ?? 0).toFixed(2);
  const reviewLabel = reviewCount === 1 ? "review" : "reviews";
  return (
    <Flex
      align="center"
      gap="2"
      role="group"
      aria-label={`${rating} out of 5 stars from ${reviewCount} ${reviewLabel}`}
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
        Reviews
      </Heading>
      <ReviewList
        reviews={reviews.map((r) => ({
          // Reviewer identity is intentionally minimal — bible §22.6 + privacy:
          // we don't expose reviewer profiles publicly. A plain human label beats
          // an id-derived hex handle, which reads as fabricated (adoption report
          // C2). When customer profiles surface a public display name, swap in.
          reviewerName: "Welpco customer",
          rating: r.rating,
          comment: r.comment ?? undefined,
          date: (() => {
            try {
              return format(new Date(r.createdAt), "MMM d, yyyy");
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
            Showing {reviews.length} of {total} customer reviews.
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
const BOOKING_STEPS = [
  {
    title: "Request a time",
    detail: "Pick a service and time that works.",
  },
  {
    title: "Welper accepts",
    detail: "A one-hour hold goes on your card — not a charge.",
  },
  {
    title: "Pay when done",
    detail: "You're only charged after the job is complete.",
  },
] as const;

function HowBookingWorksStrip() {
  return (
    <Box
      p={{ initial: "4", sm: "5" }}
      style={{
        backgroundColor: "var(--grass-2)",
        borderRadius: "var(--radius-4)",
      }}
      role="note"
      aria-label="How booking works"
    >
      <Heading as="h2" size="3" mb="3" trim="start">
        How booking works
      </Heading>
      <Flex gap={{ initial: "3", sm: "5" }} wrap="wrap">
        {BOOKING_STEPS.map((step, index) => (
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
        Free cancellation up to 24 hours before the start.
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
  const [openPhoto, setOpenPhoto] = useState<PublicPortfolioPhoto | null>(null);
  const displayable = photos.filter(
    (photo): photo is PublicPortfolioPhoto & { url: string } =>
      typeof photo.url === "string" && photo.url.length > 0,
  );

  if (displayable.length === 0) return null;

  return (
    <Box>
      <Heading as="h2" size="5" mb="3" trim="start">
        Work photos
      </Heading>
      <Grid columns={{ initial: "2", sm: "3" }} gap="3">
        {displayable.map((photo, index) => (
          <Box key={photo.id}>
            <button
              type="button"
              aria-label={
                photo.caption
                  ? `View photo: ${photo.caption}`
                  : `View work photo ${index + 1}`
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
                alt={photo.caption || `Work photo ${index + 1}`}
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
                alt={openPhoto.caption || "Work photo"}
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
  return (
    <Card size="3" variant="surface">
      <Flex direction="column" gap="3" align="center" py="4">
        <Heading as="h3" size="4" align="center" trim="start">
          No services listed yet
        </Heading>
        <Text as="p" size="2" color="gray" highContrast align="center">
          {welperName} hasn&apos;t published any services on their profile.
          Check back soon, or browse other Welpers nearby.
        </Text>
        <Button asChild variant="soft" color="gray" size="2">
          <Link href="/search">Browse Welpers</Link>
        </Button>
      </Flex>
    </Card>
  );
}

function PublicWelperProfileContent({ welperId }: { welperId: string }) {
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
  const bookHref = isAuthenticated
    ? singleOffering
      ? bookingPath
      : "#services"
    : `/login?next=${encodeURIComponent(
        singleOffering ? bookingPath : profileHref
      )}`;
  const bookLabel = isAuthenticated
    ? singleOffering
      ? "Book"
      : "Choose a service"
    : "Sign in to book";
  const messageHref = isAuthenticated
    ? `/dashboard/messages?welperId=${encodeURIComponent(profile.welperId)}`
    : `/login?next=${encodeURIComponent(
        `/dashboard/messages?welperId=${profile.welperId}`
      )}`;

  /**
   * This page sits OUTSIDE the i18n provider, so it must not run
   * `useBookingReadinessGate` (its dialog labels use next-intl and crash the
   * whole page). Navigate straight to the booking flow instead — that page
   * lives in the dashboard shell and runs the readiness gate itself.
   */
  const handleBookOffering = (offeringId: string) => {
    const next = `/dashboard/booking/new?welperId=${encodeURIComponent(
      profile.welperId,
    )}&offeringId=${encodeURIComponent(offeringId)}`;
    if (isAuthenticated) {
      router.push(next);
    } else {
      router.push(`/login?next=${encodeURIComponent(next)}`);
    }
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
              {/* Bible §20.1 + §22.6: a verified badge must mean something.
                  Render only when the BFF explicitly returns `verified: true`
                  — never default to "yes" on missing data. */}
              {profile.verified === true && <VerifiedTrustBadge />}
            </Flex>

            <Box mb="3">
              <RatingLine
                averageRating={profile.averageRating}
                reviewCount={profile.reviewCount}
              />
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
              <Button asChild variant="soft" color="gray" size="3">
                <Link href={messageHref}>Message</Link>
              </Button>
            </Flex>
          </Box>
        </Flex>
      </Card>

      {!isAuthenticated && <HowBookingWorksStrip />}

      {/* Services — bible §25.6 nested cards under a sub-heading. */}
      <Box id="services">
        <Flex justify="between" align="center" mb="3" gap="3" wrap="wrap">
          <Heading as="h2" size="5" trim="start">
            Services
          </Heading>
          {!isAuthenticated && hasOfferings && (
            <Button asChild variant="soft" size="2">
              <Link
                href={`/login?next=${encodeURIComponent(profileHref)}`}
              >
                Sign in to book
              </Link>
            </Button>
          )}
        </Flex>
        {hasOfferings ? (
          <Flex direction="column" gap="3">
            {profile.serviceOfferings.map((offering) => (
              <ServiceOfferingCard
                key={offering.id}
                title={offering.categoryName}
                category={
                  offering.parentCategoryName ?? offering.categoryName
                }
                hourlyRate={offering.hourlyRate}
                description={offering.serviceDescription}
                onBook={() => handleBookOffering(offering.id)}
              />
            ))}
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
  const isAuthenticated = useIsAuthenticated();
  const profileHref = `/welper/${id}`;

  useProfileViewPing(id);

  return (
    <Theme>
      <Flex direction="column" minHeight="100vh">
        <CustomerHeader signedIn={isAuthenticated} signedOutReturnTo={profileHref} />

        <Box py={{ initial: "5", sm: "7" }} flexGrow="1">
          <Container size="3" px={{ initial: "4", sm: "6" }}>
            <Box mb="4">
              <Button asChild variant="ghost" color="gray" size="2">
                <Link href="/search">
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back to search
                </Link>
              </Button>
            </Box>
            <PublicWelperProfileContent welperId={id} />
          </Container>
        </Box>

        <Separator size="4" />
        <Footer />
      </Flex>
    </Theme>
  );
}
