import { z } from "zod";

const SOURCES = [
  "whatsapp",
  "instagram",
  "website",
  "referral",
  "advertisement",
  "manual",
  "email",
];

const STAGES = [
  "fresh",
  "qualified_hot",
  "qualified_warm",
  "won",
  "lost",
  "not_responding",
  "disqualified",
  "future_prospect",
];

/**
 * Lead Schema
 * Validates lead data for creation and updates
 */
export const leadSchema = z.object({
  customer_id: z
    .string("Customer is required")
    .or(z.number())
    .transform((val) => (typeof val === "string" ? Number(val) : val)),
  source: z
    .enum(SOURCES as [string, ...string[]])
    .default("manual"),
  stage: z
    .enum(STAGES as [string, ...string[]])
    .default("fresh"),
  destination: z
    .string()
    .max(255, "Destination must not exceed 255 characters")
    .or(z.literal(""))
    .optional(),
  trip_type: z
    .string()
    .max(100, "Trip type must not exceed 100 characters")
    .or(z.literal(""))
    .optional(),
  budget: z
    .string()
    .or(z.literal(""))
    .optional(),
  num_adults: z
    .string()
    .or(z.number())
    .transform((val) => (val === "" ? null : Number(val)))
    .nullable()
    .optional(),
  num_children: z
    .string()
    .or(z.number())
    .transform((val) => (val === "" ? null : Number(val)))
    .nullable()
    .optional(),
  num_infants: z
    .string()
    .or(z.number())
    .transform((val) => (val === "" ? null : Number(val)))
    .nullable()
    .optional(),
  notes: z
    .string()
    .or(z.literal(""))
    .optional(),
  assigned_to: z
    .string()
    .or(z.number())
    .transform((val) => (val === "" ? null : Number(val)))
    .nullable()
    .optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

/**
 * Lead AI Entry Schema
 * For AI-powered lead creation from text
 */
export const leadAISchema = z.object({
  ai_text: z
    .string("Lead description is required")
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must not exceed 5000 characters"),
});

export type LeadAIFormData = z.infer<typeof leadAISchema>;
