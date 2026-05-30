import { apiClient } from "@/lib/api/client";
import type {
  CustomerProfile,
  WelperProfile,
  ServiceOffering,
  AvailabilitySchedule,
  AvailabilityException,
  FavoriteWelper,
  Holiday,
  ServicePreferences,
  Address,
  ServiceArea,
  PhoneNumber,
} from "@/types";
import {
  mapCustomerProfileFromApi,
  mapCustomerProfileAfterUpdate,
  mapWelperProfileFromApi,
} from "@/lib/services/profile-api-mappers";

function getErrorStatusCode(error: unknown): number | undefined {
  if (error && typeof error === "object" && "statusCode" in error) {
    const v = (error as { statusCode: unknown }).statusCode;
    return typeof v === "number" ? v : undefined;
  }
  return undefined;
}

// Customer Profile
// Note: This calls /api/profiles/me which returns the profile for the authenticated user (from JWT).
// The userId parameter is accepted for cache-key compatibility but is NOT sent to the API.
export const getCustomerProfile = async (_userId?: string): Promise<CustomerProfile | null> => {
  try {
    const response = await apiClient.get<unknown>("/api/profiles/me");
    return mapCustomerProfileFromApi(response);
  } catch (error: unknown) {
    const code = getErrorStatusCode(error);
    if (code === 401 || code === 404) {
      return null;
    }
    throw error;
  }
};

export async function updateCustomerProfile(
  userId: string,
  data: Partial<CustomerProfile>
): Promise<CustomerProfile> {
  try {
    const updateData: Record<string, unknown> = {
      firstName: data.firstName,
      lastName: data.lastName,
    };
    
    // Convert phone string to PhoneNumber object if needed
    if (data.phone && typeof data.phone === "string") {
      const phoneString = data.phone;
      const countryCode = phoneString.startsWith("+")
        ? phoneString.match(/^\+(\d{1,3})/)?.[0] || "+1"
        : "+1";
      // Strip the country code digits from the front, then take the local number
      const countryDigits = countryCode.replace(/\D/g, "");
      const allDigits = phoneString.replace(/\D/g, "");
      const localDigits = allDigits.startsWith(countryDigits)
        ? allDigits.slice(countryDigits.length)
        : allDigits;

      updateData.phoneNumber = {
        countryCode,
        number: localDigits,
        formatted: phoneString,
      };
    }
    
    // Convert address format: stateProvince -> state, zipPostalCode -> zipCode
    if (data.address) {
      updateData.address = {
        streetAddress: data.address.streetAddress || "",
        city: data.address.city || "",
        state: data.address.stateProvince || "", // Map stateProvince to state
        zipCode: data.address.zipPostalCode || "", // Map zipPostalCode to zipCode
        country: data.address.country || "CA",
      };
    }

    if (data.photoUrl !== undefined) {
      updateData.profilePhotoUrl = data.photoUrl;
    }

    const response = await apiClient.put<unknown>("/api/profiles/me", updateData);
    const profile = mapCustomerProfileAfterUpdate(response, data.address);
    if (!profile) {
      throw new Error("Invalid profile response from server.");
    }
    return profile;
  } catch (error: unknown) {
    const code = getErrorStatusCode(error);
    if (code === 401) {
      throw new Error("Your session has expired. Please sign in again to update your profile.");
    }
    if (code === 403) {
      throw new Error("You don't have permission to update this profile.");
    }
    if (code === 404) {
      throw new Error("Profile not found. Please complete onboarding first.");
    }
    throw error;
  }
}

// Welper Profile
// Note: This calls /api/profiles/me which returns the appropriate profile type based on the user's role in the JWT token
// The backend (BFF) determines whether to return a customer or welper profile
// Note: userId is accepted for cache-key compatibility but is NOT sent to the API.
export const getWelperProfile = async (_userId?: string): Promise<WelperProfile | null> => {
  try {
    const response = await apiClient.get<unknown>("/api/profiles/me");
    return mapWelperProfileFromApi(response);
  } catch (error: unknown) {
    const code = getErrorStatusCode(error);
    if (code === 401 || code === 404) {
      return null;
    }
    throw error;
  }
};

