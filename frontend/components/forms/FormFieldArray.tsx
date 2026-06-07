"use client";

import React from "react";
import {
  Controller,
  FieldValues,
  FieldPath,
  UseFieldArrayProps,
  useFieldArray,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface FormFieldArrayProps {
  control: any;
  name: string;
  label?: string;
  addButtonLabel?: string;
  containerClassName?: string;
  itemContainerClassName?: string;
  children: (
    index: number,
    field: any,
    remove: (index: number) => void
  ) => React.ReactNode;
}

/**
 * FormFieldArray Component
 * Manages dynamic field arrays with add/remove buttons
 *
 * @example
 * <FormFieldArray
 *   control={control}
 *   name="items"
 *   label="Items"
 *   addButtonLabel="Add Item"
 * >
 *   {(index, field, remove) => (
 *     <div key={index}>
 *       <Input {...field} />
 *       <Button onClick={() => remove(index)}>Remove</Button>
 *     </div>
 *   )}
 * </FormFieldArray>
 */
export function FormFieldArray({
  control,
  name,
  label,
  addButtonLabel = "Add Item",
  containerClassName,
  itemContainerClassName,
  children,
}: FormFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className={cn("flex flex-col gap-4", containerClassName)}>
      {label && <h3 className="text-sm font-medium text-foreground">{label}</h3>}

      <div className={cn("space-y-3", itemContainerClassName)}>
        {fields.map((field, index) => (
          <div key={field.id}>
            {children(
              index,
              field,
              remove
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({} as any)}
      >
        {addButtonLabel}
      </Button>
    </div>
  );
}
