import { z } from "zod";

/**
 * Itinerary Schema
 * Validates itinerary data
 */
export const itinerarySchema = z.object({
  title: z
    .string("Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title must not exceed 255 characters"),
  destination: z
    .string("Destination is required")
    .min(2, "Destination must be at least 2 characters")
    .max(255, "Destination must not exceed 255 characters"),
  start_date: z
    .string("Start date is required")
    .or(z.date()),
  end_date: z
    .string("End date is required")
    .or(z.date()),
  duration: z
    .string()
    .or(z.number())
    .transform((val) => (val === "" ? null : Number(val)))
    .nullable()
    .optional(),
  budget: z
    .string()
    .or(z.literal(""))
    .optional(),
  lead_id: z
    .string()
    .or(z.number())
    .transform((val) => (val === "" ? null : Number(val)))
    .nullable()
    .optional(),
  notes: z
    .string()
    .or(z.literal(""))
    .optional(),
});

export type ItineraryFormData = z.infer<typeof itinerarySchema>;

/**
 * Itinerary Generate Schema
 * For AI-powered itinerary generation
 */
export const itineraryGenerateSchema = z.object({
  raw_text: z
    .string("Itinerary description is required")
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must not exceed 5000 characters"),
  layout: z
    .enum(["day_by_day", "by_destination", "by_activity"] as const)
    .default("day_by_day"),
  lead_id: z
    .string()
    .or(z.number())
    .transform((val) => (val === "" ? null : Number(val)))
    .nullable()
    .optional(),
});

export type ItineraryGenerateFormData = z.infer<typeof itineraryGenerateSchema>;
