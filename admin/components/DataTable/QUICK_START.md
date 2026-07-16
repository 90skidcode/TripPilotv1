# DataTable Component - Quick Start

## 🎯 5-Minute Setup

### Step 1: Install lucide-react (if not already installed)
```bash
npm install lucide-react
```

### Step 2: Copy the component files
Files created in `admin/components/DataTable/`:
- `DataTable.tsx` - Main component
- `types.ts` - TypeScript types
- `usePagination.ts` - State management hook
- `index.ts` - Exports

### Step 3: Import and use

```tsx
"use client";

import { useState, useEffect } from "react";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { usePagination } from "@/components/DataTable/usePagination";
import { Edit2, Trash2, Eye } from "lucide-react";

// Define your data type
interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Initialize pagination hook
  const { pagination, sort, handlers } = usePagination(0, {
    initialPageSize: 25,
  });
  const [total, setTotal] = useState(0);

  // Fetch data
  useEffect(() => {
    setLoading(true);
    fetch(`/api/users?page=${pagination.page}&size=${pagination.pageSize}`)
      .then(r => r.json())
      .then(d => {
        setData(d.data);
        setTotal(d.total);
      })
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.pageSize]);

  // Define columns
  const columns: DataTableColumn<User>[] = [
    { key: "id", header: "ID", width: "80px", sortable: true },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>,
    },
    { key: "email", header: "Email", sortable: true },
    {
      key: "role",
      header: "Role",
      render: (value) => (
        <span className={value === "admin" ? "text-red-600 font-bold" : ""}>
          {value}
        </span>
      ),
    },
  ];

  // Define actions
  const actions = [
    {
      id: "view",
      icon: <Eye className="w-4 h-4" />,
      label: "View",
      onClick: (row) => console.log("View", row),
    },
    {
      id: "edit",
      icon: <Edit2 className="w-4 h-4" />,
      label: "Edit",
      onClick: (row) => console.log("Edit", row),
    },
    {
      id: "delete",
      icon: <Trash2 className="w-4 h-4" />,
      label: "Delete",
      variant: "danger" as const,
      onClick: (row) => console.log("Delete", row),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-slate-600">Manage all users</p>
      </div>

      <DataTable<User>
        columns={columns}
        data={data}
        actions={actions}
        pagination={{ ...pagination, total }}
        onPaginationChange={handlers.onPaginationChange}
        onSort={handlers.onSort}
        isLoading={loading}
        emptyMessage="No users found"
        emptyIcon="👥"
      />
    </div>
  );
}
```

## 🎨 Icon Options (lucide-react)

Common action icons:
```tsx
import {
  Edit2,      // ✏️ Edit
  Trash2,     // 🗑️ Delete
  Eye,        // 👁️ View
  Copy,       // 📋 Copy
  Download,   // ⬇️ Download
  Archive,    // 📦 Archive
  Restore,    // 🔄 Restore
  MoreVertical, // ⋮ More options
  CheckCircle,// ✓ Approve
  XCircle,    // ✕ Reject
  AlertCircle,// ⚠️ Alert
} from "lucide-react";
```

## 🎨 Action Variants

```tsx
// Default (blue)
{ id: "edit", variant: "default", ... }

// Danger (red) - for delete/destructive
{ id: "delete", variant: "danger", ... }

// Success (green) - for confirmations
{ id: "approve", variant: "success", ... }

// Warning (amber) - for caution
{ id: "warn", variant: "warning", ... }
```

## 🔧 Advanced Features

### Conditional Actions
```tsx
const actions = [
  {
    id: "delete",
    icon: <Trash2 className="w-4 h-4" />,
    label: "Delete",
    onClick: (row) => deleteUser(row.id),
    // Hide for certain rows
    show: (row) => row.id !== 1, // Don't show for admin
    // Disable for certain rows
    disabled: (row) => row.role === "admin",
  },
];
```

### Custom Cell Rendering
```tsx
{
  key: "status",
  header: "Status",
  render: (value, row, index) => (
    <span className={`badge badge-${value}`}>
      {value.toUpperCase()}
    </span>
  ),
}
```

### Async Actions
```tsx
const actions = [
  {
    id: "approve",
    icon: <Check className="w-4 h-4" />,
    label: "Approve",
    onClick: async (row) => {
      await fetch(`/api/users/${row.id}/approve`, { method: "POST" });
      // Component shows loading spinner automatically
    },
  },
];
```

### Search + Filter
```tsx
const [search, setSearch] = useState("");
const [filter, setFilter] = useState("all");

useEffect(() => {
  const params = new URLSearchParams({
    page: String(pagination.page),
    search,
    filter,
  });
  // Fetch with params...
}, [search, filter, pagination.page]);

return (
  <div className="space-y-4">
    <div className="flex gap-4">
      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-4 py-2 border rounded"
      />
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option>All</option>
        <option>Active</option>
        <option>Inactive</option>
      </select>
    </div>
    <DataTable {...props} />
  </div>
);
```

## 📋 Checklist for Implementation

- [ ] Install `lucide-react`
- [ ] Copy DataTable component files to `admin/components/DataTable/`
- [ ] Import component and types
- [ ] Define data interface
- [ ] Create columns array
- [ ] Create actions array
- [ ] Set up pagination hook
- [ ] Implement API fetching
- [ ] Add error handling
- [ ] Style wrapper container
- [ ] Test pagination
- [ ] Test sorting
- [ ] Test actions

## 🚀 Next Steps

1. **Start small**: Implement for one page (Users, Products, etc.)
2. **Add search**: Enhance with search input
3. **Add filters**: Add filter dropdowns
4. **Add bulk actions**: Select multiple rows
5. **Add export**: Export data to CSV/Excel
6. **Add advanced sort**: Multiple column sorting

## 🎓 Full Documentation

See `USAGE_GUIDE.md` for comprehensive examples and API reference.

## ❓ Common Questions

**Q: How do I handle pagination on the server?**
A: Pass the pagination state to your API:
```tsx
fetch(`/api/items?page=${pagination.page}&size=${pagination.pageSize}`)
```

**Q: How do I implement sorting?**
A: Use the `onSort` handler and pass sort params to API:
```tsx
const handleSort = (field, order) => {
  // API call with sort params
};
```

**Q: Can I customize the styling?**
A: Yes! The component uses Tailwind classes. Override with CSS or modify component directly.

**Q: How do I handle errors?**
A: Add error state and show error message above/below table.

**Q: Can I add a "select all" checkbox?**
A: Yes, modify DataTable.tsx to add a checkbox column.

---

**Questions?** See `README.md` and `USAGE_GUIDE.md` for detailed documentation.
