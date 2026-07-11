import type { Address, CustomerProfile, WelperProfile } from "@/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** BFF stores INCOMPLETE/COMPLETE; UI uses Incomplete/Complete labels. */
export function normalizeProfileCompletionStatusLabel(
  status?: string,
): string | undefined {
  if (!status) return undefined;
  if (status === "COMPLETE" || status === "Complete") return "Complete";
  if (status === "INCOMPLETE" || status === "Incomplete") return "Incomplete";
  if (status === "PENDING_REVIEW") return "PendingReview";
  return status;
}

/** BFF stores PUBLIC/PRIVATE; UI types use Public/Private. */
export function normalizeProfileVisibility(visibility?: string): "Public" | "Private" {
  if (visibility === "PRIVATE" || visibility === "Private") return "Private";
  return "Public";
}

/** Narrow shape for BFF `/api/profiles/me` customer payload */
export interface CustomerProfileMeApi {
  id?: string;
  customerId?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string | null;
  phoneNumber?: { formatted?: string; number?: string } | null;
  address?: Record<string, unknown> | null;
  profileCompletionStatus?: string;
  hasDefaultPaymentMethod?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Narrow shape for BFF `/api/profiles/me` welper payload */
export interface WelperProfileMeApi {
  id?: string;
  welperId?: string;
  userId?: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: WelperProfile["phoneNumber"];
  displayName?: string;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  serviceArea?: WelperProfile["serviceArea"] | null;
  profileVisibility?: string;
  /** Wave 1 trust aggregates from the hydrated /me payload. */
  averageRating?: number | null;
  reviewCount?: number;
  responseTimeMinutes?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export function normalizeAddressFromApi(raw: unknown): Address {
  if (!isRecord(raw)) {
    return { streetAddress: "", city: "", stateProvince: "", zipPostalCode: "", country: "" };
  }
  const state = raw.state ?? raw.stateProvince;
  const zip = raw.zipCode ?? raw.zipPostalCode;
  return {
    streetAddress: String(raw.streetAddress ?? ""),
    city: String(raw.city ?? ""),
    stateProvince: typeof state === "string" ? state : "",
    zipPostalCode: typeof zip === "string" ? zip : "",
    country: typeof raw.country === "string" ? raw.country : "",
  };
}

export function mapCustomerProfileFromApi(response: unknown): CustomerProfile | null {
  if (!isRecord(response) || Object.keys(response).length === 0) {
    return null;
  }
  const r = response as CustomerProfileMeApi;
  if (!r.id && !r.customerId) {
    return null;
  }

  const id = r.id ?? "";
  const userId = (r.customerId ?? r.userId) as string;

  const profile: CustomerProfile = {
    id,
    userId,
    firstName: r.firstName ?? "",
    lastName: r.lastName ?? "",
    photoUrl: r.profilePhotoUrl ?? null,
    phone: r.phoneNumber?.formatted ?? r.phoneNumber?.number ?? "",
    address: r.address ? normalizeAddressFromApi(r.address) : emptyAddress(),
    profileCompletionStatusLabel: normalizeProfileCompletionStatusLabel(
      typeof r.profileCompletionStatus === "string" ? r.profileCompletionStatus : undefined,
    ),
    hasDefaultPaymentMethod: !!r.hasDefaultPaymentMethod,
    profileCompletionStatus: {
      name: !!(r.firstName && r.lastName),
      phone: !!r.phoneNumber,
      address: !!r.address,
      paymentMethod: !!r.hasDefaultPaymentMethod,
      photo: !!r.profilePhotoUrl,
    },
    createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
    updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
  };

  if (!profile.id || !profile.userId) {
    return null;
  }
  return profile;
}

function emptyAddress(): Address {
  return { streetAddress: "", city: "", stateProvince: "", zipPostalCode: "", country: "" };
}

/** PUT /profiles/me may omit `address` in the body; keep the submitted address when absent. */
export function mapCustomerProfileAfterUpdate(
  response: unknown,
  submittedAddress: Address | undefined,
): CustomerProfile | null {
  const mapped = mapCustomerProfileFromApi(response);
  if (!mapped) return null;
  const r = response as CustomerProfileMeApi;
  if (!r.address && submittedAddress) {
    return { ...mapped, address: submittedAddress };
  }
  return mapped;
}

export function mapWelperProfileFromApi(
  response: unknown,
  opts?: { displayNameOverride?: string | null },
): WelperProfile | null {
  if (!isRecord(response) || Object.keys(response).length === 0) {
    return null;
  }
  const r = response as WelperProfileMeApi;
  if (!r.id && !r.welperId && !r.userId) {
    return null;
  }

  const id = r.id ?? "";
  const userId = (r.welperId ?? r.userId) as string;

  const displayName =
    opts?.displayNameOverride ??
    r.displayName ??
    r.firstName ??
    (typeof r.bio === "string" ? r.bio.split(" ")[0] : undefined) ??
    "Welper";

  const profile: WelperProfile = {
    id,
    userId,
    firstName: r.firstName ?? null,
    lastName: r.lastName ?? null,
    phoneNumber: r.phoneNumber ?? null,
    displayName,
    bio: r.bio ?? "",
    photoUrl: r.profilePhotoUrl ?? null,
    serviceArea: r.serviceArea ?? { type: "radius", radiusKm: 25 },
    profileVisibility: normalizeProfileVisibility(
      typeof r.profileVisibility === "string" ? r.profileVisibility : undefined,
    ),
    // Trust aggregates — pass through only when present so `undefined`
    // keeps meaning "unknown" (older payloads), not "zero".
    ...(r.averageRating !== undefined && { averageRating: r.averageRating }),
    ...(typeof r.reviewCount === "number" && { reviewCount: r.reviewCount }),
    ...(r.responseTimeMinutes !== undefined && {
      responseTimeMinutes: r.responseTimeMinutes,
    }),
    profileCompletionStatus: {
      name: !!(r.firstName && r.lastName),
      phone: !!r.phoneNumber,
      bio: !!r.bio,
      photo: !!r.profilePhotoUrl,
      serviceArea: !!r.serviceArea,
      serviceOfferings: false,
    },
    createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
    updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
  };

  if (!profile.id || !profile.userId) {
    return null;
  }
  return profile;
}
