"use client";

import React from "react";
import { cn } from "@/lib/cn";

export interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

const columnClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const gapClasses = {
  sm: "gap-1",
  md: "gap-2",
  lg: "gap-3",
};

/**
 * ResponsiveGrid Component
 * Responsive grid layout with flexible columns
 *
 * @example
 * <ResponsiveGrid columns={3} gap="md">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </ResponsiveGrid>
 */
export function ResponsiveGrid({
  children,
  columns = 3,
  gap = "md",
  className,
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        "grid",
        columnClasses[columns as keyof typeof columnClasses] || columnClasses[3],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}
