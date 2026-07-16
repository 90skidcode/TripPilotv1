"use client";

import { useMemo, useId } from "react";

export function TableSkeleton({ rows = 5, showHeader = true }: { readonly rows?: number; readonly showHeader?: boolean }) {
  const id = useId();
  const skeletonRows = useMemo(() => Array.from({ length: rows }, (_, i) => `${id}-${i}`), [rows, id]);

  return (
    <div className="w-full space-y-4">
      {/* Header Section */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="skeleton h-8 w-48 mb-3"></div>
            <div className="skeleton h-4 w-80"></div>
          </div>
          <div className="skeleton h-10 w-40 rounded-lg"></div>
        </div>
      )}

      {/* Table Container */}
      <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header */}
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200">
                <th className="px-6 py-4">
                  <div className="skeleton h-4 w-24"></div>
                </th>
                <th className="px-6 py-4">
                  <div className="skeleton h-4 w-32"></div>
                </th>
                <th className="px-6 py-4">
                  <div className="skeleton h-4 w-20"></div>
                </th>
                <th className="px-6 py-4">
                  <div className="skeleton h-4 w-28"></div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="skeleton h-4 w-16 ml-auto"></div>
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {skeletonRows.map((rowId, rowIndex) => (
                <tr
                  key={rowId}
                  className={`border-b border-gray-200 ${
                    rowIndex % 2 === 1 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="skeleton h-8 w-8 rounded-full"></div>
                      <div className="flex-1">
                        <div className="skeleton h-4 w-32 mb-2"></div>
                        <div className="skeleton h-3 w-24"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="skeleton h-4 w-40"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="skeleton h-4 w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="skeleton h-4 w-32"></div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="skeleton h-8 w-8 rounded-lg"></div>
                      <div className="skeleton h-8 w-8 rounded-lg"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="skeleton h-4 w-32"></span>
        </div>
        <div className="skeleton h-4 w-40"></div>
      </div>
    </div>
  );
}