export async function updateWelperProfile(
  userId: string,
  data: Partial<WelperProfile>
): Promise<WelperProfile> {
  try {
    // Map frontend format to backend DTO format
    // Backend UpdateWelperProfileDto ONLY accepts: firstName, lastName, phoneNumber, bio, profilePhotoUrl, serviceArea, profileVisibility
    // Backend does NOT accept: displayName, photoUrl, id, userId, createdAt, updatedAt, profileCompletionStatus
    // Backend does NOT accept customer fields: address
    
    // Create a clean update object with ONLY the fields the backend accepts
    // Build it explicitly to ensure no extra fields are included
    const updateData: {
      firstName?: string | null;
      lastName?: string | null;
      phoneNumber?: PhoneNumber | null;
      bio?: string;
      profilePhotoUrl?: string | null;
      serviceArea?: ServiceArea;
      profileVisibility?: "Public" | "Private";
    } = {};
    
    // Only include fields that exist in UpdateWelperProfileDto
    // Explicitly check each field to avoid sending invalid data
    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName || null;
    }
    
    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName || null;
    }
    
    if (data.phoneNumber !== undefined) {
      updateData.phoneNumber = data.phoneNumber || null;
    }
    
    if (data.bio !== undefined && typeof data.bio === 'string') {
      updateData.bio = data.bio;
    }
    
    // Map photoUrl to profilePhotoUrl (backend field name)
    if (data.photoUrl !== undefined) {
      updateData.profilePhotoUrl = data.photoUrl || null;
    }
    
    if (data.serviceArea !== undefined && data.serviceArea !== null) {
      updateData.serviceArea = data.serviceArea;
    }
    
    if (data.profileVisibility !== undefined) {
      updateData.profileVisibility = data.profileVisibility;
    }
    
    // Final validation: ensure updateData only contains allowed fields
    // This is a safety check to prevent any accidental field inclusion
    const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'bio', 'profilePhotoUrl', 'serviceArea', 'profileVisibility'] as const;
    const finalUpdateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updateData && updateData[key as keyof typeof updateData] !== undefined) {
        finalUpdateData[key] = updateData[key as keyof typeof updateData];
      }
    }

    const response = await apiClient.put<unknown>("/api/profiles/me", finalUpdateData);
    const profile = mapWelperProfileFromApi(
      response,
      data.displayName ? { displayNameOverride: data.displayName } : undefined,
    );
    if (!profile) {
      throw new Error("Invalid profile response from server.");
    }
    return profile;
  } catch (error: unknown) {
    const code = getErrorStatusCode(error);
    if (code === 401) {
      throw new Error("Your session has expired. Please sign in again to update your profile.");
    }
    if (code === 403) {
      throw new Error("You don't have permission to update this profile.");
    }
    if (code === 404) {
      throw new Error("Profile not found. Please complete onboarding first.");
    }
    throw error;
  }
}

// Service Offerings
// Using React.cache() for per-request deduplication when called from server components
export const getServiceOfferings = async (welperId: string): Promise<ServiceOffering[]> => {
  try {
    const response = await apiClient.get<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>("/api/profiles/me/services");
    
    // Backend returns paginated response, extract the data array
    const offerings = response.data || [];
    
    // Map backend format to frontend format
    return offerings.map((item) => ({
      id: item.id,
      welperId: item.welperId,
      title: item.serviceDescription?.split('.')[0] || 'Service', // Use first sentence as title
      categoryId: item.serviceCategoryId,
      description: item.serviceDescription || '',
      hourlyRate: item.hourlyRate || 0,
      experienceYears: item.experienceYears || 1,
      serviceArea: item.serviceArea || undefined,
      serviceAreaOverride: !!item.serviceArea,
      subcategoryIds: item.subcategoryIds || [],
      active: Boolean(item.active ?? true), // Explicit boolean conversion to handle string/number values
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    }));
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 404) {
      return [];
    }
    throw error;
  }
};

