"use client";

import React from "react";
import { Column } from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface ColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

/**
 * ColumnHeader Component
 * Sortable column header with icons
 *
 * @example
 * <ColumnHeader column={column} title="Name" />
 */
export function ColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: ColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 hover:bg-transparent"
        onClick={() => column.toggleSorting()}
      >
        {title}
        <span className="ml-2">
          {column.getIsSorted() === "desc" ? (
            <ArrowDown className="h-4 w-4" />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-50" />
          )}
        </span>
      </Button>
    </div>
  );
}
