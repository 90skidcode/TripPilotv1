"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

export interface DataTableCheckboxProps {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
  "aria-label"?: string;
}

/**
 * DataTableCheckbox Component
 * Checkbox for row selection in tables
 * Handles indeterminate state for select-all
 *
 * @example
 * <DataTableCheckbox
 *   checked={isSelected}
 *   onCheckedChange={setIsSelected}
 * />
 */
export function DataTableCheckbox({
  checked,
  onCheckedChange,
  "aria-label": ariaLabel,
}: DataTableCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
    />
  );
}
