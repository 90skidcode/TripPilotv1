"use client";

import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DataTableProps, SortOrder } from "./types";
import { useState } from "react";

const DEFAULT_EMPTY_MESSAGE = "No data available";
const DEFAULT_EMPTY_ICON = "📋";
const PAGE_SIZES = [10, 25, 50, 100];

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  actions,
  pagination,
  onPaginationChange,
  onSort,
  isLoading = false,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  emptyIcon = DEFAULT_EMPTY_ICON,
  compact = false,
  striped = true,
  hoverable = true,
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<{ field: string | null; order: SortOrder }>({
    field: null,
    order: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = Math.min(startIndex + pagination.pageSize, pagination.total);

  const handleSort = (field: string, sortable?: boolean) => {
    if (!sortable) return;

    let newOrder: SortOrder = "asc";
    if (sortState.field === field && sortState.order === "asc") {
      newOrder = "desc";
    } else if (sortState.field === field && sortState.order === "desc") {
      newOrder = null;
    }

    setSortState({ field: newOrder ? field : null, order: newOrder });
    onSort?.(field, newOrder);
  };

  const handleActionClick = async (action: any, row: T) => {
    if (actionLoading) return;
    setActionLoading(action.id);
    try {
      await action.onClick(row);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPaginationChange(newPage, pagination.pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onPaginationChange(1, newPageSize);
  };

  const paddingClass = compact ? "px-4 py-2" : "px-6 py-4";
  const headerPaddingClass = compact ? "px-4 py-3" : "px-6 py-4";

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-12 text-center">
          <div className="text-4xl mb-4">{emptyIcon}</div>
          <p className="text-slate-700 font-semibold text-base mb-1">{emptyMessage}</p>
          <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Table Container */}
      <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header */}
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`${headerPaddingClass} text-left text-xs font-semibold text-slate-700 uppercase tracking-wide select-none`}
                    style={{
                      width: column.width,
                      textAlign: column.align || "left",
                    }}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(String(column.key), column.sortable)}
                        className="flex items-center gap-1.5 hover:text-slate-900 transition-colors group cursor-pointer"
                      >
                        {column.header}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {sortState.field === String(column.key) ? (
                            sortState.order === "asc" ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )
                          ) : (
                            <ChevronDown className="w-4 h-4 opacity-30" />
                          )}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}

                {/* Actions Column Header */}
                {actions && actions.length > 0 && (
                  <th className={`${headerPaddingClass} text-right text-xs font-semibold text-slate-700 uppercase tracking-wide`}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b border-slate-200 transition-colors ${
                    striped && rowIndex % 2 === 1 ? "bg-slate-50" : "bg-white"
                  } ${hoverable ? "hover:bg-slate-100" : ""}`}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`${paddingClass} text-sm text-slate-700`}
                      style={{
                        width: column.width,
                        textAlign: column.align || "left",
                      }}
                    >
                      {column.render
                        ? column.render(row[column.key as keyof T], row, rowIndex)
                        : String(row[column.key as keyof T] ?? "-")}
                    </td>
                  ))}

                  {/* Actions Cell */}
                  {actions && actions.length > 0 && (
                    <td className={`${paddingClass} text-right`}>
                      <div className="flex items-center justify-end gap-2">
                        {actions.map((action) => {
                          const isDisabled =
                            action.disabled?.(row) ||
                            (actionLoading !== null && actionLoading !== action.id);
                          const isHidden = action.show && !action.show(row);

                          if (isHidden) return null;

                          const variantColors = {
                            default:
                              "text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50 hover:bg-slate-100",
                            danger:
                              "text-red-600 hover:text-red-700 hover:bg-red-50 bg-red-50 hover:bg-red-100",
                            success:
                              "text-green-600 hover:text-green-700 hover:bg-green-50 bg-green-50 hover:bg-green-100",
                            warning:
                              "text-amber-600 hover:text-amber-700 hover:bg-amber-50 bg-amber-50 hover:bg-amber-100",
                          };

                          return (
                            <button
                              key={action.id}
                              onClick={() => handleActionClick(action, row)}
                              disabled={isDisabled}
                              title={action.tooltip || action.label}
                              className={`p-2 rounded-md transition-all ${variantColors[action.variant || "default"]} ${
                                isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                              }`}
                              aria-label={action.label}
                            >
                              {actionLoading === action.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <div className="w-4 h-4">{action.icon}</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium">
            Rows per page:
          </span>
          <select
            value={pagination.pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-600 font-medium">
            {startIndex + 1}–{endIndex} of {pagination.total}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                let pageNum: number;

                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                      pagination.page === pageNum
                        ? "bg-blue-500 text-white"
                        : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
