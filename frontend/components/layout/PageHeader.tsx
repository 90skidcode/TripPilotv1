"use client";

import React from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader Component
 * Consistent page header with title, description, and action slots
 *
 * @example
 * <PageHeader
 *   title="Leads"
 *   description="Manage your sales leads"
 * >
 *   <Button>Add Lead</Button>
 * </PageHeader>
 */
export function PageHeader({
  title,
  description,
  children,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 md:flex-row md:items-center md:justify-between mb-3", className)}>
      <div className="flex flex-col gap-0">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {(children || action) && (
        <div className="flex gap-1">
          {children}
          {action}
        </div>
      )}
    </div>
  );
}
