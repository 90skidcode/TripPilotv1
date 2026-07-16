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
      <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-16 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-spin" style={{ maskImage: 'conic-gradient(transparent 75%, black 75%)' }} />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-16 text-center">
          <div className="text-5xl mb-4 opacity-80">{emptyIcon}</div>
          <p className="text-gray-800 font-semibold text-lg mb-2">{emptyMessage}</p>
          <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Table Container */}
      <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header */}
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`${headerPaddingClass} text-left text-xs font-semibold text-gray-700 uppercase tracking-wider select-none`}
                    style={{
                      width: column.width,
                      textAlign: column.align || "left",
                    }}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(String(column.key), column.sortable)}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group cursor-pointer"
                      >
                        <span className="font-semibold">{column.header}</span>
                        <span className={`flex-shrink-0 transition-all ${sortState.field === String(column.key) ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'}`}>
                          {sortState.field === String(column.key) ? (
                            sortState.order === "asc" ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      </button>
                    ) : (
                      <span className="font-semibold">{column.header}</span>
                    )}
                  </th>
                ))}

                {/* Actions Column Header */}
                {actions && actions.length > 0 && (
                  <th className={`${headerPaddingClass} text-right text-xs font-semibold text-gray-700 uppercase tracking-wider`}>
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
                  className={`border-b border-gray-200 transition-all ${
                    striped && rowIndex % 2 === 1 ? "bg-gray-50" : "bg-white"
                  } ${hoverable ? "hover:bg-blue-50/50" : ""}`}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`${paddingClass} text-sm text-gray-700`}
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
                      <div className="flex items-center justify-end gap-1.5">
                        {actions.map((action) => {
                          const isDisabled =
                            action.disabled?.(row) ||
                            (actionLoading !== null && actionLoading !== action.id);
                          const isHidden = action.show && !action.show(row);

                          if (isHidden) return null;

                          const variantColors = {
                            default:
                              "text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-700",
                            danger:
                              "text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700",
                            success:
                              "text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700",
                            warning:
                              "text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700",
                          };

                          return (
                            <button
                              key={action.id}
                              onClick={() => handleActionClick(action, row)}
                              disabled={isDisabled}
                              title={action.tooltip || action.label}
                              className={`p-2 rounded-lg transition-all duration-200 ${variantColors[action.variant || "default"]} ${
                                isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                              }`}
                              aria-label={action.label}
                            >
                              {actionLoading === action.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <div className="w-4 h-4 flex items-center justify-center">{action.icon}</div>
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
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">
            Rows per page:
          </span>
          <select
            value={pagination.pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all bg-white text-gray-700 font-medium"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-sm text-gray-600 font-medium">
            {startIndex + 1}–{endIndex} of {pagination.total}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 mx-2">
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
                    className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                      pagination.page === pageNum
                        ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
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
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
