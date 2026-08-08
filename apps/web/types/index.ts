export type UserRole = "customer" | "welper";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  image?: string | null;
  emailVerified: boolean;
  onboardingCompleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: User;
  expires: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  level: number;
  displayOrder: number;
  icon?: string | null;
  isActive: boolean;
  children?: ServiceCategory[];
  parent?: ServiceCategory | null;
  createdAt: Date;
  updatedAt: Date;
}

export type QuestionType = 'text' | 'number' | 'date' | 'time' | 'choice' | 'boolean' | 'entity_reference';
export type EntityType = 'child' | 'person' | 'pet';

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  placeholder?: string | null;
  helpText?: string | null;
  validationRules?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  } | null;
  options?: Array<{ value: string; label: string }> | null;
  entityType?: EntityType | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceQuestion {
  id: string;
  serviceCategoryId: string;
  questionId: string;
  displayOrder: number;
  isRequired: boolean;
  conditionalLogic?: {
    showIf?: {
      questionId: string;
      value: string | number | boolean;
    };
  } | null;
  question: Question;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentType = 'about_us' | 'faq' | 'terms' | 'privacy' | 'contact' | 'homepage';

export interface StaticContent {
  id: string;
  contentType: ContentType;
  title: string;
  body: string;
  version: number;
  isPublished: boolean;
  publishedDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  customerId: string;
  welperId: string;
  serviceId: string;
  status: "pending" | "accepted" | "in-progress" | "completed" | "cancelled";
  scheduledAt: Date;
  completedAt?: Date;
  createdAt: Date;
  /** Display: subcategory name (e.g. "Babysitter") */
  serviceSubcategoryName?: string;
  /** Display: parent category name (e.g. "Care") */
  serviceCategoryName?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  fields?: string[];
  violations?: Array<"email" | "phone" | "negotiation">;
}

// Profile Management Types

export interface PhoneNumber {
  countryCode: string;
  number: string;
  formatted?: string;
}

export interface Address {
  streetAddress: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country?: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  /** Public URL for profile photo (same pattern as welper). */
  photoUrl?: string | null;
  phone: string;
  address: Address;
  /** BFF ProfileCompletionStatus: Complete includes default payment method. */
  profileCompletionStatusLabel?: string;
  hasDefaultPaymentMethod?: boolean;
  profileCompletionStatus: {
    name: boolean;
    phone: boolean;
    address: boolean;
    paymentMethod?: boolean;
    photo?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceArea {
  type: "radius" | "address";
  centerAddress?: Address;
  radiusKm?: number;
  /** @deprecated Legacy payloads; converted on read */
  radiusMiles?: number;
  description?: string;
}

export interface WelperProfile {
  id: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: PhoneNumber | null;
  displayName: string;
  bio: string;
  photoUrl?: string | null;
  serviceArea: ServiceArea;
  profileVisibility: "Public" | "Private";
  /**
   * Wave 1 trust aggregates hydrated by GET /api/profiles/me (welper role).
   * Optional: absent on older cached payloads — treat undefined as "unknown",
   * not zero (bible §22.6).
   */
  averageRating?: number | null;
  reviewCount?: number;
  responseTimeMinutes?: number | null;
  profileCompletionStatus: {
    name: boolean;
    phone: boolean;
    bio: boolean;
    photo: boolean;
    serviceArea: boolean;
    serviceOfferings: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceOffering {
  id: string;
  welperId: string;
  title: string;
  categoryId: string;
  category?: ServiceCategory;
  description: string;
  hourlyRate: number; // Required per offering
  experienceYears: number; // Experience in years for this specific service
  serviceArea?: ServiceArea;
  serviceAreaOverride: boolean;
  subcategoryIds?: string[]; // Array of subcategory UUIDs
  active: boolean;
  rating?: number;
  reviewsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface AvailabilitySchedule {
  id: string;
  welperId: string;
  timeSlots: TimeSlot[];
  recurringPattern: "daily" | "weekly" | "monthly";
  effectiveStartDate?: Date;
  effectiveEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilityException {
  id: string;
  calendarId: string;
  date: Date;
  endDate?: Date;
  available: boolean;
  reason?: string;
  createdAt: Date;
}

export interface Holiday {
  id: string;
  countryCode: string;
  provinceCode?: string | null;
  name: string;
  date: Date;
  endDate?: Date | null;
}

export interface FavoriteWelper {
  id: string;
  customerId: string;
  welperId: string;
  welper?: WelperProfile;
  notes?: string;
  createdAt: Date;
}

export interface ServicePreferences {
  id: string;
  customerId: string;
  preferredCategories: string[];
  minPrice?: number;
  maxPrice?: number;
  preferredServiceArea?: ServiceArea;
  notifyNewWelpers: boolean;
  notifyPriceChanges: boolean;
  notifyAvailability: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User Management Types

export interface RegistrationData {
  email: string;
  password: string;
  accountType: "customer" | "welper";
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  referralCode?: string;
}

export interface VerificationData {
  email: string;
  code: string;
}

export interface PasswordResetData {
  email: string;
  preferredLocale?: "en" | "fr";
  turnstileToken?: string;
  website?: string;
}

export interface OnboardingData {
  userId: string;
  accountType: "customer" | "welper";
  step: string;
  data: Record<string, any>;
}

// Service Discovery & Search
export interface SearchResultItem {
  welperId: string;
  name: string;
  title: string;
  location: string;
  hourlyRate: number;
  categories: string[];
  profilePhotoUrl?: string | null;
  bioSnippet?: string | null;
  rating?: number;
  reviewCount?: number;
  /** Background-check verified — only true when explicitly set by BFF. */
  verified?: boolean;
  /** Minor welper (14–17) — only true when explicitly set by BFF. */
  isMinor?: boolean;
  weeklyAvailability?: WeeklyAvailabilitySummary;
}

export interface WeeklyAvailabilityTimeSlot {
  startTime: string;
  endTime: string;
}

export interface WeeklyAvailabilityDaySchedule {
  slots: WeeklyAvailabilityTimeSlot[];
}

export interface WeeklyAvailabilitySummary {
  days: boolean[];
  adHocOnly: boolean;
  schedule?: WeeklyAvailabilityDaySchedule[];
}

export interface SearchServicesResponse {
  items: SearchResultItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PublicServiceOffering {
  id: string;
  serviceCategoryId: string;
  subcategoryIds?: string[];
  subcategories?: Array<{ id: string; name: string }>;
  categoryName: string;
  parentCategoryName?: string;
  serviceDescription: string;
  hourlyRate: number;
  experienceYears: number;
}

/**
 * Wave 1 (BFF) — structured service-area shape consumed by the welper hero.
 * "Toronto, ON · Serves M5V…". `postalCodes` may be empty when the welper
 * covers the entire city.
 */
export interface PublicServiceAreaInfo {
  city: string;
  province: string;
  country: string;
  postalCodes: string[];
}

/**
 * SHARE-001: approved-only public portfolio photo (no moderation fields).
 * `url` is null when photo storage is unconfigured server-side.
 */
export interface PublicPortfolioPhoto {
  id: string;
  url: string | null;
  caption: string | null;
  offeringId: string | null;
}

export interface PublicWelperProfile {
  id: string;
  welperId: string;
  /** SHARE-002 vanity handle (`welpco.com/w/{handle}`); null until claimed. */
  handle?: string | null;
  /** Privacy-safe name for customer-facing UI (first name + last initial). */
  displayName?: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  /** Legacy GeoJSON / dashboard service-area JSON. New code should consume `serviceAreaInfo`. */
  serviceArea: unknown;
  /** Wave 1 structured service-area shape; null when the welper hasn't supplied location data. */
  serviceAreaInfo: PublicServiceAreaInfo | null;
  /** Wave 1 trust signal: KYC-verified flag. Bible §22.6: never default to true. */
  verified: boolean;
  /** Minor welper (14–17). True only when date of birth indicates under 18. */
  isMinor: boolean;
  /** 2-decimal precision; null when reviewCount === 0 (bible §22.6: no fake social proof). */
  averageRating: number | null;
  reviewCount: number;
  /**
   * Median accept-latency in integer minutes over accepted bookings in the last 90 days.
   * Null when fewer than 5 accepted bookings (bible §22.6: no inflated SLA signals).
   */
  responseTimeMinutes: number | null;
  serviceOfferings: PublicServiceOffering[];
  weeklyAvailability: WeeklyAvailabilitySummary;
  /**
   * SHARE-001: approved work photos, ordered, capped at 24. Optional so
   * cached/older payloads still in flight don't break the page — treat
   * missing as empty.
   */
  portfolioPhotos?: PublicPortfolioPhoto[];
}

export interface SearchServicesParams {
  q?: string;
  categoryId?: string;
  /** Country code for postal disambiguation only (e.g. CA). Not used for filtering. */
  countryCode?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  page?: number;
  limit?: number;
  sort?: "relevance" | "price" | "distance";
}
