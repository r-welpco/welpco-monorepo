"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { normalizeWelperSetupChecklist } from "@/lib/dashboard/normalize-welper-setup-checklist";
import { useWelperSetupChecklist } from "@/lib/hooks/use-signup";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Container } from "@welpco/ui/container";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@welpco/ui/tabs";
import { ActionConfirmDialog } from "@welpco/ui/platform/feedback";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useDashboardUser } from "@/lib/hooks/use-dashboard-user";
import {
  useCustomerProfile,
  useWelperProfile,
  useUpdateCustomerProfile,
  useUpdateWelperProfile,
  useFavoriteWelpers,
  useRemoveFavoriteWelper,
  useServiceOfferings,
  useCreateServiceOffering,
  useUpdateServiceOffering,
  useDeleteServiceOffering,
  useAvailability,
  useAvailabilityExceptions,
  useUpdateAvailability,
  useAddAvailabilityException,
  useRemoveAvailabilityException,
  useHolidays,
} from "@/lib/hooks/use-profile";
import { getPresignedUrl, uploadFileToS3 } from "@/lib/services/upload-service";
import { useContentCategories, useCategoriesByParent } from "@/lib/hooks/use-content";
import { useCategoryDisplayName } from "@/lib/i18n/category-display-name";
import {
  CustomerProfileForm,
  WelperProfileForm,
  ProfilePhotoUpload,
  ServiceOfferingList,
  ServiceOfferingForm,
  TimeSlotAvailability,
  AvailabilityScheduleStats,
  AvailabilityExceptions,
  FavoriteWelperList,
  ServiceAreaCard,
} from "./profile-forms-lazy";
import { Dialog, DialogContent } from "@welpco/ui/dialog";
import { Card } from "@welpco/ui/card";
import { Callout } from "@welpco/ui/callout";
import {
  resolveServiceAreaRadiusKm,
  type ServiceArea,
} from "@welpco/ui/platform/profile-management";
import {
  WelperProfileBackgroundCheckPanel,
  WelperProfilePayoutPanel,
} from "./welper-setup-tab-panels";
import type {
  CustomerProfileValues,
  WelperProfileValues,
  ServiceOfferingValues,
} from "@welpco/ui/platform/profile-management";
import type { ServiceArea as AppServiceArea } from "@/types";
import {
  useWelperAvailabilityExceptionsLabels,
  useWelperAvailabilityScheduleLabels,
  useWelperProfileFormLabels,
  useWelperProfileLabels,
  useWelperProfileOfferingLabels,
  useWelperServiceOfferingFormLabels,
  useProfilePhotoUploadLabels,
} from "@/lib/i18n/use-dashboard-labels";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";
import { useWelperServiceAreaStepLabels } from "@/lib/i18n/use-auth-labels";

/** Service offering form only supports radius areas; app `ServiceArea` also allows `"address"`. */
function radiusServiceAreaForForm(area: AppServiceArea | undefined | null): ServiceArea | undefined {
  if (!area || area.type !== "radius") return undefined;
  return {
    type: "radius",
    centerAddress: area.centerAddress,
    radiusKm: resolveServiceAreaRadiusKm(area),
    description: area.description,
  };
}

interface ProfilePageClientProps {
  user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
    /** Day 15 — post signup-merge source of truth. */
    signupCompleted: boolean;
    /** Legacy mirror; kept until BFF column drops. */
    onboardingCompleted: boolean;
  };
}

const WELPER_PROFILE_TABS = new Set([
  "profile",
  "offerings",
  "availability",
  "serviceArea",
  "backgroundCheck",
  "payout",
]);

const CUSTOMER_PROFILE_TABS = new Set(["personal", "favorites"]);

