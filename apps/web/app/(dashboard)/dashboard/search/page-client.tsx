"use client";

import { useCallback, useMemo, useState, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Container } from "@welpco/ui/container";
import {
  SearchHero,
  SearchFiltersSidebar,
  SearchResultsToolbar,
  SearchResultsList,
  SearchEmptyState,
  WelperProfileCardCompact,
  type SearchFiltersSidebarState,
  type SearchResultsViewMode,
  type WelperProfileDialogProfile,
  type WelperProfileDialogOffering,
} from "@welpco/ui/platform";

const WelperProfileDialog = dynamic(
  () => import("@welpco/ui/platform").then((m) => ({ default: m.WelperProfileDialog })),
  { ssr: false }
);

const ServiceSelectionDialog = dynamic(
  () => import("@welpco/ui/platform").then((m) => ({ default: m.ServiceSelectionDialog })),
  { ssr: false }
);
import { useSearchServices, useDiscoveryCategories, usePublicWelperProfile } from "@/lib/hooks/use-service-discovery";
import { reverseGeocode } from "@/lib/services/geocode.service";
import { ApiClientError } from "@/lib/api/client";
import { transformCategoriesToOptions, validateCategoryId } from "@/lib/utils/category-utils";
import type { SearchResultItem } from "@/types";
import { maskCustomerWelperName, publicWelperDisplayName } from "@/lib/display-name";
import { Button } from "@welpco/ui/button";
import { IconButton } from "@welpco/ui/icon-button";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Link as UiLink } from "@welpco/ui/link";
import { Badge } from "@welpco/ui/badge";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import styles from "./search.module.css";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
/** Default for postal forward-geocode disambiguation (BFF `countryCode`); not used as a search filter. */
const DEFAULT_SEARCH_COUNTRY_CODE =
  typeof process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE === "string" &&
  process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE.trim() !== ""
    ? process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE.trim()
    : "CA";

function mapToWelperProfileDialogProfile(
  data: {
    welperId: string;
    displayName?: string;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    profilePhotoUrl: string | null;
    serviceOfferings?: Array<{
      id: string;
      serviceCategoryId: string;
      subcategoryIds?: string[];
      subcategories?: Array<{ id: string; name: string }>;
      categoryName: string;
      parentCategoryName?: string | null;
      serviceDescription: string | null;
      hourlyRate: number;
      experienceYears?: number | null;
    }> | null;
  } | null
): WelperProfileDialogProfile | null {
  if (!data) return null;
  return {
    welperId: data.welperId,
    displayName: publicWelperDisplayName(data),
    firstName: data.firstName,
    lastName: data.lastName,
    bio: data.bio,
    profilePhotoUrl: data.profilePhotoUrl,
    serviceOfferings: (data.serviceOfferings ?? []).map((o) => ({
      id: o.id,
      serviceCategoryId: o.serviceCategoryId,
      subcategoryIds: o.subcategoryIds,
      subcategories: o.subcategories,
      categoryName: o.categoryName,
      parentCategoryName: o.parentCategoryName ?? undefined,
      serviceDescription: o.serviceDescription ?? "",
      hourlyRate: o.hourlyRate,
      experienceYears: o.experienceYears ?? 0,
    })),
  };
}

