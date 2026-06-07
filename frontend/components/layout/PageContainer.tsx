"use client";

import React from "react";
import { cn } from "@/lib/cn";

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageContainer Component
 * Standard page content wrapper with consistent padding
 *
 * @example
 * <PageContainer>
 *   <PageHeader title="Leads" />
 *   <div>Page content</div>
 * </PageContainer>
 */
export function PageContainer({
  children,
  className,
}: PageContainerProps) {
  return (
    <div className={cn("px-2 py-2 sm:px-3 lg:px-4", className)}>
      {children}
    </div>
  );
}
