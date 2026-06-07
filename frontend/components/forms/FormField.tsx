"use client";

import React from "react";
import {
  Controller,
  FieldValues,
  FieldPath,
  UseControllerProps,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends UseControllerProps<TFieldValues, TName> {
  label?: string;
  description?: string;
  required?: boolean;
  containerClassName?: string;
  children: (field: any, fieldState: any) => React.ReactNode;
}

/**
 * FormField Component
 * Wraps React Hook Form Controller with label, description, and error handling
 *
 * @example
 * <FormField
 *   control={control}
 *   name="email"
 *   label="Email Address"
 *   required={true}
 *   render={({ field }, { error }) => (
 *     <Input {...field} type="email" error={!!error} errorMessage={error?.message} />
 *   )}
 * />
 */
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  description,
  required,
  containerClassName,
  children,
  ...props
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      {...props}
      render={({ field, fieldState }) => (
        <div className={cn("flex flex-col gap-2", containerClassName)}>
          {label && (
            <Label htmlFor={name as string} required={required}>
              {label}
            </Label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {children(field, fieldState)}
          {fieldState.error && (
            <p className="text-sm font-medium text-destructive">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}
