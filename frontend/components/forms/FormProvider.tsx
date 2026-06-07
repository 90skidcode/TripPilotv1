"use client";

import React from "react";
import {
  FormProvider as RHFFormProvider,
  useForm,
  UseFormProps,
  FieldValues,
  SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export interface FormProviderProps<T extends FieldValues = FieldValues>
  extends Omit<UseFormProps<T>, "resolver"> {
  schema?: any;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
}

/**
 * FormProvider Component
 * Wraps React Hook Form with Zod validation
 * Provides form context and auto-resolves with Zod schema
 *
 * @example
 * <FormProvider schema={loginSchema} onSubmit={handleLogin}>
 *   <FormField name="email" label="Email" />
 *   <Button type="submit">Login</Button>
 * </FormProvider>
 */
export function FormProvider<T extends FieldValues = FieldValues>({
  schema,
  onSubmit,
  children,
  ...props
}: FormProviderProps<T>) {
  const methods = useForm<T>({
    resolver: schema ? (zodResolver(schema) as any) : undefined,
    mode: "onBlur",
    ...props,
  });

  return (
    <RHFFormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </RHFFormProvider>
  );
}

/**
 * Export useFormContext from react-hook-form
 * Usage: import { useFormContext } from "react-hook-form"
 */
export { useFormContext } from "react-hook-form";