export async function createServiceOffering(
  welperId: string,
  data: Omit<ServiceOffering, "id" | "welperId" | "createdAt" | "updatedAt">
): Promise<ServiceOffering> {
  // Map frontend format to backend DTO format
  // Always include active explicitly to ensure it's sent correctly
  const backendData: any = {
    serviceCategoryId: data.categoryId,
    serviceDescription: data.description,
    hourlyRate: data.hourlyRate,
    experienceYears: data.experienceYears || 1,
    serviceArea: data.serviceAreaOverride ? data.serviceArea : undefined,
    subcategoryIds: data.subcategoryIds || [],
  };
  
  // Always include active - if undefined, default to true
  backendData.active = data.active !== undefined ? data.active : true;
  
  const response = await apiClient.post<any>("/api/profiles/me/services", backendData);
  
  // Map backend response to frontend format
  return {
    id: response.id,
    welperId: response.welperId,
    title: response.serviceDescription?.split('.')[0] || 'Service',
    categoryId: response.serviceCategoryId,
    description: response.serviceDescription || '',
    hourlyRate: response.hourlyRate,
    experienceYears: response.experienceYears || 1,
    serviceArea: response.serviceArea || undefined,
    serviceAreaOverride: !!response.serviceArea,
    subcategoryIds: response.subcategoryIds || [],
    active: Boolean(response.active ?? true), // Explicit boolean conversion
    createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
    updatedAt: response.updatedAt ? new Date(response.updatedAt) : new Date(),
  };
}

export async function updateServiceOffering(
  offeringId: string,
  data: Partial<ServiceOffering>
): Promise<ServiceOffering> {
  // Map frontend format to backend DTO format
  const backendData: any = {};
  if (data.categoryId !== undefined) backendData.serviceCategoryId = data.categoryId;
  if (data.description !== undefined) backendData.serviceDescription = data.description;
  if (data.hourlyRate !== undefined) backendData.hourlyRate = data.hourlyRate;
  if (data.experienceYears !== undefined) backendData.experienceYears = data.experienceYears;
  if (data.serviceArea !== undefined) backendData.serviceArea = data.serviceAreaOverride ? data.serviceArea : undefined;
  if (data.subcategoryIds !== undefined) backendData.subcategoryIds = data.subcategoryIds;
  if (data.active !== undefined) backendData.active = data.active;
  
  const response = await apiClient.put<any>(`/api/profiles/me/services/${offeringId}`, backendData);
  
  // Map backend response to frontend format
  return {
    id: response.id,
    welperId: response.welperId,
    title: response.serviceDescription?.split('.')[0] || 'Service',
    categoryId: response.serviceCategoryId,
    description: response.serviceDescription || '',
    hourlyRate: response.hourlyRate,
    experienceYears: response.experienceYears || 1,
    serviceArea: response.serviceArea || undefined,
    serviceAreaOverride: !!response.serviceArea,
    subcategoryIds: response.subcategoryIds || [],
    active: Boolean(response.active ?? true), // Explicit boolean conversion
    createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
    updatedAt: response.updatedAt ? new Date(response.updatedAt) : new Date(),
  };
}

export async function deleteServiceOffering(offeringId: string): Promise<void> {
  await apiClient.delete(`/api/profiles/me/services/${offeringId}`);
}

// Availability - GET/PUT /api/profiles/me/availability (BFF)
// Using React.cache() for per-request deduplication when called from server components
export const getAvailability = async (welperId: string): Promise<AvailabilitySchedule | null> => {
  try {
    const response = await apiClient.get<AvailabilitySchedule>("/api/profiles/me/availability");
    return response;
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 404) {
      return null;
    }
    throw error;
  }
};

