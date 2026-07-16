import { useState, useCallback } from "react";
import { PaginationState, SortOrder } from "./types";

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export function usePagination(
  total: number,
  options: UsePaginationOptions = {}
) {
  const { initialPage = 1, initialPageSize = 25 } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const handlePaginationChange = useCallback(
    (newPage: number, newPageSize: number) => {
      setPage(newPage);
      setPageSize(newPageSize);
    },
    []
  );

  const handleSort = useCallback((field: string, order: SortOrder) => {
    setSortField(order ? field : null);
    setSortOrder(order);
    setPage(1); // Reset to first page on sort
  }, []);

  const resetPagination = useCallback(() => {
    setPage(1);
    setPageSize(initialPageSize);
    setSortField(null);
    setSortOrder(null);
  }, [initialPageSize]);

  return {
    pagination: {
      page,
      pageSize,
      total,
    },
    sort: {
      field: sortField,
      order: sortOrder,
    },
    handlers: {
      onPaginationChange: handlePaginationChange,
      onSort: handleSort,
    },
    resetPagination,
  };
}
