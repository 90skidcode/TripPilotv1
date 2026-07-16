import { ReactNode } from "react";

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export type SortOrder = "asc" | "desc" | null;

export interface SortState {
  field: string | null;
  order: SortOrder;
}

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => ReactNode;
  align?: "left" | "center" | "right";
}

export type ActionType = "edit" | "delete" | "view" | "archive" | "restore" | "custom";

export interface DataTableAction<T> {
  id: string;
  icon: ReactNode;
  label: string;
  tooltip?: string;
  onClick: (row: T) => void | Promise<void>;
  variant?: "default" | "danger" | "success" | "warning";
  disabled?: (row: T) => boolean;
  show?: (row: T) => boolean;
  loading?: boolean;
}

export interface DataTableProps<T extends Record<string, any>> {
  columns: DataTableColumn<T>[];
  data: T[];
  actions?: DataTableAction<T>[];
  pagination: PaginationState;
  onPaginationChange: (page: number, pageSize: number) => void;
  onSort?: (field: string, order: SortOrder) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  compact?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

export interface DataTableHeaderProps {
  label: string;
  sortable?: boolean;
  sortOrder?: SortOrder;
  onSort?: () => void;
  align?: "left" | "center" | "right";
}