export default function DashboardSearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const postalCode = searchParams.get("postalCode") ?? undefined;
  const latParam = searchParams.get("latitude");
  const lngParam = searchParams.get("longitude");
  const latitude = latParam != null && latParam !== "" ? parseFloat(latParam) : undefined;
  const longitude = lngParam != null && lngParam !== "" ? parseFloat(lngParam) : undefined;
  const validLat = typeof latitude === "number" && !Number.isNaN(latitude) && latitude >= -90 && latitude <= 90;
  const validLng = typeof longitude === "number" && !Number.isNaN(longitude) && longitude >= -180 && longitude <= 180;
  const searchLat = validLat ? latitude : undefined;
  const searchLng = validLng ? longitude : undefined;
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const minRatingParam = searchParams.get("minRating");
  const minPrice = minPriceParam != null && minPriceParam !== "" ? parseInt(minPriceParam, 10) : undefined;
  const maxPrice = maxPriceParam != null && maxPriceParam !== "" ? parseInt(maxPriceParam, 10) : undefined;
  const minRating = minRatingParam != null && minRatingParam !== "" ? parseFloat(minRatingParam) : undefined;
  const validMinPrice = typeof minPrice === "number" && !Number.isNaN(minPrice) && minPrice >= 0;
  const validMaxPrice = typeof maxPrice === "number" && !Number.isNaN(maxPrice) && maxPrice >= 0;
  const validMinRating = typeof minRating === "number" && !Number.isNaN(minRating) && minRating >= 0 && minRating <= 5;
  const searchMinPrice = validMinPrice ? minPrice : undefined;
  const searchMaxPrice = validMaxPrice ? maxPrice : undefined;
  const searchMinRating = validMinRating ? minRating : undefined;
  const parsedPage = parseInt(searchParams.get("page") ?? String(DEFAULT_PAGE), 10);
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : DEFAULT_PAGE;
  const sortParam = searchParams.get("sort");
  const sort = (sortParam === "price" ? "price" : sortParam === "distance" ? "distance" : "relevance") as "relevance" | "price" | "distance";

  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<SearchResultsViewMode>("list");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Local state for postal code input so we don't push to URL on every keystroke (avoids focus loss)
  const [localPostalCode, setLocalPostalCode] = useState(postalCode ?? "");

  const hasSearchCenter =
    (searchLat != null && searchLng != null) || !!postalCode?.trim();

  const [profileDialogWelperId, setProfileDialogWelperId] = useState<string | null>(null);
  const { data: profileDialogData, isLoading: profileDialogLoading } = usePublicWelperProfile(
    profileDialogWelperId ?? undefined,
    !!profileDialogWelperId
  );
  const profileDialogProfile = useMemo(
    () => mapToWelperProfileDialogProfile(profileDialogData ?? null),
    [profileDialogData]
  );

  const [serviceSelectionWelperId, setServiceSelectionWelperId] = useState<string | null>(null);
  const { data: serviceSelectionProfileData, isLoading: serviceSelectionProfileLoading } =
    usePublicWelperProfile(serviceSelectionWelperId ?? undefined, !!serviceSelectionWelperId);
  const serviceSelectionProfile = useMemo(
    () => mapToWelperProfileDialogProfile(serviceSelectionProfileData ?? null),
    [serviceSelectionProfileData]
  );

  const params = useMemo(
    () => ({
      q,
      categoryId,
      countryCode: postalCode?.trim() ? DEFAULT_SEARCH_COUNTRY_CODE : undefined,
      postalCode: postalCode?.trim() || undefined,
      latitude: searchLat,
      longitude: searchLng,
      minPrice: searchMinPrice,
      maxPrice: searchMaxPrice,
      minRating: searchMinRating,
      page,
      limit: DEFAULT_LIMIT,
      sort,
    }),
    [q, categoryId, postalCode, searchLat, searchLng, searchMinPrice, searchMaxPrice, searchMinRating, page, sort]
  );

  const { data, isLoading, isError, error, refetch } = useSearchServices(
    params,
    hasSearchCenter
  );

  const isGeocodingUnavailable =
    isError &&
    error &&
    typeof error === "object" &&
    (error as { statusCode?: number; code?: string }).statusCode === 503 &&
    (error as { code?: string }).code === "GEOCODING_API_DISABLED";
  const postalError =
    isError &&
    error &&
    typeof error === "object" &&
    ((error as { statusCode?: number }).statusCode === 400 || isGeocodingUnavailable);
  const { data: categoriesData } = useDiscoveryCategories(false);

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
        router.push(`/dashboard/search?${next.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  const handleCategoryChange = useCallback(
    (id: string | undefined) => {
      updateParams({ categoryId: id, page: undefined });
    },
    [updateParams]
  );

  const handleSortChange = useCallback(
    (s: "relevance" | "price" | "distance") => {
      updateParams({ sort: s, page: undefined });
    },
    [updateParams]
  );

  const handleResetFilters = useCallback(() => {
    setLocalPostalCode(""); // Reset local input state too
    updateParams({
      q: undefined,
      categoryId: undefined,
      latitude: undefined,
      longitude: undefined,
      postalCode: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      page: undefined,
    });
  }, [updateParams]);

  const handleClearSearchAndFilters = handleResetFilters;

  // Derive price range and rating for sidebar from URL (so price/rating filters are applied to API)
  const priceRangeFromUrl = useMemo((): SearchFiltersSidebarState["priceRange"] => {
    if (searchMinPrice === 0 && searchMaxPrice === 50) return "0-50";
    if (searchMinPrice === 50 && searchMaxPrice === 100) return "50-100";
    if (searchMinPrice === 100 && searchMaxPrice === 200) return "100-200";
    if (searchMinPrice === 200 && searchMaxPrice === undefined) return "200+";
    return "any";
  }, [searchMinPrice, searchMaxPrice]);

  const ratingFromUrl = useMemo((): SearchFiltersSidebarState["rating"] => {
    if (searchMinRating === 4) return "4";
    if (searchMinRating === 4.5) return "4.5";
    if (searchMinRating === 5) return "5";
    return "any";
  }, [searchMinRating]);

  const filterStateFromUrl = useMemo(
    (): SearchFiltersSidebarState => ({
      priceRange: priceRangeFromUrl,
      rating: ratingFromUrl,
    }),
    [priceRangeFromUrl, ratingFromUrl]
  );

  const handlePriceRangeChange = useCallback(
    (range: SearchFiltersSidebarState["priceRange"]) => {
      if (range === "any") {
        updateParams({ minPrice: undefined, maxPrice: undefined, page: undefined });
      } else if (range === "0-50") {
        updateParams({ minPrice: 0, maxPrice: 50, page: undefined });
      } else if (range === "50-100") {
        updateParams({ minPrice: 50, maxPrice: 100, page: undefined });
      } else if (range === "100-200") {
        updateParams({ minPrice: 100, maxPrice: 200, page: undefined });
      } else if (range === "200+") {
        updateParams({ minPrice: 200, maxPrice: undefined, page: undefined });
      }
    },
    [updateParams]
  );

  const handleRatingChange = useCallback(
    (rating: SearchFiltersSidebarState["rating"]) => {
      if (rating === "any") {
        updateParams({ minRating: undefined, page: undefined });
      } else {
        updateParams({ minRating: parseFloat(rating), page: undefined });
      }
    },
    [updateParams]
  );

  const handlePostalSubmit = useCallback(
    (postal: string) => {
      const trimmed = postal?.trim();
      updateParams({
        postalCode: trimmed || undefined,
        page: undefined,
      });
    },
    [updateParams]
  );

  // Only update local state while typing; URL is updated on submit (handlePostalSubmit) to avoid focus loss
  const handlePostalChange = useCallback((code: string) => {
    setLocalPostalCode(code);
  }, []);

  const handleKeywordChange = useCallback(
    (value: string | undefined) => {
      updateParams({ q: value, page: undefined });
    },
    [updateParams]
  );

  // Category options: parents plus subcategories (subcategories shown as "Parent · Sub" so users can filter by subcategory)
  // Optimized with utility function to avoid multiple filter passes
  const categoryOptions = useMemo(() => transformCategoriesToOptions(categoriesData), [categoriesData]);

  // Validate categoryId: if not in categoryOptions, clear it
  const validCategoryId = useMemo(
    () => validateCategoryId(categoryId, categoryOptions),
    [categoryId, categoryOptions]
  );

  useEffect(() => {
    if (categoryId && validCategoryId !== categoryId) {
      updateParams({ categoryId: undefined });
    }
  }, [categoryId, validCategoryId, updateParams]);

  // Clear postal code from URL when geocoding fails (400 error)
  // Sync local postal code from URL when URL changes (e.g. after submit, or "Use my location")
  useEffect(() => {
    setLocalPostalCode(postalCode ?? "");
  }, [postalCode]);

  useEffect(() => {
    if (postalError && postalCode) {
      const timer = setTimeout(() => {
        updateParams({ postalCode: undefined });
      }, 3000); // Clear after 3 seconds to give user time to read error
      return () => clearTimeout(timer);
    }
  }, [postalError, postalCode, updateParams]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocationError(null);
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const result = await reverseGeocode(lat, lng);
          const postal = result.postalCode ?? undefined;
          updateParams({
            postalCode: postal,
            latitude: lat,
            longitude: lng,
            page: undefined,
          });
        } catch (err) {
          if (err instanceof ApiClientError && err.code === "GEOCODING_API_DISABLED") {
            setLocationError(
              "Location lookup isn't available right now. Please enter a postal code to search."
            );
          } else {
            setLocationError("Could not get address for your location.");
          }
          updateParams({
            latitude: lat,
            longitude: lng,
            page: undefined,
          });
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationError("Location access was denied or unavailable.");
        setLocationLoading(false);
      },
      { timeout: 15000, maximumAge: 300000, enableHighAccuracy: false }
    );
  }, [updateParams]);

  const openProfileDialog = useCallback((welperId: string) => {
    setProfileDialogWelperId(welperId);
  }, []);
  const openServiceSelection = useCallback((welperId: string) => {
    setProfileDialogWelperId(null);
    setServiceSelectionWelperId(welperId);
  }, []);
  const closeServiceSelection = useCallback(() => {
    setServiceSelectionWelperId(null);
  }, []);
  const handleServiceSelect = useCallback(
    (offering: WelperProfileDialogOffering) => {
      if (!serviceSelectionWelperId) return;
      router.push(
        `/dashboard/booking/new?welperId=${encodeURIComponent(serviceSelectionWelperId)}&offeringId=${encodeURIComponent(offering.id)}`
      );
      setServiceSelectionWelperId(null);
    },
    [router, serviceSelectionWelperId]
  );

  const heroCategories = useMemo(() => {
    if (!categoriesData || !Array.isArray(categoriesData)) return [];
    return categoriesData
      .filter((c: { parentId?: string | null }) => !c.parentId)
      .slice(0, 10)
      .map((c: { id: string; name: string }) => ({ id: c.id, label: c.name }));
  }, [categoriesData]);

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
      specialties: item.categories,
      imageUrl: item.profilePhotoUrl ?? undefined,
      verified: item.verified === true,
      onView: () => openProfileDialog(item.welperId),
      onBook: () => openServiceSelection(item.welperId),
    }));
  }, [data?.items, openProfileDialog, openServiceSelection]);

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / DEFAULT_LIMIT) || 1;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  useEffect(() => {
    if (hasSearchCenter && data && total > 0 && page > totalPages) {
      updateParams({ page: totalPages });
    }
  }, [hasSearchCenter, data, total, page, totalPages, updateParams]);

  const showEmpty =
    hasSearchCenter &&
    !isLoading &&
    !isError &&
    (total === 0 || cardItems.length === 0);
  const showResults =
    hasSearchCenter && !isLoading && !isError && cardItems.length > 0;
  const showLocationPrompt = !hasSearchCenter;

  const hasActiveFilters =
    priceRangeFromUrl !== "any" ||
    ratingFromUrl !== "any" ||
    !!validCategoryId ||
    !!q?.trim();

  const filtersSidebar = (
    <SearchFiltersSidebar
      value={filterStateFromUrl}
      onChange={(next) => {
        if (next.priceRange !== filterStateFromUrl.priceRange) handlePriceRangeChange(next.priceRange);
        if (next.rating !== filterStateFromUrl.rating) handleRatingChange(next.rating);
      }}
      onReset={handleResetFilters}
      categoryId={validCategoryId}
      onCategoryChange={handleCategoryChange}
      categoryOptions={categoryOptions}
      keyword={q ?? undefined}
      onKeywordChange={handleKeywordChange}
      showRadius={false}
      layout="panel"
    />
  );

  return (
    <ErrorBoundary>
      <Container size="3" px={{ initial: "4", sm: "6" }}>
        <Flex direction="column" gap="6" style={{ width: "100%", minWidth: 0 }}>
          <WelperProfileDialog
            open={!!profileDialogWelperId}
            onOpenChange={(open) => !open && setProfileDialogWelperId(null)}
            profile={profileDialogProfile}
            loading={profileDialogLoading}
            onBook={() => {
              if (profileDialogWelperId) openServiceSelection(profileDialogWelperId);
            }}
          />
          <ServiceSelectionDialog
            open={!!serviceSelectionWelperId}
            onOpenChange={(open) => !open && closeServiceSelection()}
            profile={serviceSelectionProfile}
            loading={serviceSelectionProfileLoading}
            onSelect={handleServiceSelect}
          />
          <Box>
            <Heading as="h1" size="7" mb="2">
              Search Welpers
            </Heading>
            <Text as="p" size="2" color="gray" highContrast>
              Find the perfect Welper for your needs
            </Text>
          </Box>

          <Flex direction="column" gap="4" style={{ width: "100%", minWidth: 0 }}>
            <SearchHero
              fillWidth
              mode="location"
              value={localPostalCode}
              onChange={handlePostalChange}
              onSearch={handlePostalSubmit}
              onCategorySelect={(id) => handleCategoryChange(id)}
              title="Find your Welper"
              categories={heroCategories}
              loading={isLoading}
              onUseMyLocation={handleUseMyLocation}
              locationError={
                postalError
                  ? isGeocodingUnavailable
                    ? "Location lookup isn't available right now. Please try again later."
                    : "We couldn't find that postal code. Try another or use your location."
                  : locationError
              }
              locationLoading={locationLoading}
            />

            <Flex justify="end" style={{ width: "100%" }}>
              <Button
                variant="soft"
                color="gray"
                size="2"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-controls="search-filters-panel"
              >
                <Flex align="center" gap="2">
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  <span>{filtersOpen ? "Hide filters" : "Show filters"}</span>
                  {hasActiveFilters && (
                    <Badge variant="soft" color={SEMANTIC_COLOR.primary} size="1">
                      Active
                    </Badge>
                  )}
                  {filtersOpen ? (
                    <ChevronUp size={16} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={16} aria-hidden="true" />
                  )}
                </Flex>
              </Button>
            </Flex>

            {filtersOpen && (
              <Box id="search-filters-panel" style={{ width: "100%", minWidth: 0 }}>
                {filtersSidebar}
              </Box>
            )}
          </Flex>

          {showLocationPrompt && (
            <Card size="4" variant="surface" style={{ width: "100%", maxWidth: "560px", minWidth: 0 }}>
              <Flex direction="column" gap="3" align="center">
                <Text as="p" size="2" color="gray" highContrast align="center">
                  Enter your postal code or use your location to find Welpers nearby.
                </Text>
              </Flex>
            </Card>
          )}

          {isError && !postalError && !showResults && (
            <Callout.Root color={SEMANTIC_COLOR.danger} role="alert">
              <Callout.Text>
                We couldn&apos;t load Welpers right now.{" "}
                {error instanceof Error && error.message
                  ? error.message
                  : "Something went wrong on our end."}{" "}
                Try again, or{" "}
                <UiLink href="mailto:support@welpco.com">contact support</UiLink>.
              </Callout.Text>
              <Box mt="3">
                <Button onClick={() => refetch()} color={SEMANTIC_COLOR.primary} size="2">
                  Try again
                </Button>
              </Box>
            </Callout.Root>
          )}

          <Box className={styles["results-region"]}>
            {showResults && (
              <Flex direction="column" gap="4">
                <Flex justify="between" align="center" gap="3" wrap="wrap">
                  <SearchResultsToolbar
                    total={total}
                    page={page}
                    pageSize={DEFAULT_LIMIT}
                    sort={sort}
                    onSortChange={handleSortChange}
                    showSortDistance={hasSearchCenter}
                    viewMode={viewMode}
                    onViewModeChange={(mode) => startTransition(() => setViewMode(mode))}
                    showViewToggle
                    loading={isLoading || isPending}
                  />
                </Flex>

                {viewMode === "list" ? (
                  <SearchResultsList
                    items={cardItems}
                    loading={isLoading || isPending}
                    error={
                      isError
                        ? error != null && typeof error === "object" && "message" in error
                          ? String((error as Error).message)
                          : "Something went wrong"
                        : undefined
                    }
                    onRetry={() => refetch()}
                    resultsHeading="Welpers"
                    emptyMessage=""
                  />
                ) : (
                  <Grid
                    columns={{ initial: "1", sm: "2" }}
                    gap="4"
                    style={{ width: "100%" }}
                  >
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
                        onView={item.onView}
                        onBook={item.onBook}
                      />
                    ))}
                  </Grid>
                )}

                {(hasPrev || hasNext) && (
                  <Flex gap="2" justify="center" align="center" py="4">
                    <IconButton
                      variant="soft"
                      color="gray"
                      size="2"
                      disabled={!hasPrev}
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
                      disabled={!hasNext}
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
                title="No Welpers found"
                description="Try adjusting your search or filters, or post a job and let welpers apply."
                primaryAction={{
                  label: "Post a job",
                  onClick: () => router.push("/dashboard/marketplace/new"),
                }}
                secondaryAction={
                  q ||
                  validCategoryId ||
                  searchLat !== undefined ||
                  searchMinPrice !== undefined ||
                  searchMaxPrice !== undefined ||
                  searchMinRating !== undefined ||
                  postalCode?.trim()
                    ? {
                        label: "Clear search & filters",
                        onClick: handleClearSearchAndFilters,
                      }
                    : {
                        label: "Browse categories",
                        onClick: handleClearSearchAndFilters,
                      }
                }
              />
            )}

            {isLoading && !isError && (
              /* Reuse the canonical SearchResultsList loading shape so the
                 skeleton matches the rendered cards. Bible §17.4. */
              <SearchResultsList items={[]} loading />
            )}
          </Box>
        </Flex>
      </Container>
    </ErrorBoundary>
  );
}
