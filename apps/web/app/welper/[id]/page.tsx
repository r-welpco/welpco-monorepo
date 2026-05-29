"use client";

import { use } from "react";
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
import { Badge } from "@welpco/ui/badge";
import { Skeleton } from "@welpco/ui/skeleton";
import { Grid } from "@welpco/ui/grid";
import { Separator } from "@welpco/ui/separator";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { CustomerHeader, Footer } from "@welpco/ui/platform/layout";
import { ServiceOfferingCard, ReviewList } from "@welpco/ui/platform";
import { ShieldCheck, Star, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePublicWelperProfile } from "@/lib/hooks/use-service-discovery";
import { useWelperReviews } from "@/lib/hooks/use-booking-review";
import { useIsAuthenticated } from "@/stores/authStore";
import type { PublicWelperProfile } from "@/types";
import { format } from "date-fns";

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
            <Link href="/dashboard/search">Back to search</Link>
          </Button>
        </Flex>
      </Box>
    </Callout.Root>
  );
}

function VerifiedTrustBadge() {
  return (
    <Badge color={SEMANTIC_COLOR.success} variant="soft" highContrast size="2">
      <ShieldCheck size={14} aria-hidden="true" />
      Verified
    </Badge>
  );
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
          // we don't expose reviewer profiles publicly, so render a short id-derived
          // handle. When customer profiles surface a public display name, swap in.
          reviewerName: `Customer #${r.reviewerId.slice(-6).toUpperCase()}`,
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
          <Link href="/dashboard/search">Browse Welpers</Link>
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

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Welper";
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

  const handleBookOffering = (offeringId: string) => {
    if (isAuthenticated) {
      router.push(
        `/dashboard/booking/new?welperId=${encodeURIComponent(
          profile.welperId
        )}&offeringId=${encodeURIComponent(offeringId)}`
      );
    } else {
      const next = `/dashboard/booking/new?welperId=${profile.welperId}&offeringId=${offeringId}`;
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

      {/* Reviews — Day 12 audit fix: the aggregate line in the hero claimed
          a rating with no way to read the underlying reviews. Bible §22.6
          honesty: show the substance behind the score. */}
      <PublicReviewsSection welperId={profile.welperId} />
    </Flex>
  );
}

export default function WelperProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isAuthenticated = useIsAuthenticated();
  const profileHref = `/welper/${id}`;

  return (
    <Theme>
      <Flex direction="column" minHeight="100vh">
        <CustomerHeader signedIn={isAuthenticated} signedOutReturnTo={profileHref} />

        <Box py={{ initial: "5", sm: "7" }} flexGrow="1">
          <Container size="3" px={{ initial: "4", sm: "6" }}>
            <Box mb="4">
              <Button asChild variant="ghost" color="gray" size="2">
                <Link href="/dashboard/search">
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
