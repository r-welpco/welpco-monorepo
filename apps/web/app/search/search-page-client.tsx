"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Theme } from "@radix-ui/themes";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Container } from "@welpco/ui/container";
import { Button } from "@welpco/ui/button";
import { IconButton } from "@welpco/ui/icon-button";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Separator } from "@welpco/ui/separator";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { CustomerHeader, Footer } from "@welpco/ui/platform/layout";
import {
  SearchHero,
  SearchResultsToolbar,
  SearchResultsList,
  SearchEmptyState,
  WelperProfileCardCompact,
  type WeeklyAvailabilityDisplayLabels,
} from "@welpco/ui/platform";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  useSearchServices,
  useDiscoveryCategories,
} from "@/lib/hooks/use-service-discovery";
import { reverseGeocode } from "@/lib/services/geocode.service";
import { ApiClientError } from "@/lib/api/client";
import { useIsAuthenticated } from "@/stores/authStore";
import { maskCustomerWelperName } from "@/lib/display-name";
import type { SearchResultItem } from "@/types";

/**
 * Public welper search — the top-of-funnel page (adoption report item 10).
 *
 * This route family (`/search`, `/welper/[id]`) sits OUTSIDE the next-intl
 * provider, so all copy is hardcoded English — mirroring
 * `app/welper/[id]/page.tsx`. Do not add next-intl hooks here.
 *
 * All data comes from the unauthenticated BFF endpoints
 * (`GET /api/search/services`, `/api/search/categories`, `/api/geocode/*` —
 * verified guard-free) via the same hooks the dashboard search uses; the
 * services already pass `skipAuth: true`.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
/** Default for postal forward-geocode disambiguation (BFF `countryCode`); not used as a search filter. */
const DEFAULT_SEARCH_COUNTRY_CODE =
  typeof process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE === "string" &&
  process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE.trim() !== ""
    ? process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE.trim()
    : "CA";

