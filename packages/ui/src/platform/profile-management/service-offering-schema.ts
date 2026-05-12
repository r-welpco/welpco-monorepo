import { z } from "zod";

export const serviceAreaSchema = z.object({
  type: z.literal("radius"),
  centerAddress: z
    .object({
      streetAddress: z.string().min(5),
      city: z.string().min(2),
      stateProvince: z.string().min(2),
      zipPostalCode: z.string().min(3),
      country: z.string().optional(),
    })
    .optional(),
  radiusMiles: z.number().min(1).max(100).optional(),
});

export const serviceOfferingSchema = z.object({
  title: z.string().min(3, "Title is required").max(80, "Keep your title under 80 characters"),
  category: z.string().min(2, "Choose a category"),
  subcategories: z.array(z.string()).optional(),
  // Mirrors the BFF DTO bounds — keep these in sync. A free tier ($0) is a
  // data-entry mistake, not a feature; the upper bound ($1000/hr) keeps typos
  // out of search filters without limiting premium concierge offerings.
  hourlyRate: z.coerce
    .number()
    .min(1, "Rate must be at least $1/hour")
    .max(1000, "Rate must be at most $1,000/hour"),
  experienceYears: z.coerce
    .number()
    .min(0, "Experience must be 0 or more")
    .max(50, "Experience cannot exceed 50 years"),
  description: z
    .string()
    .min(10, "Describe your service in at least a sentence")
    .max(2000, "Keep your description under 2,000 characters"),
  serviceAreaOverride: z.boolean(),
  serviceArea: serviceAreaSchema.optional(),
  active: z.boolean(),
});

export type ServiceOfferingValues = z.infer<typeof serviceOfferingSchema>;

export const defaultCategories = [
  { id: "home-cleaning", name: "Home Cleaning" },
  { id: "child-care", name: "Child Care" },
  { id: "pet-care", name: "Pet Care" },
  { id: "handyman", name: "Handyman" },
  { id: "tutoring", name: "Tutoring" },
  { id: "wellness", name: "Wellness" },
];
