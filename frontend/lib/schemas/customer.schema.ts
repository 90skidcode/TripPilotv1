import { z } from "zod";

/**
 * Customer Schema
 * Validates customer data for creation and updates
 */
export const customerSchema = z.object({
  name: z
    .string("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must not exceed 200 characters"),
  phone: z
    .string("Phone is required")
    .min(7, "Phone must be at least 7 characters")
    .max(20, "Phone must not exceed 20 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .or(z.literal(""))
    .optional(),
  whatsapp_number: z
    .string()
    .min(7, "WhatsApp number must be at least 7 characters")
    .max(20, "WhatsApp number must not exceed 20 characters")
    .or(z.literal(""))
    .optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

/**
 * Customer Create Schema
 * Used for creating a new customer (requires phone)
 */
export const customerCreateSchema = customerSchema;

export type CustomerCreateFormData = z.infer<typeof customerCreateSchema>;

/**
 * Customer Update Schema
 * Used for updating a customer (all fields optional)
 */
export const customerUpdateSchema = customerSchema.partial();

export type CustomerUpdateFormData = z.infer<typeof customerUpdateSchema>;