/** Hardcoded EN — matches `dashboard.welperAvailabilityDisplay` in messages/en.json. */
const AVAILABILITY_LABELS: WeeklyAvailabilityDisplayLabels = {
  label: "Availability",
  adHocOnly: "By request",
  unavailable: "—",
  noSlots: "No hours listed",
  dayColumn: "Day",
  hoursColumn: "Hours",
  viewTimesAria: (day: string) => `View available hours for ${day}`,
  dayLetters: ["M", "T", "W", "T", "F", "S", "S"],
  dayNames: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
};

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useIsAuthenticated();

  const q = searchParams.get("q") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const postalCode = searchParams.get("postalCode") ?? undefined;
  const latParam = searchParams.get("latitude");
  const lngParam = searchParams.get("longitude");
  const latitude =
    latParam != null && latParam !== "" ? parseFloat(latParam) : undefined;
  const longitude =
    lngParam != null && lngParam !== "" ? parseFloat(lngParam) : undefined;
  const validLat =
    typeof latitude === "number" &&
    !Number.isNaN(latitude) &&
    latitude >= -90 &&
    latitude <= 90;
  const validLng =
    typeof longitude === "number" &&
    !Number.isNaN(longitude) &&
    longitude >= -180 &&
    longitude <= 180;
  const searchLat = validLat ? latitude : undefined;
  const searchLng = validLng ? longitude : undefined;
  const parsedPage = parseInt(searchParams.get("page") ?? String(DEFAULT_PAGE), 10);
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : DEFAULT_PAGE;
  const sortParam = searchParams.get("sort");
  const sort = (
    sortParam === "price" ? "price" : sortParam === "distance" ? "distance" : "relevance"
  ) as "relevance" | "price" | "distance";

  const [, startTransition] = useTransition();
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  // Local state for the postal input so we don't push to the URL on every keystroke.
  const [localPostalCode, setLocalPostalCode] = useState(postalCode ?? "");

  const hasSearchCenter =
    (searchLat != null && searchLng != null) || !!postalCode?.trim();

  const params = useMemo(
    () => ({
      q,
      categoryId,
      countryCode: postalCode?.trim() ? DEFAULT_SEARCH_COUNTRY_CODE : undefined,
      postalCode: postalCode?.trim() || undefined,
      latitude: searchLat,
      longitude: searchLng,
      page,
      limit: DEFAULT_LIMIT,
      sort,
    }),
    [q, categoryId, postalCode, searchLat, searchLng, page, sort],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useSearchServices(params, hasSearchCenter);
  const { data: categoriesData } = useDiscoveryCategories(false);

  const isGeocodingUnavailable =
    isError &&
    error &&
    typeof error === "object" &&
    (error as { statusCode?: number }).statusCode === 503 &&
    (error as { code?: string }).code === "GEOCODING_API_DISABLED";
  const postalError =
    isError &&
    error &&
    typeof error === "object" &&
    ((error as { statusCode?: number }).statusCode === 400 || isGeocodingUnavailable);

  const updateParams = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      startTransition(() => {
        const next = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
          if (value === undefined || value === "") {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        }
        const qs = next.toString();
        router.push(qs ? `/search?${qs}` : "/search");
      });
    },
    [router, searchParams, startTransition],
  );

  const handleCategorySelect = useCallback(
    (id: string | undefined) => {
      updateParams({ categoryId: id, page: undefined });
    },
    [updateParams],
  );

  const handlePostalSubmit = useCallback(
    (postal: string) => {
      const trimmed = postal?.trim();
      updateParams({
        postalCode: trimmed || undefined,
        // Typed postal replaces any previous geolocation fix.
        latitude: undefined,
        longitude: undefined,
        page: undefined,
      });
    },
    [updateParams],
  );

  const handleSortChange = useCallback(
    (s: "relevance" | "price" | "distance") => {
      updateParams({ sort: s, page: undefined });
    },
    [updateParams],
  );

  const handleResetFilters = useCallback(() => {
    setLocalPostalCode("");
    updateParams({
      q: undefined,
      categoryId: undefined,
      latitude: undefined,
      longitude: undefined,
      postalCode: undefined,
      page: undefined,
    });
  }, [updateParams]);

  // Sync local postal input from the URL (after submit or "Use my location").
  useEffect(() => {
    setLocalPostalCode(postalCode ?? "");
  }, [postalCode]);

  // Clear a postal code the geocoder rejected (400) after the user has read the error.
  useEffect(() => {
    if (postalError && postalCode) {
      const timer = setTimeout(() => {
        updateParams({ postalCode: undefined });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [postalError, postalCode, updateParams]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      setLocationError("Your browser doesn't support location detection.");
      return;
    }
    setLocationError(null);
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          // Public endpoint (skipAuth) — resolves a display postal code.
          const result = await reverseGeocode(lat, lng);
          updateParams({
            postalCode: result.postalCode ?? undefined,
            latitude: lat,
            longitude: lng,
            page: undefined,
          });
        } catch (err) {
          if (err instanceof ApiClientError && err.code === "GEOCODING_API_DISABLED") {
            setLocationError(
              "Address lookup is temporarily unavailable — searching by your coordinates instead.",
            );
          } else {
            setLocationError(
              "We couldn't look up your address — searching by your coordinates instead.",
            );
          }
          updateParams({ latitude: lat, longitude: lng, page: undefined });
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationError(
          "Location access was denied. Enter your postal code instead.",
        );
        setLocationLoading(false);
      },
      { timeout: 15000, maximumAge: 300000, enableHighAccuracy: false },
    );
  }, [updateParams]);

  const heroCategories = useMemo(() => {
    if (!categoriesData || !Array.isArray(categoriesData)) return [];
    return categoriesData
      .filter((c: { parentId?: string | null }) => !c.parentId)
      .slice(0, 10)
      .map((c: { id: string; name: string }) => ({ id: c.id, label: c.name }));
  }, [categoriesData]);

  const selectedCategoryName = useMemo(() => {
    if (!categoryId || !Array.isArray(categoriesData)) return null;
    return (
      categoriesData.find((c: { id: string }) => c.id === categoryId)?.name ?? null
    );
  }, [categoryId, categoriesData]);

  const cardItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((item: SearchResultItem) => ({
      welperId: item.welperId,
      name: maskCustomerWelperName(item.name),
      title: item.title,
      location: item.location,
      hourlyRate: item.hourlyRate,
      rating: item.rating ?? 0,
      reviews: item.reviewCount ?? 0,
      imageUrl: item.profilePhotoUrl ?? undefined,
      verified: item.verified === true,
      isMinor: item.isMinor === true,
      weeklyAvailability: item.weeklyAvailability,
    }));
  }, [data?.items]);

  const total = data?.total ?? 0;
  const pageSize = data?.limit ?? DEFAULT_LIMIT;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const isPageTransition = isFetching && data != null && data.page !== page;
  const resultsMatchPage = data?.page === page;

  useEffect(() => {
    if (hasSearchCenter && data && total > 0 && page > totalPages) {
      updateParams({ page: totalPages });
    }
  }, [hasSearchCenter, data, total, page, totalPages, updateParams]);

  useEffect(() => {
    if (!hasSearchCenter) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, hasSearchCenter]);

  const showEmpty =
    hasSearchCenter &&
    !isLoading &&
    !isFetching &&
    !isError &&
    (total === 0 || (resultsMatchPage && cardItems.length === 0));
  const showResultCards =
    hasSearchCenter && !isError && resultsMatchPage && cardItems.length > 0;
  const showResultLoading =
    hasSearchCenter && !isError && (isLoading || isPageTransition);
  const showResultsRegion =
    hasSearchCenter &&
    !isError &&
    !showEmpty &&
    (showResultCards || showResultLoading || total > 0);
  const showLocationPrompt = !hasSearchCenter;

  const dashboardSearchHref = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `/dashboard/search?${qs}` : "/dashboard/search";
  }, [searchParams]);

  const openProfile = useCallback(
    (welperId: string) => {
      router.push(`/welper/${encodeURIComponent(welperId)}`);
    },
    [router],
  );

  return (
    <>
      {/* Hero band — soft full-width grass tint that bridges the marketing
          surface into the platform (adoption report: soften the seam).
          Tokens only: `grass-2` is a whisper of brand in light mode and stays
          appropriately subdued in dark via the Radix scale. Content remains
          constrained to the standard Container; the results section below
          stays neutral. */}
      <Box
        py={{ initial: "6", sm: "8" }}
        style={{ backgroundColor: "var(--grass-2)" }}
      >
        <Container size="3" px={{ initial: "4", sm: "6" }}>
          <Flex direction="column" gap="6" style={{ width: "100%", minWidth: 0 }}>
            <Box>
              <Flex justify="between" align="start" gap="3" wrap="wrap">
                <Box>
                  <Heading as="h1" size="7" mb="2">
                    Find local Welpers
                  </Heading>
                  <Text as="p" size="2" color="gray" highContrast>
                    Browse vetted neighbours offering everyday services near
                    you — no account needed.
                  </Text>
                </Box>
                {isAuthenticated && (
                  <Button asChild variant="soft" color="gray" size="2">
                    <Link href={dashboardSearchHref}>
                      Go to your dashboard search
                    </Link>
                  </Button>
                )}
              </Flex>
            </Box>

            {!isAuthenticated && (
              <Callout.Root
                color={SEMANTIC_COLOR.primary}
                variant="surface"
                role="note"
              >
                <Flex
                  align={{ initial: "start", sm: "center" }}
                  justify="between"
                  gap="3"
                  wrap="wrap"
                >
                  <Callout.Text>
                    Create a free account to book — you&apos;re only charged
                    after the job is done.
                  </Callout.Text>
                  <Button asChild size="2" color={SEMANTIC_COLOR.primary}>
                    <Link href="/register">Create a free account</Link>
                  </Button>
                </Flex>
              </Callout.Root>
            )}

            <Flex direction="column" gap="3" style={{ width: "100%", minWidth: 0 }}>
              <SearchHero
                fillWidth
                mode="location"
                value={localPostalCode}
                onChange={setLocalPostalCode}
                onSearch={handlePostalSubmit}
                onCategorySelect={(id) => handleCategorySelect(id)}
                title="Find your Welper"
                categories={heroCategories}
                loading={isLoading}
                onUseMyLocation={handleUseMyLocation}
                locationError={
                  postalError
                    ? isGeocodingUnavailable
                      ? "Postal code lookup is temporarily unavailable. Try again in a moment."
                      : "We couldn't find that postal code. Check it and try again."
                    : locationError
                }
                locationLoading={locationLoading}
              />

              {selectedCategoryName && (
                <Flex align="center" gap="2">
                  <Badge variant="soft" color={SEMANTIC_COLOR.primary} size="2">
                    {selectedCategoryName}
                  </Badge>
                  <IconButton
                    variant="ghost"
                    color="gray"
                    size="1"
                    onClick={() => handleCategorySelect(undefined)}
                    aria-label={`Clear category filter ${selectedCategoryName}`}
                  >
                    <X size={14} aria-hidden="true" />
                  </IconButton>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Results section — intentionally neutral below the band. */}
      <Box py={{ initial: "5", sm: "7" }}>
        <Container size="3" px={{ initial: "4", sm: "6" }}>
          <Flex direction="column" gap="6" style={{ width: "100%", minWidth: 0 }}>
            {showLocationPrompt && (
              <Card
                size="4"
                variant="surface"
                style={{ width: "100%", maxWidth: "560px", minWidth: 0 }}
              >
                <Flex direction="column" gap="3" align="center">
                  <Text as="p" size="2" color="gray" highContrast align="center">
                    Enter your postal code or use your location to see Welpers near
                    you.
                  </Text>
                </Flex>
              </Card>
            )}

            {isError && !postalError && !showResultsRegion && (
              <Callout.Root color={SEMANTIC_COLOR.danger} role="alert">
                <Callout.Text>
                  We couldn&apos;t load search results.{" "}
                  {error instanceof Error && error.message
                    ? error.message
                    : "Something went wrong."}
                </Callout.Text>
                <Box mt="3">
                  <Button onClick={() => refetch()} color={SEMANTIC_COLOR.primary} size="2">
                    Try again
                  </Button>
                </Box>
              </Callout.Root>
            )}

            {showResultsRegion && (
              <Flex direction="column" gap="4">
                <SearchResultsToolbar
                  total={total}
                  page={page}
                  pageSize={pageSize}
                  sort={sort}
                  onSortChange={handleSortChange}
                  showSortDistance={hasSearchCenter}
                  showViewToggle={false}
                  loading={isLoading || isPageTransition}
                />

                {showResultCards ? (
                  <Grid columns={{ initial: "1", sm: "2" }} gap="4" style={{ width: "100%" }}>
                    {cardItems.map((item) => (
                      <WelperProfileCardCompact
                        key={item.welperId}
                        name={item.name}
                        title={item.title}
                        location={item.location}
                        hourlyRate={item.hourlyRate}
                        rating={item.rating}
                        reviews={item.reviews}
                        imageUrl={item.imageUrl}
                        verified={item.verified}
                        isMinor={item.isMinor}
                        weeklyAvailability={item.weeklyAvailability}
                        availabilityLabels={AVAILABILITY_LABELS}
                        availabilityLocale="en"
                        onView={() => openProfile(item.welperId)}
                        onBook={() => openProfile(item.welperId)}
                      />
                    ))}
                  </Grid>
                ) : showResultLoading ? (
                  <SearchResultsList items={[]} loading />
                ) : null}

                {(hasPrev || hasNext) && (
                  <Flex gap="2" justify="center" align="center" py="4">
                    <IconButton
                      variant="soft"
                      color="gray"
                      size="2"
                      disabled={!hasPrev || isPageTransition}
                      onClick={() => updateParams({ page: page - 1 })}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={18} aria-hidden="true" />
                    </IconButton>
                    <Text size="2" color="gray" highContrast>
                      Page {page} of {totalPages}
                    </Text>
                    <IconButton
                      variant="soft"
                      color="gray"
                      size="2"
                      disabled={!hasNext || isPageTransition}
                      onClick={() => updateParams({ page: page + 1 })}
                      aria-label="Next page"
                    >
                      <ChevronRight size={18} aria-hidden="true" />
                    </IconButton>
                  </Flex>
                )}
              </Flex>
            )}

            {showEmpty && (
              <SearchEmptyState
                title="No Welpers match your search"
                description="Try a different postal code, widen your search, or browse another category."
                primaryAction={{
                  label: "Clear search & filters",
                  onClick: handleResetFilters,
                }}
              />
            )}
          </Flex>
        </Container>
      </Box>
    </>
  );
}

export default function PublicSearchPageClient() {
  const isAuthenticated = useIsAuthenticated();
  const searchParams = useSearchParams();
  const returnTo = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `/search?${qs}` : "/search";
  }, [searchParams]);

  return (
    <Theme>
      <Flex direction="column" minHeight="100vh">
        <CustomerHeader signedIn={isAuthenticated} signedOutReturnTo={returnTo} />

        {/* SearchPageContent owns its own Containers so the hero band can
            run full-width while content stays constrained. */}
        <Box flexGrow="1">
          <SearchPageContent />
        </Box>

        <Separator size="4" />
        <Footer />
      </Flex>
    </Theme>
  );
}
