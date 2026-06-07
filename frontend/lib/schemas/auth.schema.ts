import { z } from "zod";

/**
 * Login Schema
 * Validates email and password for login
 */
export const loginSchema = z.object({
  email: z
    .string("Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string("Password is required")
    .min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Register Schema
 * Validates email, password, and name for registration
 */
export const registerSchema = z.object({
  name: z
    .string("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  email: z
    .string("Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(
      /[A-Z]/,
      "Password must contain at least one uppercase letter"
    )
    .regex(
      /[0-9]/,
      "Password must contain at least one number"
    ),
  passwordConfirm: z.string("Please confirm your password"),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
