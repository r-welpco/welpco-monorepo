import { z } from "zod";
import { CANADIAN_PROVINCE_CODES } from "./canadian-provinces";

export type ServiceOfferingValidationLabels = {
  titleRequired: string;
  titleMax: string;
  categoryRequired: string;
  rateMin: string;
  rateMax: string;
  experienceMin: string;
  experienceMax: string;
  descriptionMin: string;
  descriptionMax: string;
  cityRequired: string;
  stateRequired: string;
  postalRequired: string;
  radiusMin: string;
  radiusMax: string;
};

const DEFAULT_VALIDATION_LABELS: ServiceOfferingValidationLabels = {
  titleRequired: "Title is required",
  titleMax: "Keep your title under 80 characters",
  categoryRequired: "Choose a category",
  rateMin: "Rate must be at least $1/hour",
  rateMax: "Rate must be at most $1,000/hour",
  experienceMin: "Experience must be 0 or more",
  experienceMax: "Experience cannot exceed 50 years",
  descriptionMin: "Describe your service in at least a sentence",
  descriptionMax: "Keep your description under 2,000 characters",
  cityRequired: "City is required",
  stateRequired: "Province or state is required",
  postalRequired: "Postal code is required",
  radiusMin: "Radius must be at least 1 km",
  radiusMax: "Radius must be at most 100 km",
};

export function createServiceAreaSchema(v: ServiceOfferingValidationLabels) {
  return z.object({
    type: z.literal("radius"),
    centerAddress: z
      .object({
        streetAddress: z.string().default(""),
        city: z.string().min(2, v.cityRequired),
        stateProvince: z
          .string()
          .refine((value) => CANADIAN_PROVINCE_CODES.has(value), v.stateRequired),
        zipPostalCode: z
          .string()
          .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, v.postalRequired),
        country: z.string().optional(),
      })
      .optional(),
    radiusKm: z.number().min(1, v.radiusMin).max(100, v.radiusMax).optional(),
  });
}

export function createServiceOfferingSchema(
  v: ServiceOfferingValidationLabels = DEFAULT_VALIDATION_LABELS,
) {
  const serviceAreaSchema = createServiceAreaSchema(v);
  return z.object({
    title: z.string().min(3, v.titleRequired).max(80, v.titleMax),
    category: z.string().min(2, v.categoryRequired),
    subcategories: z.array(z.string()).optional(),
    hourlyRate: z.coerce.number().min(1, v.rateMin).max(1000, v.rateMax),
    experienceYears: z.coerce.number().min(0, v.experienceMin).max(50, v.experienceMax),
    description: z.string().min(10, v.descriptionMin).max(2000, v.descriptionMax),
    serviceAreaOverride: z.boolean(),
    serviceArea: serviceAreaSchema.optional(),
    active: z.boolean(),
  });
}

/** Default English schema (stories, tests, unsigned flows). */
export const serviceOfferingSchema = createServiceOfferingSchema();

export type ServiceOfferingValues = z.infer<typeof serviceOfferingSchema>;

export const defaultCategories = [
  { id: "home-cleaning", name: "Home Cleaning" },
  { id: "child-care", name: "Child Care" },
  { id: "pet-care", name: "Pet Care" },
  { id: "handyman", name: "Handyman" },
  { id: "tutoring", name: "Tutoring" },
  { id: "wellness", name: "Wellness" },
];
