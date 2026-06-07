"use client";

import { useForm, UseFormProps, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export interface UseFormWithValidationProps<T extends FieldValues = FieldValues>
  extends Omit<UseFormProps<T>, "resolver"> {
  schema: any;
}

/**
 * Hook for creating a form with Zod validation
 * Simplifies form creation by auto-resolving with Zod schema
 *
 * @example
 * const form = useFormWithValidation({
 *   schema: loginSchema,
 *   defaultValues: { email: "", password: "" },
 * });
 *
 * return (
 *   <form onSubmit={form.handleSubmit(onSubmit)}>
 *     <input {...form.register("email")} />
 *   </form>
 * );
 */
export function useFormWithValidation<T extends FieldValues = FieldValues>({
  schema,
  mode = "onBlur",
  ...props
}: UseFormWithValidationProps<T>) {
  return useForm<T>({
    resolver: zodResolver(schema) as any,
    mode,
    ...props,
  });
}
