import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { invalidateSetupChecklists } from "@/lib/hooks/use-signup";
import {
  getCustomerProfile,
  getWelperProfile,
  updateCustomerProfile,
  updateWelperProfile,
  getFavoriteWelpers,
  addFavoriteWelper,
  removeFavoriteWelper,
  getServicePreferences,
  updateServicePreferences,
  getServiceOfferings,
  createServiceOffering,
  updateServiceOffering,
  deleteServiceOffering,
  getAvailability,
  getAvailabilityExceptions,
  updateAvailability,
  addAvailabilityException,
  removeAvailabilityException,
  getHolidays,
} from "@/lib/services/profile-service";

/** Only run authenticated API queries when the client session is ready (avoids NO_TOKEN before NextAuth hydrates). */
function useIsAuthenticated(): boolean {
  const { status } = useSession();
  return status === "authenticated";
}

// Customer Profile
export function useCustomerProfile(userId: string, enabled: boolean = true) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["customerProfile", userId],
    queryFn: () => getCustomerProfile(userId),
    enabled: !!userId && enabled && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Parameters<typeof updateCustomerProfile>[1] }) =>
      updateCustomerProfile(userId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["customerProfile", variables.userId], data);
      void invalidateSetupChecklists(queryClient);
    },
  });
}

// Welper Profile
export function useWelperProfile(userId: string, enabled: boolean = true) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["welperProfile", userId],
    queryFn: () => getWelperProfile(userId),
    enabled: !!userId && enabled && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateWelperProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Parameters<typeof updateWelperProfile>[1] }) =>
      updateWelperProfile(userId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["welperProfile", variables.userId], data);
      void invalidateSetupChecklists(queryClient);
    },
  });
}

// Favorites
export function useFavoriteWelpers(customerId: string) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["favoriteWelpers", customerId],
    queryFn: () => getFavoriteWelpers(customerId),
    enabled: !!customerId && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddFavoriteWelper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, welperId, notes }: { customerId: string; welperId: string; notes?: string }) =>
      addFavoriteWelper(customerId, welperId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoriteWelpers"] });
    },
  });
}

export function useRemoveFavoriteWelper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (favoriteId: string) => removeFavoriteWelper(favoriteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoriteWelpers"] });
    },
  });
}

// Service Preferences
export function useServicePreferences(customerId: string) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["servicePreferences", customerId],
    queryFn: () => getServicePreferences(customerId),
    enabled: !!customerId && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateServicePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      preferences,
    }: {
      userId: string;
      preferences: Parameters<typeof updateServicePreferences>[1];
    }) => updateServicePreferences(userId, preferences),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["servicePreferences", variables.userId] });
    },
  });
}

// Service Offerings
export function useServiceOfferings(welperId: string) {
  const isAuthenticated = useIsAuthenticated();
  const query = useQuery({
    queryKey: ["serviceOfferings", welperId],
    queryFn: () => getServiceOfferings(welperId),
    enabled: !!welperId && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // Ensure data is always an array, even when query is disabled
  return {
    ...query,
    data: Array.isArray(query.data) ? query.data : [],
  };
}

export function useCreateServiceOffering() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ welperId, data }: { welperId: string; data: Parameters<typeof createServiceOffering>[1] }) =>
      createServiceOffering(welperId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["serviceOfferings", variables.welperId] });
      void invalidateSetupChecklists(queryClient);
    },
  });
}

export function useUpdateServiceOffering() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ offeringId, data }: { offeringId: string; data: Parameters<typeof updateServiceOffering>[1] }) =>
      updateServiceOffering(offeringId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceOfferings"] });
      void invalidateSetupChecklists(queryClient);
    },
  });
}

export function useDeleteServiceOffering() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (offeringId: string) => deleteServiceOffering(offeringId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceOfferings"] });
      void invalidateSetupChecklists(queryClient);
    },
  });
}

// Availability
export function useAvailability(welperId: string) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["availability", welperId],
    queryFn: () => getAvailability(welperId),
    enabled: !!welperId && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAvailabilityExceptions(calendarId: string) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["availabilityExceptions", calendarId],
    queryFn: () => getAvailabilityExceptions(calendarId),
    enabled: !!calendarId && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateAvailability(welperId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (schedule: Parameters<typeof updateAvailability>[1]) =>
      updateAvailability(welperId, schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", welperId] });
      void invalidateSetupChecklists(queryClient);
    },
  });
}

export function useAddAvailabilityException(calendarId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exception: Parameters<typeof addAvailabilityException>[1]) =>
      addAvailabilityException(calendarId, exception),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availabilityExceptions", calendarId] });
    },
  });
}

export function useRemoveAvailabilityException(calendarId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exceptionId: string) => removeAvailabilityException(exceptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availabilityExceptions", calendarId] });
    },
  });
}

export function useHolidays(params: {
  countryCode: string;
  provinceCode?: string | null;
  from?: string;
  to?: string;
}) {
  const { countryCode, provinceCode, from, to } = params;
  return useQuery({
    queryKey: ["holidays", countryCode, provinceCode ?? null, from ?? null, to ?? null],
    queryFn: () => getHolidays({ countryCode, provinceCode, from, to }),
    enabled: !!countryCode,
    staleTime: 24 * 60 * 60 * 1000, // 24h for reference data
  });
}
