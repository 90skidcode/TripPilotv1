"use client";

import React from "react";
import { cn } from "@/lib/cn";

export interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Section Component
 * Container for grouped content with optional title
 *
 * @example
 * <Section title="Account Settings" description="Manage your account">
 *   <form>fields</form>
 * </Section>
 */
export function Section({
  title,
  description,
  children,
  className,
  contentClassName,
}: SectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className={cn("space-y-4", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
