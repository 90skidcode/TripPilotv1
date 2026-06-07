"use client";

import React from "react";
import { Table } from "@tanstack/react-table";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchColumn?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * DataTableToolbar Component
 * Search and filter controls for table
 *
 * @example
 * <DataTableToolbar
 *   table={table}
 *   searchPlaceholder="Search by name..."
 *   searchColumn="name"
 * />
 */
export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = "Search...",
  searchColumn,
  children,
  className,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className={cn("flex items-center justify-between gap-2 py-4", className)}>
      <div className="flex flex-1 items-center gap-2">
        {searchColumn && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            <Input
              placeholder={searchPlaceholder}
              value={
                (table
                  .getColumn(searchColumn)
                  ?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table
                  .getColumn(searchColumn)
                  ?.setFilterValue(event.target.value)
              }
              className="pl-10"
            />
          </div>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}
