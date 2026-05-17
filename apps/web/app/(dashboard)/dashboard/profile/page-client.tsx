"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  useServicePreferences,
  useUpdateServicePreferences,
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
  ServicePreferences,
  ProfileCompletionStatus,
  ServiceAreaCard,
} from "./profile-forms-lazy";
import { Dialog, DialogContent } from "@welpco/ui/dialog";
import { Card } from "@welpco/ui/card";
import { Callout } from "@welpco/ui/callout";
import {
  resolveServiceAreaRadiusKm,
  type ServiceArea,
} from "@welpco/ui/platform/profile-management";
import type {
  CustomerProfileValues,
  WelperProfileValues,
  ServicePreferencesValues,
  ServiceOfferingValues,
} from "@welpco/ui/platform/profile-management";
import type { ServiceArea as AppServiceArea } from "@/types";

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

export default function ProfilePageClient({ user: serverUser }: ProfilePageClientProps) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { user } = useDashboardUser(serverUser);

  // Only run profile API calls when session is ready (avoids "No access token" and infinite loading)
  const sessionReady = sessionStatus === "authenticated";

  const [activeTab, setActiveTab] = useState("overview");
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
  const favoriteWelpers = Array.isArray(favoriteWelpersRaw) ? favoriteWelpersRaw : [];
  const { data: servicePreferences } = useServicePreferences(isCustomer && sessionReady ? user.id : "");
  const { data: serviceOfferings = [] } = useServiceOfferings(isWelper && sessionReady ? user.id : "");
  const { data: availabilitySchedule } = useAvailability(isWelper && sessionReady ? user.id : "");
  const { data: availabilityExceptions = [] } = useAvailabilityExceptions(
    sessionReady && availabilitySchedule?.id ? availabilitySchedule.id : ""
  );

  // Memoize active offerings count to avoid recalculation on every render
  const activeOfferingsCount = useMemo(
    () => serviceOfferings.filter(o => o.active).length,
    [serviceOfferings]
  );

  const updateCustomerProfileMutation = useUpdateCustomerProfile();
  const updateServicePreferencesMutation = useUpdateServicePreferences();
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
            title: values.title || "Service",
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

    const handleServicePreferencesSubmit = async (values: ServicePreferencesValues) => {
      if (!user) return;
      await updateServicePreferencesMutation.mutateAsync({
        userId: user.id,
        preferences: {
          preferredCategories: values.preferredCategories,
        },
      });
    };

    // Calculate profile completion steps
    const profileSteps = [
      {
        id: "name",
        label: "Name",
        completed: !!(customerProfile?.firstName && customerProfile?.lastName),
        required: true,
      },
      {
        id: "phone",
        label: "Phone number",
        completed: !!customerProfile?.phone,
        required: true,
      },
      {
        id: "address",
        label: "Address",
        completed: !!customerProfile?.address?.streetAddress,
        required: true,
      },
      {
        id: "payment",
        label: "Payment method",
        completed: !!customerProfile?.hasDefaultPaymentMethod,
        required: true,
      },
      {
        id: "preferences",
        label: "Service preferences",
        // Don't claim "complete" just because the row exists — only when at least
        // one preferred category is set (matches what the form's zod schema requires).
        completed: (servicePreferences?.preferredCategories?.length ?? 0) > 0,
        required: false,
      },
      {
        id: "photo",
        label: "Profile photo",
        completed: !!customerProfile?.photoUrl,
        required: false,
      },
    ];

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

        {(error ||
          updateCustomerProfileMutation.error ||
          updateServicePreferencesMutation.error) && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>
              {error instanceof Error
                ? error.message
                : updateCustomerProfileMutation.error instanceof Error
                  ? updateCustomerProfileMutation.error.message
                  : updateServicePreferencesMutation.error instanceof Error
                    ? updateServicePreferencesMutation.error.message
                    : "We couldn't load your profile. Try again in a moment."}
            </Callout.Text>
          </Callout.Root>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="personal">Personal info</TabsTrigger>
            <TabsTrigger value="preferences">Service preferences</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Box pt="5">
              <Flex direction="column" gap="4">
                <ProfileCompletionStatus
                  profileType={isCustomer ? "customer" : "welper"}
                  steps={profileSteps}
                  onCompleteStep={(stepId) => {
                    if (stepId === "payment") {
                      router.push("/dashboard/settings?tab=payment");
                      return;
                    }
                    setActiveTab(
                      stepId === "name" || stepId === "phone" || stepId === "address" || stepId === "photo"
                        ? "personal"
                        : stepId === "preferences"
                          ? "preferences"
                          : "overview"
                    );
                  }}
                />
                <Card size="3" variant="surface">
                  <Flex direction="column" gap="3">
                    <Heading size="5" mb="0" trim="start">Quick stats</Heading>
                    <Flex gap="6" wrap="wrap">
                      <Box>
                        <Text size="1" color="gray" highContrast as="div">Payment method</Text>
                        <Text size="4" weight="bold" as="div">
                          {customerProfile?.hasDefaultPaymentMethod ? "Saved" : "Not added"}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="1" color="gray" highContrast as="div">Service preferences</Text>
                        <Text size="4" weight="bold" as="div">
                          {servicePreferences ? servicePreferences.preferredCategories.length : 0}
                        </Text>
                      </Box>
                    </Flex>
                  </Flex>
                </Card>
              </Flex>
            </Box>
          </TabsContent>

          <TabsContent value="personal">
            <Box pt="5">
              <Flex direction="column" gap="4">
                <ProfilePhotoUpload
                  maxWidth="640px"
                  currentPhotoUrl={customerProfile?.photoUrl ?? null}
                  currentPhotoAlt={
                    customerProfile?.firstName
                      ? `${customerProfile.firstName} profile photo`
                      : "Profile photo"
                  }
                  description="Upload a clear photo of yourself. It appears on your profile and helps Welpers recognize you."
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

          <TabsContent value="preferences">
            <Box pt="5">
              <ServicePreferences
                defaultValues={
                  servicePreferences
                    ? { preferredCategories: servicePreferences.preferredCategories }
                    : undefined
                }
                loading={isLoading || updateServicePreferencesMutation.isPending}
                error={
                  error instanceof Error
                    ? error.message
                    : typeof error === "string"
                      ? error
                      : updateServicePreferencesMutation.error instanceof Error
                        ? updateServicePreferencesMutation.error.message
                        : undefined
                }
                onSubmit={handleServicePreferencesSubmit}
              />
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

  // Welper Profile Tabs - handlers defined above (before conditional returns)
  // Calculate profile completion steps for welper
  const welperProfileSteps = [
    {
      id: "bio",
      label: "Bio",
      completed: !!welperProfile?.bio,
      required: true,
    },
    {
      id: "photo",
      label: "Profile photo",
      completed: !!welperProfile?.photoUrl,
      required: false,
    },
    {
      id: "serviceArea",
      label: "Service area",
      completed: !!welperProfile?.serviceArea,
      required: true,
    },
    {
      id: "serviceOfferings",
      label: "Service offerings",
      completed: serviceOfferings.length > 0,
      required: true,
    },
    {
      id: "availability",
      label: "Availability",
      completed: !!availabilitySchedule,
      required: false,
    },
  ];

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="6">
        <Box>
          <Heading as="h1" size="7" mb="2" trim="start">
            Profile
          </Heading>
          <Text as="p" size="2" color="gray" highContrast>
            Manage your Welper profile and service offerings.
          </Text>
        </Box>

        {(error || updateWelperProfileMutation.error) && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>
              {error instanceof Error
                ? error.message
                : updateWelperProfileMutation.error instanceof Error
                  ? updateWelperProfileMutation.error.message
                  : "We couldn't load your profile. Try again in a moment."}
            </Callout.Text>
          </Callout.Root>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="offerings">Service offerings</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="serviceArea">Service area</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Box pt="5">
              <Flex direction="column" gap="4">
                <ProfileCompletionStatus
                  profileType="welper"
                  steps={welperProfileSteps}
                  onCompleteStep={(stepId) => {
                    const tabMap: Record<string, string> = {
                      bio: "profile",
                      photo: "profile",
                      serviceArea: "serviceArea",
                      hourlyRate: "profile",
                      serviceOfferings: "offerings",
                      availability: "availability",
                    };
                    setActiveTab(tabMap[stepId] || "overview");
                  }}
                />
                <Card size="3" variant="surface">
                  <Flex direction="column" gap="3">
                    <Heading size="5" mb="0" trim="start">Quick stats</Heading>
                    <Flex gap="6" wrap="wrap">
                      <Box>
                        <Text size="1" color="gray" highContrast as="div">Service offerings</Text>
                        <Text size="4" weight="bold" as="div">{serviceOfferings.length}</Text>
                      </Box>
                      <Box>
                        <Text size="1" color="gray" highContrast as="div">Active offerings</Text>
                        <Text size="4" weight="bold" as="div">{activeOfferingsCount}</Text>
                      </Box>
                    </Flex>
                  </Flex>
                </Card>
              </Flex>
            </Box>
          </TabsContent>

          <TabsContent value="profile">
            <Box pt="5">
              <Flex direction="column" gap="4">
                <ProfilePhotoUpload
                  maxWidth="640px"
                  currentPhotoUrl={welperProfile?.photoUrl ?? null}
                  currentPhotoAlt={
                    welperProfile?.firstName || welperProfile?.lastName
                      ? `${welperProfile.firstName ?? ""} ${welperProfile.lastName ?? ""}`.trim()
                      : "Profile photo"
                  }
                  description="Upload a clear photo of yourself. It appears on your public profile and helps customers recognize you."
                  loading={isLoading || updateWelperProfileMutation.isPending}
                  onUpload={handlePhotoUpload}
                  onRemove={handlePhotoRemove}
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
                />
              </Flex>
            </Box>
          </TabsContent>

          <TabsContent value="offerings">
            <Box pt="5">
              <ServiceOfferingList
                offerings={serviceOfferings.map((o) => ({
                  id: o.id,
                  title: o.title,
                  category: o.category?.name || o.categoryId,
                  description: o.description,
                  hourlyRate: o.hourlyRate,
                  experienceYears: o.experienceYears,
                  active: Boolean(o.active),
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
                              Add at least one time slot to your weekly schedule above. Once you have a regular schedule, you can mark exceptions like holidays or time off.
                            </Callout.Text>
                          </Callout.Root>
                        ) : (
                          <AvailabilityExceptions
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
                error={
                  updateWelperProfileMutation.error instanceof Error
                    ? updateWelperProfileMutation.error.message
                    : undefined
                }
              />
            </Box>
          </TabsContent>
        </Tabs>

        {/* Service offering dialog */}
        <Dialog
          open={isServiceOfferingDialogOpen}
          onOpenChange={handleServiceOfferingDialogOpenChange}
        >
          <DialogContent title={editingOffering ? "Edit service offering" : "Add service offering"}>
            <ServiceOfferingForm
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
          title="Delete this service offering?"
          description="Customers won't be able to book this service. You can recreate it any time."
          confirmLabel="Delete offering"
          cancelLabel="Keep offering"
          variant="danger"
          pending={deleteServiceOfferingMutation.isPending}
          onConfirm={handleConfirmDeleteOffering}
        />
      </Flex>
    </Container>
  );
}