export async function updateAvailability(
  welperId: string,
  schedule: Partial<AvailabilitySchedule>
): Promise<AvailabilitySchedule> {
  const response = await apiClient.put<AvailabilitySchedule>("/api/profiles/me/availability", schedule);
  return response;
}

// Using React.cache() for per-request deduplication when called from server components
export const getAvailabilityExceptions = async (
  calendarId: string
): Promise<AvailabilityException[]> => {
  try {
    const url = calendarId
      ? `/api/profiles/me/availability/exceptions?calendarId=${encodeURIComponent(calendarId)}`
      : "/api/profiles/me/availability/exceptions";
    const response = await apiClient.get<AvailabilityException[]>(url);
    return response;
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 404) {
      return [];
    }
    throw error;
  }
};

/** Format date as YYYY-MM-DD using UTC components. Use when sending date-only values to the API so the selected calendar day is preserved (date inputs create UTC-midnight Date). */
function formatDateForApi(date: Date | string): string {
  if (typeof date === "string") return date.slice(0, 10);
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function addAvailabilityException(
  calendarId: string,
  exception: Omit<AvailabilityException, "id" | "calendarId" | "createdAt">
): Promise<AvailabilityException> {
  const body: Record<string, unknown> = {
    ...exception,
    calendarId,
    date: formatDateForApi(exception.date),
  };
  if (exception.endDate) {
    body.endDate = formatDateForApi(exception.endDate);
  }
  const response = await apiClient.post<AvailabilityException>("/api/profiles/me/availability/exceptions", body);
  return response;
}

export async function removeAvailabilityException(exceptionId: string): Promise<void> {
  await apiClient.delete(`/api/profiles/me/availability/exceptions/${exceptionId}`);
}

export interface GetHolidaysParams {
  countryCode: string;
  provinceCode?: string | null;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

export async function getHolidays(params: GetHolidaysParams): Promise<Holiday[]> {
  const search = new URLSearchParams();
  search.set("countryCode", params.countryCode);
  if (params.provinceCode) search.set("provinceCode", params.provinceCode);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const response = await apiClient.get<Holiday[]>(`/api/content/holidays?${search.toString()}`);
  return Array.isArray(response) ? response : [];
}

// Favorite Welpers
export type FavoriteWelpersList = {
  items: FavoriteWelper[];
  total: number;
};

export const getFavoriteWelpers = async (_customerId: string): Promise<FavoriteWelpersList> => {
  try {
    const response = await apiClient.get<
      FavoriteWelper[] | { data?: FavoriteWelper[]; total?: number }
    >("/api/profiles/me/favorites");
    if (Array.isArray(response)) {
      return { items: response, total: response.length };
    }
    const items = Array.isArray(response?.data) ? response.data : [];
    const total = typeof response?.total === "number" ? response.total : items.length;
    return { items, total };
  } catch (error: unknown) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? (error as { statusCode?: number }).statusCode
        : undefined;
    if (statusCode === 401 || statusCode === 404) {
      return { items: [], total: 0 };
    }
    throw error;
  }
};

export async function addFavoriteWelper(
  customerId: string,
  welperId: string,
  notes?: string
): Promise<FavoriteWelper> {
  const response = await apiClient.post<FavoriteWelper>("/api/profiles/me/favorites", { welperId, notes });
  return response;
}

export async function removeFavoriteWelper(favoriteId: string): Promise<void> {
  await apiClient.delete(`/api/profiles/me/favorites/${favoriteId}`);
}

export const getServicePreferences = async (
  _customerId?: string
): Promise<ServicePreferences | null> => {
  try {
    const response = await apiClient.get<ServicePreferences>("/api/profiles/me/preferences");
    return response;
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403 || error.statusCode === 404) {
      return null;
    }
    throw error;
  }
};

export async function updateServicePreferences(
  customerId: string,
  preferences: Partial<ServicePreferences>
): Promise<ServicePreferences> {
  const response = await apiClient.put<ServicePreferences>("/api/profiles/me/preferences", preferences);
  return response;
}