export default function ProfilePageClient({ user: serverUser }: ProfilePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: sessionStatus, data: session } = useSession();
  const { user } = useDashboardUser(serverUser);

  // Only run profile API calls when session is ready (avoids "No access token" and infinite loading)
  const sessionReady = sessionStatus === "authenticated";

  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() => {
    if (user.role === "welper" && tabFromUrl && WELPER_PROFILE_TABS.has(tabFromUrl)) {
      return tabFromUrl;
    }
    if (user.role === "welper") return "profile";
    if (tabFromUrl && CUSTOMER_PROFILE_TABS.has(tabFromUrl)) return tabFromUrl;
    return "personal";
  });

  useEffect(() => {
    if (user.role === "customer") {
      const tab = searchParams.get("tab");
      if (tab === "preferences" || (tab && !CUSTOMER_PROFILE_TABS.has(tab))) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", "personal");
        router.replace(`/dashboard/profile?${params.toString()}`);
        setActiveTab("personal");
      } else if (tab && CUSTOMER_PROFILE_TABS.has(tab)) {
        setActiveTab(tab);
      }
      return;
    }
    const tab = searchParams.get("tab");
    if (tab === "overview") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "profile");
      router.replace(`/dashboard/profile?${params.toString()}`);
      setActiveTab("profile");
      return;
    }
    if (tab && WELPER_PROFILE_TABS.has(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, user.role, router]);

  const handleWelperTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      if (user.role !== "welper") return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`/dashboard/profile?${params.toString()}`);
    },
    [user.role, searchParams, router],
  );
  const [isServiceOfferingDialogOpen, setIsServiceOfferingDialogOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<{ id?: string } & ServiceOfferingValues | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [pendingDeleteOfferingId, setPendingDeleteOfferingId] = useState<string | null>(null);

  // Fetch categories and subcategories
  const { data: allCategories = [] } = useContentCategories();
  // Memoize main categories filter to avoid recalculation on every render
  const mainCategories = useMemo(
    () => allCategories.filter((cat) => cat.level === 1 && cat.parentId === null && cat.isActive),
    [allCategories]
  );
  const categoryDisplayName = useCategoryDisplayName();
  const categoryNameById = useMemo(
    () =>
      new Map(
        allCategories.map((cat) => [cat.id, categoryDisplayName(cat.name)]),
      ),
    [allCategories, categoryDisplayName],
  );
  const { data: subcategoriesData = [] } = useCategoriesByParent(
    selectedCategoryId,
    !!selectedCategoryId
  );
  // Memoize subcategories filter to avoid recalculation on every render
  const subcategories = useMemo(
    () => subcategoriesData.filter((cat) => cat.level === 2 && cat.parentId === selectedCategoryId && cat.isActive),
    [subcategoriesData, selectedCategoryId]
  );

  // Determine user role
  const isCustomer = user.role === "customer";
  const isWelper = user.role === "welper";
  const welperProfileLabels = useWelperProfileLabels();
  const profilePhotoUploadLabels = useProfilePhotoUploadLabels();
  const welperProfileFormLabels = useWelperProfileFormLabels();
  const welperOfferingLabels = useWelperProfileOfferingLabels();
  const welperOfferingFormLabels = useWelperServiceOfferingFormLabels();
  const welperAvailabilityLabels = useWelperAvailabilityScheduleLabels();
  const welperAvailabilityExceptionsLabels = useWelperAvailabilityExceptionsLabels();
  const dateFnsLocale = useDateFnsLocale();
  const welperServiceAreaLabels = useWelperServiceAreaStepLabels();

  const { data: welperSetup } = useWelperSetupChecklist(isWelper && sessionReady);
  const welperSetupIncomplete = useMemo(() => {
    if (!isWelper || !welperSetup) return false;
    return !normalizeWelperSetupChecklist(
      welperSetup,
      session?.user?.emailVerified === true,
    ).setupComplete;
  }, [isWelper, welperSetup, session?.user?.emailVerified]);

  // React Query hooks - only fetch when session is ready (avoids no-token errors and infinite loading)
  const { data: customerProfile, isLoading: isLoadingCustomer, error: customerError } = useCustomerProfile(
    user.id,
    isCustomer && sessionReady
  );
  const { data: welperProfile, isLoading: isLoadingWelper, error: welperError } = useWelperProfile(
    user.id,
    isWelper && sessionReady
  );

  // Role-specific data hooks (gated on session so API client has token)
  const { data: favoriteWelpersRaw } = useFavoriteWelpers(isCustomer && sessionReady ? user.id : "");
  const favoriteWelpers = favoriteWelpersRaw?.items ?? [];
  const { data: serviceOfferings = [] } = useServiceOfferings(isWelper && sessionReady ? user.id : "");
  const { data: availabilitySchedule } = useAvailability(isWelper && sessionReady ? user.id : "");
  const { data: availabilityExceptions = [] } = useAvailabilityExceptions(
    sessionReady && availabilitySchedule?.id ? availabilitySchedule.id : ""
  );

  const updateCustomerProfileMutation = useUpdateCustomerProfile();
  const updateWelperProfileMutation = useUpdateWelperProfile();
  const removeFavoriteMutation = useRemoveFavoriteWelper();
  const createServiceOfferingMutation = useCreateServiceOffering();
  const updateServiceOfferingMutation = useUpdateServiceOffering();
  const deleteServiceOfferingMutation = useDeleteServiceOffering();
  const updateAvailabilityMutation = useUpdateAvailability(isWelper ? user.id : "");
  // Only use schedule.id as calendarId when we have real calendar rows (time slots); otherwise id is welperId and backend 404s
  const hasAvailabilityCalendar = (availabilitySchedule?.timeSlots?.length ?? 0) > 0;
  const calendarIdForExceptions = hasAvailabilityCalendar ? (availabilitySchedule?.id ?? "") : "";
  const addExceptionMutation = useAddAvailabilityException(calendarIdForExceptions);
  const removeExceptionMutation = useRemoveAvailabilityException(calendarIdForExceptions);

  const holidayCountry = welperProfile?.serviceArea?.centerAddress?.country || "CA";
  const holidayProvince = welperProfile?.serviceArea?.centerAddress?.stateProvince || undefined;
  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  yearStart.setHours(0, 0, 0, 0);
  const yearEnd = new Date();
  yearEnd.setMonth(11, 31);
  yearEnd.setHours(23, 59, 59, 999);
  const { data: holidaysData = [], isLoading: holidaysLoading } = useHolidays({
    countryCode: holidayCountry,
    provinceCode: holidayProvince ?? null,
    from: yearStart.toISOString().slice(0, 10),
    to: yearEnd.toISOString().slice(0, 10),
  });
  const holidaysForUi = useMemo(
    () =>
      holidaysData.map((h) => ({
        id: h.id,
        name: h.name,
        date: h.date instanceof Date ? h.date : new Date(h.date as string),
        endDate: h.endDate ? (h.endDate instanceof Date ? h.endDate : new Date(h.endDate as string)) : null,
      })),
    [holidaysData]
  );

  // Handle service area save (explicit save button, not auto-save)
  const handleServiceAreaSave = async (area: ServiceArea) => {
    if (!user || !isWelper) return;
    await updateWelperProfileMutation.mutateAsync({
      userId: user.id,
      data: {
        serviceArea: area,
      },
    });
  };

  const handlePhotoUpload = useCallback(async (file: File) => {
    if (!user || !isWelper) return;
    const { uploadUrl, publicUrl } = await getPresignedUrl(file.name, file.type);
    await uploadFileToS3(uploadUrl, file);
    await updateWelperProfileMutation.mutateAsync({
      userId: user.id,
      data: { photoUrl: publicUrl },
    });
  }, [user, isWelper, updateWelperProfileMutation]);

  const handlePhotoRemove = useCallback(async () => {
    if (!user || !isWelper) return;
    await updateWelperProfileMutation.mutateAsync({
      userId: user.id,
      data: { photoUrl: null },
    });
  }, [user, isWelper, updateWelperProfileMutation]);

  const handleCustomerPhotoUpload = useCallback(
    async (file: File) => {
      if (!user) return;
      const { uploadUrl, publicUrl } = await getPresignedUrl(file.name, file.type);
      await uploadFileToS3(uploadUrl, file);
      await updateCustomerProfileMutation.mutateAsync({
        userId: user.id,
        data: { photoUrl: publicUrl },
      });
    },
    [user, updateCustomerProfileMutation],
  );

  const handleCustomerPhotoRemove = useCallback(async () => {
    if (!user) return;
    await updateCustomerProfileMutation.mutateAsync({
      userId: user.id,
      data: { photoUrl: null },
    });
  }, [user, updateCustomerProfileMutation]);

  // Derived state - use the appropriate profile based on role
  const isLoading = sessionStatus === "loading" || (isCustomer ? isLoadingCustomer : isLoadingWelper);
  const error = isCustomer ? customerError : welperError;

  // Welper handlers - must be called unconditionally (Rules of Hooks)
  const handleWelperProfileSubmit = useCallback(async (values: WelperProfileValues) => {
    if (!user) return;

    // Parse phone string into PhoneNumber object for the backend
    let phoneNumber: { countryCode: string; number: string; formatted: string } | undefined;
    if (values.phone) {
      const phoneDigits = values.phone.replace(/\D/g, "");
      const countryCode = values.phone.startsWith("+")
        ? values.phone.match(/^\+(\d{1,3})/)?.[0] || "+1"
        : "+1";
      const number = phoneDigits.replace(/^1/, "").slice(-10);
      phoneNumber = { countryCode, number, formatted: values.phone };
    }

    await updateWelperProfileMutation.mutateAsync({
      userId: user.id,
      data: {
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber,
        bio: values.bio,
        photoUrl: values.photoUrl,
        profileVisibility: values.profileVisibility,
      },
    });
  }, [user, updateWelperProfileMutation]);

  const handleAddServiceOffering = useCallback(() => {
    setEditingOffering(null);
    setSelectedCategoryId(null);
    setIsServiceOfferingDialogOpen(true);
  }, []);

  const handleEditServiceOffering = useCallback((id: string) => {
    const offering = serviceOfferings.find((o) => o.id === id);
    if (offering) {
      const descriptionParts = offering.description.split('.');
      const title = descriptionParts.length > 1 ? descriptionParts[0] : '';
      const description = descriptionParts.length > 1
        ? descriptionParts.slice(1).join('.').trim()
        : offering.description;
      setSelectedCategoryId(offering.categoryId);
      setEditingOffering({
        id: offering.id,
        title: title || offering.title,
        category: offering.categoryId,
        subcategories: offering.subcategoryIds || [],
        hourlyRate: offering.hourlyRate,
        experienceYears: offering.experienceYears,
        description: description,
        serviceAreaOverride: offering.serviceArea?.type === "radius" && !!offering.serviceArea,
        serviceArea: radiusServiceAreaForForm(offering.serviceArea),
        active: offering.active,
      });
      setIsServiceOfferingDialogOpen(true);
    }
  }, [serviceOfferings]);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const handleServiceOfferingSubmit = useCallback(async (values: ServiceOfferingValues) => {
    if (!user) return;
    try {
      const serviceDescription = values.title
        ? `${values.title}. ${values.description}`
        : values.description;
      if (editingOffering) {
        const offeringId = editingOffering.id || serviceOfferings.find((o) =>
          o.title === editingOffering.title && o.categoryId === editingOffering.category
        )?.id;
        if (offeringId) {
          await updateServiceOfferingMutation.mutateAsync({
            offeringId,
            data: {
              categoryId: values.category,
              description: serviceDescription,
              hourlyRate: values.hourlyRate,
              experienceYears: values.experienceYears,
              serviceArea: values.serviceAreaOverride ? values.serviceArea : undefined,
              subcategoryIds: values.subcategories || [],
              active: values.active,
            },
          });
        }
      } else {
        await createServiceOfferingMutation.mutateAsync({
          welperId: user.id,
          data: {
            title: values.title || welperProfileLabels.defaultServiceTitle,
            categoryId: values.category,
            description: serviceDescription,
            hourlyRate: values.hourlyRate,
            experienceYears: values.experienceYears,
            serviceArea: values.serviceAreaOverride ? values.serviceArea : undefined,
            serviceAreaOverride: values.serviceAreaOverride,
            subcategoryIds: values.subcategories || [],
            active: values.active,
          },
        });
      }
      setIsServiceOfferingDialogOpen(false);
      setEditingOffering(null);
    } catch (err) {
      console.error("Error saving service offering:", err);
    }
  }, [user, editingOffering, serviceOfferings, updateServiceOfferingMutation, createServiceOfferingMutation]);

  const handleDeleteServiceOffering = useCallback((id: string) => {
    setPendingDeleteOfferingId(id);
  }, []);

  const handleConfirmDeleteOffering = useCallback(async () => {
    if (!pendingDeleteOfferingId) return;
    try {
      await deleteServiceOfferingMutation.mutateAsync(pendingDeleteOfferingId);
      setPendingDeleteOfferingId(null);
    } catch (err) {
      console.error("Error deleting service offering:", err);
    }
  }, [pendingDeleteOfferingId, deleteServiceOfferingMutation]);

  const handleToggleServiceOfferingActive = useCallback(async (id: string, isActive: boolean) => {
    const offering = serviceOfferings.find((o) => o.id === id);
    if (offering) {
      try {
        await updateServiceOfferingMutation.mutateAsync({
          offeringId: id,
          data: { active: isActive },
        });
      } catch (err) {
        console.error("Error toggling service offering:", err);
      }
    }
  }, [serviceOfferings, updateServiceOfferingMutation]);

  const handleServiceOfferingDialogOpenChange = useCallback((open: boolean) => {
    setIsServiceOfferingDialogOpen(open);
    if (!open) {
      setEditingOffering(null);
      setSelectedCategoryId(null);
    }
  }, []);

  // Conditional render - no early returns before this so hook order is stable
  if (!user) {
    return (
      <Container size="3" px={{ initial: "4", sm: "6" }}>
        <Card size="3" variant="surface">
          <Flex direction="column" align="center" gap="3" py="6" px="3">
            <Heading as="h1" size="5" align="center" trim="start">
              Sign in to view your profile
            </Heading>
            <Text size="2" color="gray" highContrast align="center" as="p">
              Your profile is private. Sign in to manage your information and preferences.
            </Text>
          </Flex>
        </Card>
      </Container>
    );
  }

  if (sessionStatus === "loading") {
    return (
      <Container size="3" px={{ initial: "4", sm: "6" }}>
        <Flex direction="column" gap="4" aria-busy="true" aria-live="polite">
          <Card size="3" variant="surface">
            <Flex direction="column" gap="3">
              <Box style={{ height: 24, backgroundColor: "var(--gray-3)", borderRadius: "var(--radius-2)" }} />
              <Box style={{ height: 12, backgroundColor: "var(--gray-3)", borderRadius: "var(--radius-2)", width: "70%" }} />
            </Flex>
          </Card>
        </Flex>
      </Container>
    );
  }

  // Customer Profile Tabs
  if (isCustomer) {
    const handleCustomerProfileSubmit = async (values: CustomerProfileValues) => {
      if (!user) return;
      await updateCustomerProfileMutation.mutateAsync({
        userId: user.id,
        data: {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          address: values.address,
        },
      });
    };

    return (
      <Container size="3" px={{ initial: "4", sm: "6" }}>
        <Flex direction="column" gap="6">
          <Box>
            <Heading as="h1" size="7" mb="2" trim="start">
              Profile
            </Heading>
            <Text as="p" size="2" color="gray" highContrast>
              Manage your profile information and preferences.
            </Text>
          </Box>

        {(error || updateCustomerProfileMutation.error) && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>
              {error instanceof Error
                ? error.message
                : updateCustomerProfileMutation.error instanceof Error
                  ? updateCustomerProfileMutation.error.message
                  : "We couldn't load your profile. Try again in a moment."}
            </Callout.Text>
          </Callout.Root>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="personal">Personal info</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Box pt="5">
              <Flex direction="column" gap="4">
                <ProfilePhotoUpload
                  maxWidth="640px"
                  labels={profilePhotoUploadLabels}
                  enableCrop
                  currentPhotoUrl={customerProfile?.photoUrl ?? null}
                  currentPhotoAlt={
                    customerProfile?.firstName
                      ? `${customerProfile.firstName} profile photo`
                      : welperProfileLabels.photo.alt
                  }
                  description={welperProfileLabels.photo.customerDescription}
                  loading={isLoading || updateCustomerProfileMutation.isPending}
                  onUpload={handleCustomerPhotoUpload}
                  onRemove={handleCustomerPhotoRemove}
                />
                <CustomerProfileForm
                  defaultValues={
                    customerProfile
                      ? {
                          firstName: customerProfile.firstName || "",
                          lastName: customerProfile.lastName || "",
                          phone: customerProfile.phone || "",
                          address: customerProfile.address,
                        }
                      : undefined
                  }
                  loading={isLoading || updateCustomerProfileMutation.isPending}
                  error={error instanceof Error ? error.message : updateCustomerProfileMutation.error instanceof Error ? updateCustomerProfileMutation.error.message : undefined}
                  onSubmit={handleCustomerProfileSubmit}
                />
              </Flex>
            </Box>
          </TabsContent>

          <TabsContent value="favorites">
            <Box pt="5">
              <FavoriteWelperList
                favorites={favoriteWelpers.map((f) => ({
                  id: f.id,
                  name: f.welper?.displayName || "Unknown Welper",
                  role: "Service Provider",
                  location: f.welper?.serviceArea?.centerAddress?.city || "Unknown",
                  rating: 4.5,
                  completedJobs: 10,
                }))}
                loading={isLoading}
                onRemove={async (id) => {
                  await removeFavoriteMutation.mutateAsync(id);
                }}
                onViewProfile={(id) => {
                  const fav = favoriteWelpers.find((f) => f.id === id);
                  if (fav?.welper?.id) {
                    router.push(`/dashboard/booking/new?welperId=${fav.welper.id}`);
                  }
                }}
                onQuickRebook={(id) => {
                  const fav = favoriteWelpers.find((f) => f.id === id);
                  if (fav?.welper?.id) {
                    router.push(`/dashboard/booking/new?welperId=${fav.welper.id}`);
                  }
                }}
              />
            </Box>
          </TabsContent>
        </Tabs>
        </Flex>
      </Container>
    );
  }

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="6">
        <Box>
          <Heading as="h1" size="7" mb="2" trim="start">
            {welperProfileLabels.title}
          </Heading>
          <Text as="p" size="2" color="gray" highContrast>
            {welperProfileLabels.subtitle}
          </Text>
        </Box>

        {(error || updateWelperProfileMutation.error) && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>
              {error instanceof Error
                ? error.message
                : updateWelperProfileMutation.error instanceof Error
                  ? updateWelperProfileMutation.error.message
                  : welperProfileLabels.loadError}
            </Callout.Text>
          </Callout.Root>
        )}

        <Tabs value={activeTab} onValueChange={handleWelperTabChange}>
          <TabsList>
            <TabsTrigger value="profile">{welperProfileLabels.tabs.profile}</TabsTrigger>
            <TabsTrigger value="offerings">{welperProfileLabels.tabs.offerings}</TabsTrigger>
            <TabsTrigger value="availability">{welperProfileLabels.tabs.availability}</TabsTrigger>
            <TabsTrigger value="serviceArea">{welperProfileLabels.tabs.serviceArea}</TabsTrigger>
            <TabsTrigger value="backgroundCheck">{welperProfileLabels.tabs.backgroundCheck}</TabsTrigger>
            <TabsTrigger value="payout">{welperProfileLabels.tabs.payout}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Box pt="5">
              <Flex direction="column" gap="4">
                <ProfilePhotoUpload
                  maxWidth="640px"
                  labels={profilePhotoUploadLabels}
                  enableCrop
                  required
                  currentPhotoUrl={welperProfile?.photoUrl ?? null}
                  currentPhotoAlt={
                    welperProfile?.firstName || welperProfile?.lastName
                      ? `${welperProfile.firstName ?? ""} ${welperProfile.lastName ?? ""}`.trim()
                      : welperProfileLabels.photo.alt
                  }
                  description={
                    welperSetupIncomplete
                      ? welperProfileLabels.photo.requiredDescription
                      : welperProfileLabels.photo.optionalDescription
                  }
                  loading={isLoading || updateWelperProfileMutation.isPending}
                  onUpload={handlePhotoUpload}
                  onRemove={
                    welperSetupIncomplete ? undefined : handlePhotoRemove
                  }
                />
                <WelperProfileForm
                  defaultValues={
                    welperProfile
                      ? {
                          firstName: welperProfile.firstName || "",
                          lastName: welperProfile.lastName || "",
                          phone: welperProfile.phoneNumber?.formatted || welperProfile.phoneNumber?.number || "",
                          photoUrl: welperProfile.photoUrl || null,
                          bio: welperProfile.bio || "",
                          profileVisibility: welperProfile.profileVisibility,
                        }
                      : undefined
                  }
                  loading={isLoading || updateWelperProfileMutation.isPending}
                  error={error instanceof Error ? error.message : updateWelperProfileMutation.error instanceof Error ? updateWelperProfileMutation.error.message : undefined}
                  onSubmit={handleWelperProfileSubmit}
                  labels={welperProfileFormLabels}
                />
              </Flex>
            </Box>
          </TabsContent>

          <TabsContent value="offerings">
            <Box pt="5">
              <ServiceOfferingList
                labels={{
                  listTitle: welperOfferingLabels.listTitle,
                  listDescription: welperOfferingLabels.listDescription,
                  addOffering: welperOfferingLabels.addOffering,
                  searchPlaceholder: welperOfferingLabels.searchPlaceholder,
                  active: welperOfferingLabels.active,
                  inactive: welperOfferingLabels.inactive,
                  edit: welperOfferingLabels.edit,
                  delete: welperOfferingLabels.delete,
                  activeLabel: welperOfferingLabels.activeLabel,
                  uncategorized: welperProfileLabels.uncategorized,
                  allCategories: welperOfferingLabels.allCategories,
                  allStatus: welperOfferingLabels.allStatus,
                  activeOnly: welperOfferingLabels.activeOnly,
                  inactiveOnly: welperOfferingLabels.inactiveOnly,
                  filterByCategoryAria: welperOfferingLabels.filterByCategoryAria,
                  filterByStatusAria: welperOfferingLabels.filterByStatusAria,
                  showingCount: welperOfferingLabels.showingCount,
                  noOfferingsFound: welperOfferingLabels.noOfferingsFound,
                  emptyFirst: welperOfferingLabels.emptyFirst,
                  emptyFiltered: welperOfferingLabels.emptyFiltered,
                }}
                offerings={serviceOfferings.map((o) => ({
                  id: o.id,
                  title: o.title,
                  categoryId: o.categoryId,
                  categoryName:
                    categoryNameById.get(o.categoryId) ??
                    (o.category?.name
                      ? categoryDisplayName(o.category.name)
                      : welperProfileLabels.uncategorized),
                  subcategories: (o.subcategoryIds ?? [])
                    .map((id) => {
                      const name = categoryNameById.get(id);
                      return name ? { id, name } : null;
                    })
                    .filter((sub): sub is { id: string; name: string } => sub !== null),
                  description: o.description,
                  hourlyRate: o.hourlyRate,
                  experienceYears: o.experienceYears,
                  active: Boolean(o.active),
                }))}
                serviceCategories={mainCategories.map((cat) => ({
                  id: cat.id,
                  name: categoryDisplayName(cat.name),
                }))}
                loading={isLoading}
                onAdd={handleAddServiceOffering}
                onEdit={handleEditServiceOffering}
                onDelete={handleDeleteServiceOffering}
                onToggleActive={handleToggleServiceOfferingActive}
              />
            </Box>
          </TabsContent>

          <TabsContent value="availability">
            <Box pt="5">
              <Flex gap="6" wrap="wrap" align="stretch">
                <Box flexGrow="2" flexShrink="1" style={{ flexBasis: "400px", minWidth: 0 }}>
                  <Flex direction="column" gap="6">
                    <TimeSlotAvailability
                      labels={{
                        regularTitle: welperAvailabilityLabels.regularTitle,
                        regularDescription: welperAvailabilityLabels.regularDescription,
                        addSlotsTitle: welperAvailabilityLabels.addSlotsTitle,
                        addSlotsHint: welperAvailabilityLabels.addSlotsHint,
                        startTime: welperAvailabilityLabels.startTime,
                        endTime: welperAvailabilityLabels.endTime,
                        addSlotsButton: welperAvailabilityLabels.addSlotsButton,
                        currentSlotsTitle: welperAvailabilityLabels.currentSlotsTitle,
                        to: welperAvailabilityLabels.to,
                        removeSlotAria: welperAvailabilityLabels.removeSlotAria,
                        emptyCallout: welperAvailabilityLabels.emptyCallout,
                        endAfterStart: welperAvailabilityLabels.endAfterStart,
                        dayNames: welperAvailabilityLabels.dayNames,
                      }}
                      defaultSchedule={availabilitySchedule || undefined}
                      loading={isLoading || updateAvailabilityMutation.isPending}
                      onChange={async (schedule) => {
                        if (!isWelper || !user?.id) return;
                        try {
                          await updateAvailabilityMutation.mutateAsync({
                            timeSlots: schedule.timeSlots,
                            recurringPattern: "weekly",
                            effectiveStartDate: schedule.effectiveStartDate,
                            effectiveEndDate: schedule.effectiveEndDate,
                          });
                        } catch (err) {
                          console.error("Failed to update availability:", err);
                        }
                      }}
                    />
                    {availabilitySchedule && (
                      <>
                        {!hasAvailabilityCalendar ? (
                          <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface" size="2">
                            <Callout.Text>
                              {welperProfileLabels.availability.calendarHint}
                            </Callout.Text>
                          </Callout.Root>
                        ) : (
                          <AvailabilityExceptions
                            labels={welperAvailabilityExceptionsLabels}
                            dateLocale={dateFnsLocale}
                            exceptions={availabilityExceptions}
                            holidays={holidaysForUi}
                            holidaysLoading={holidaysLoading}
                            loading={isLoading || addExceptionMutation.isPending || removeExceptionMutation.isPending}
                            onAdd={async (exception) => {
                              if (!calendarIdForExceptions) return;
                              try {
                                await addExceptionMutation.mutateAsync(exception);
                              } catch (err) {
                                console.error("Failed to add availability exception:", err);
                              }
                            }}
                            onRemove={async (id) => {
                              try {
                                await removeExceptionMutation.mutateAsync(id);
                              } catch (err) {
                                console.error("Failed to remove availability exception:", err);
                              }
                            }}
                            onUpdate={(exception) => {
                              // Update not implemented in API; user can remove and re-add
                              console.log("Update exception:", exception);
                            }}
                            onAddHoliday={async (holiday) => {
                              if (!calendarIdForExceptions) return;
                              try {
                                await addExceptionMutation.mutateAsync({
                                  date: holiday.date,
                                  endDate: holiday.endDate ?? undefined,
                                  available: false,
                                  reason: holiday.name,
                                });
                              } catch (err) {
                                console.error("Failed to add holiday as exception:", err);
                              }
                            }}
                          />
                        )}
                      </>
                    )}
                  </Flex>
                </Box>
                <Box flexGrow="1" flexShrink="1" style={{ flexBasis: "280px", minWidth: 0 }}>
                  <AvailabilityScheduleStats
                    timeSlots={availabilitySchedule?.timeSlots ?? []}
                    availabilityExceptions={availabilityExceptions}
                    labels={{
                      withExceptions: welperAvailabilityLabels.statsWithExceptions,
                      regularOnly: welperAvailabilityLabels.statsRegularOnly,
                      dayShort: welperAvailabilityLabels.dayLabels,
                    }}
                  />
                </Box>
              </Flex>
            </Box>
          </TabsContent>

          <TabsContent value="serviceArea">
            <Box pt="5">
              <ServiceAreaCard
                defaultArea={radiusServiceAreaForForm(welperProfile?.serviceArea)}
                loading={isLoading || updateWelperProfileMutation.isPending}
                onSave={handleServiceAreaSave}
                title={welperProfileLabels.serviceArea.title}
                description={welperProfileLabels.serviceArea.description}
                selectorLabels={welperServiceAreaLabels.selector}
                addressLabels={welperServiceAreaLabels.address}
                error={
                  updateWelperProfileMutation.error instanceof Error
                    ? updateWelperProfileMutation.error.message
                    : undefined
                }
              />
            </Box>
          </TabsContent>

          <TabsContent value="backgroundCheck">
            <Box pt="5">
              <WelperProfileBackgroundCheckPanel />
            </Box>
          </TabsContent>

          <TabsContent value="payout">
            <Box pt="5">
              <WelperProfilePayoutPanel />
            </Box>
          </TabsContent>
        </Tabs>

        {/* Service offering dialog */}
        <Dialog
          open={isServiceOfferingDialogOpen}
          onOpenChange={handleServiceOfferingDialogOpenChange}
        >
          <DialogContent
            title={
              editingOffering ? welperOfferingLabels.dialogEdit : welperOfferingLabels.dialogAdd
            }
          >
            <ServiceOfferingForm
              labels={welperOfferingFormLabels}
              defaultValues={editingOffering || undefined}
              loading={createServiceOfferingMutation.isPending || updateServiceOfferingMutation.isPending}
              error={
                createServiceOfferingMutation.error instanceof Error
                  ? createServiceOfferingMutation.error.message
                  : updateServiceOfferingMutation.error instanceof Error
                    ? updateServiceOfferingMutation.error.message
                    : undefined
              }
              onSubmit={handleServiceOfferingSubmit}
              serviceCategories={mainCategories}
              subcategories={subcategories}
              getCategoryDisplayName={categoryDisplayName}
              onCategoryChange={handleCategoryChange}
              defaultServiceArea={radiusServiceAreaForForm(welperProfile?.serviceArea)}
              inDialog={true}
            />
          </DialogContent>
        </Dialog>

        <ActionConfirmDialog
          open={pendingDeleteOfferingId !== null}
          onOpenChange={(open) => {
            if (!open) setPendingDeleteOfferingId(null);
          }}
          title={welperOfferingLabels.deleteTitle}
          description={welperOfferingLabels.deleteDescription}
          confirmLabel={welperOfferingLabels.deleteConfirm}
          cancelLabel={welperOfferingLabels.deleteCancel}
          variant="danger"
          pending={deleteServiceOfferingMutation.isPending}
          onConfirm={handleConfirmDeleteOffering}
        />
      </Flex>
    </Container>
  );
}
