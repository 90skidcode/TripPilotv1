# DataTable Component Usage Guide

A modern, reusable table component with server-side pagination, sorting, and icon-based actions.

## Features

- ✅ Server-side pagination
- ✅ Column sorting
- ✅ Icon-based actions (edit, delete, custom)
- ✅ Custom cell rendering
- ✅ Loading states
- ✅ Empty states
- ✅ Responsive design
- ✅ Striped rows and hover effects
- ✅ Action tooltips
- ✅ Disabled states for actions
- ✅ TypeScript support

## Basic Usage

```tsx
"use client";

import { useState, useEffect } from "react";
import { DataTable, DataTableColumn, PaginationState } from "@/components/DataTable";
import { usePagination } from "@/components/DataTable/usePagination";
import { Edit2, Trash2, Eye } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive";
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { pagination, sort, handlers, resetPagination } = usePagination(total, {
    initialPage: 1,
    initialPageSize: 25,
  });

  // Fetch data from server
  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/users?page=${pagination.page}&pageSize=${pagination.pageSize}&sortBy=${sort.field}&sortOrder=${sort.order}`
        );
        const data = await response.json();
        setUsers(data.users);
        setTotal(data.total);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, [pagination.page, pagination.pageSize, sort.field, sort.order]);

  const columns: DataTableColumn<User>[] = [
    {
      key: "id",
      header: "ID",
      width: "80px",
      sortable: true,
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === "active"
              ? "bg-green-100 text-green-800"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const handleEdit = (user: User) => {
    console.log("Edit user:", user.id);
    // Open edit dialog or navigate
  };

  const handleDelete = (user: User) => {
    if (confirm(`Delete user ${user.name}?`)) {
      console.log("Delete user:", user.id);
      // Make API call to delete
    }
  };

  const handleView = (user: User) => {
    console.log("View user:", user.id);
    // Navigate to user details
  };

  const actions = [
    {
      id: "view",
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      tooltip: "View user details",
      onClick: handleView,
    },
    {
      id: "edit",
      icon: <Edit2 className="w-4 h-4" />,
      label: "Edit",
      tooltip: "Edit user",
      onClick: handleEdit,
    },
    {
      id: "delete",
      icon: <Trash2 className="w-4 h-4" />,
      label: "Delete",
      tooltip: "Delete user",
      variant: "danger" as const,
      onClick: handleDelete,
      // Optional: disable deletion for certain rows
      disabled: (user) => user.status === "active",
      // Optional: hide action for certain rows
      show: (user) => user.id !== 1, // Hide for admin user
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Users Management</h1>
        <p className="text-slate-600 mt-1">Manage all system users</p>
      </div>

      <DataTable<User>
        columns={columns}
        data={users}
        actions={actions}
        pagination={{ ...pagination, total }}
        onPaginationChange={handlers.onPaginationChange}
        onSort={handlers.onSort}
        isLoading={isLoading}
        emptyMessage="No users found"
        emptyIcon="👥"
        compact={false}
        striped={true}
        hoverable={true}
      />
    </div>
  );
}
```

## Advanced Usage

### Custom Cell Rendering

```tsx
const columns: DataTableColumn<User>[] = [
  {
    key: "avatar",
    header: "Avatar",
    width: "60px",
    render: (_, user) => (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="w-10 h-10 rounded-full"
      />
    ),
  },
  {
    key: "role",
    header: "Role",
    render: (value) => {
      const colors = {
        admin: "bg-red-100 text-red-800",
        manager: "bg-blue-100 text-blue-800",
        user: "bg-gray-100 text-gray-800",
      };
      return (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[value]}`}>
          {value}
        </span>
      );
    },
  },
];
```

### Action Variants

Available action variants:
- `"default"` - Standard button style
- `"danger"` - Red style for delete/destructive actions
- `"success"` - Green style for positive actions
- `"warning"` - Amber style for cautionary actions

```tsx
const actions = [
  {
    id: "activate",
    icon: <CheckCircle className="w-4 h-4" />,
    label: "Activate",
    variant: "success" as const,
    onClick: handleActivate,
    show: (user) => user.status === "inactive",
  },
  {
    id: "deactivate",
    icon: <XCircle className="w-4 h-4" />,
    label: "Deactivate",
    variant: "warning" as const,
    onClick: handleDeactivate,
    show: (user) => user.status === "active",
  },
];
```

### Loading and Empty States

```tsx
<DataTable
  columns={columns}
  data={users}
  actions={actions}
  pagination={pagination}
  onPaginationChange={handlers.onPaginationChange}
  isLoading={isLoading}
  emptyMessage="No users found. Create one to get started."
  emptyIcon="🚀"
  compact={false}
/>
```

## API Reference

### DataTableColumn<T>

```typescript
interface DataTableColumn<T> {
  key: keyof T | string;           // Column key from data
  header: string;                  // Header label
  width?: string;                  // CSS width (e.g., "200px", "20%")
  sortable?: boolean;              // Enable sorting
  render?: (value, row, index) => ReactNode;  // Custom renderer
  align?: "left" | "center" | "right";  // Text alignment
}
```

### DataTableAction<T>

```typescript
interface DataTableAction<T> {
  id: string;                      // Unique action ID
  icon: ReactNode;                 // React icon component
  label: string;                   // Action label (for a11y)
  tooltip?: string;                // Hover tooltip
  onClick: (row: T) => void | Promise<void>;  // Action handler
  variant?: "default" | "danger" | "success" | "warning";
  disabled?: (row: T) => boolean;  // Disable condition
  show?: (row: T) => boolean;      // Visibility condition
  loading?: boolean;               // Loading state
}
```

### DataTableProps<T>

```typescript
interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  actions?: DataTableAction<T>[];
  pagination: PaginationState;
  onPaginationChange: (page: number, pageSize: number) => void;
  onSort?: (field: string, order: SortOrder) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  compact?: boolean;               // Reduce padding
  striped?: boolean;               // Alternate row colors
  hoverable?: boolean;             // Hover effects on rows
}
```

### usePagination Hook

```typescript
const { pagination, sort, handlers, resetPagination } = usePagination(
  totalItems,
  {
    initialPage: 1,
    initialPageSize: 25,
  }
);

// pagination.page, pagination.pageSize, pagination.total
// sort.field, sort.order
// handlers.onPaginationChange, handlers.onSort
// resetPagination()
```

## Icon Library Integration

The component uses `lucide-react` for icons. Import them as needed:

```tsx
import {
  Edit2,
  Trash2,
  Eye,
  Copy,
  Download,
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Archive,
  Restore,
} from "lucide-react";
```

## Styling

The component uses Tailwind CSS classes. Ensure Tailwind is configured in your project:

```javascript
// tailwind.config.js
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  // ... rest of config
};
```

## Tips & Best Practices

1. **Server-Side Pagination**: Always implement server-side pagination for large datasets
2. **Lazy Loading Actions**: Load action results asynchronously and show loading states
3. **Confirmation Dialogs**: Use modals for destructive actions (delete, archive)
4. **Loading States**: Show loading skeleton while fetching data
5. **Error Handling**: Implement proper error boundaries and user feedback
6. **Accessibility**: All actions have labels and tooltips for screen readers
7. **Performance**: Memoize columns and actions objects to prevent unnecessary re-renders

## Example: With Search and Filter

```tsx
const [searchQuery, setSearchQuery] = useState("");
const [filterStatus, setFilterStatus] = useState("all");

useEffect(() => {
  async function fetchUsers() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        search: searchQuery,
        status: filterStatus,
      });
      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();
      setUsers(data.users);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  }
  fetchUsers();
}, [pagination.page, pagination.pageSize, searchQuery, filterStatus]);

return (
  <div className="space-y-6">
    <div className="flex gap-4">
      <input
        type="text"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="px-4 py-2 border rounded-lg"
      />
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-4 py-2 border rounded-lg"
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
    <DataTable {...props} />
  </div>
);
```
