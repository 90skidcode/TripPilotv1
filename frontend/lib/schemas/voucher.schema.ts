import { z } from "zod";

/**
 * Voucher Schema
 * Validates voucher data
 */
export const voucherSchema = z.object({
  name: z
    .string("Voucher name is required")
    .min(3, "Name must be at least 3 characters")
    .max(255, "Name must not exceed 255 characters"),
  code: z
    .string("Voucher code is required")
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must not exceed 50 characters")
    .optional(),
  type: z
    .enum(["hotel", "flight", "activity", "transport", "meal", "other"] as const),
  value: z
    .string()
    .or(z.number())
    .transform((val) => (val === "" ? null : Number(val)))
    .nullable()
    .optional(),
  currency: z
    .string()
    .max(3, "Currency must be 3 characters")
    .default("INR")
    .optional(),
  description: z
    .string()
    .or(z.literal(""))
    .optional(),
  booking_reference: z
    .string()
    .or(z.literal(""))
    .optional(),
  status: z
    .enum(["pending", "confirmed", "used", "cancelled"] as const)
    .default("pending")
    .optional(),
  valid_from: z
    .string()
    .or(z.date())
    .optional(),
  valid_to: z
    .string()
    .or(z.date())
    .optional(),
  notes: z
    .string()
    .or(z.literal(""))
    .optional(),
});

export type VoucherFormData = z.infer<typeof voucherSchema>;

/**
 * Voucher AI Schema
 * For AI-powered voucher creation
 */
export const voucherAISchema = z.object({
  description: z
    .string("Voucher description is required")
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must not exceed 5000 characters"),
});

export type VoucherAIFormData = z.infer<typeof voucherAISchema>;
