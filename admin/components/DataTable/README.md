# DataTable Component

A modern, production-ready data table component for the admin UI with server-side pagination, sorting, and icon-based actions.

## 📦 What's Included

```
DataTable/
├── DataTable.tsx          # Main table component
├── types.ts              # TypeScript type definitions
├── usePagination.ts      # Hook for managing pagination state
├── index.ts              # Public exports
├── USAGE_GUIDE.md        # Comprehensive usage guide
├── ExampleUsageUsers.tsx # Real-world example
└── README.md             # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install lucide-react
```

### 2. Basic Implementation

```tsx
"use client";

import { useState, useEffect } from "react";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { usePagination } from "@/components/DataTable/usePagination";
import { Edit2, Trash2 } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  status: "active" | "inactive";
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { pagination, sort, handlers } = usePagination(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/products?page=${pagination.page}&pageSize=${pagination.pageSize}`
        );
        const data = await res.json();
        setProducts(data.products);
        setTotal(data.total);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [pagination.page, pagination.pageSize]);

  const columns: DataTableColumn<Product>[] = [
    { key: "id", header: "ID", width: "80px" },
    { key: "name", header: "Name", sortable: true },
    {
      key: "price",
      header: "Price",
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            value === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  const actions = [
    {
      id: "edit",
      icon: <Edit2 className="w-4 h-4" />,
      label: "Edit",
      onClick: (product) => console.log("Edit", product.id),
    },
    {
      id: "delete",
      icon: <Trash2 className="w-4 h-4" />,
      label: "Delete",
      onClick: (product) => console.log("Delete", product.id),
      variant: "danger" as const,
    },
  ];

  return (
    <DataTable<Product>
      columns={columns}
      data={products}
      actions={actions}
      pagination={{ ...pagination, total }}
      onPaginationChange={handlers.onPaginationChange}
      onSort={handlers.onSort}
      isLoading={isLoading}
      emptyMessage="No products found"
    />
  );
}
```

## 🎯 Key Features

### ✨ Modern Design
- Clean, professional UI with Tailwind CSS
- Dark/light mode compatible
- Smooth animations and transitions
- Responsive layout

### 📊 Data Management
- Server-side pagination
- Column sorting with visual indicators
- Custom cell rendering
- Type-safe with TypeScript

### 🎨 Icon-Based Actions
- Built-in action buttons
- Multiple action variants (default, danger, success, warning)
- Tooltips for accessibility
- Conditional visibility and disabled states

### ⚙️ Pagination
- Configurable page sizes (10, 25, 50, 100)
- Smart page number display (shows 5 pages max)
- First/last navigation buttons
- Current position indicator

### 🎭 States
- Loading skeleton
- Empty state with custom message
- Action loading indicators
- Disabled action states

## 📚 API Reference

### DataTable Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `columns` | `DataTableColumn<T>[]` | Yes | Column definitions |
| `data` | `T[]` | Yes | Table data |
| `actions` | `DataTableAction<T>[]` | No | Action buttons |
| `pagination` | `PaginationState` | Yes | Current pagination state |
| `onPaginationChange` | `(page, size) => void` | Yes | Pagination change handler |
| `onSort` | `(field, order) => void` | No | Sort handler |
| `isLoading` | `boolean` | No | Loading state (default: false) |
| `emptyMessage` | `string` | No | Empty state message |
| `emptyIcon` | `string` | No | Empty state emoji/icon |
| `compact` | `boolean` | No | Reduce padding (default: false) |
| `striped` | `boolean` | No | Alternate row colors (default: true) |
| `hoverable` | `boolean` | No | Hover effects (default: true) |

### Column Definition (DataTableColumn<T>)

```typescript
interface DataTableColumn<T> {
  key: keyof T | string;                    // Data key
  header: string;                           // Column header
  width?: string;                           // CSS width
  sortable?: boolean;                       // Enable sorting
  render?: (value, row, index) => ReactNode;// Custom renderer
  align?: "left" | "center" | "right";      // Alignment
}
```

### Action Definition (DataTableAction<T>)

```typescript
interface DataTableAction<T> {
  id: string;                       // Unique ID
  icon: ReactNode;                  // Icon component
  label: string;                    // Accessibility label
  tooltip?: string;                 // Hover text
  onClick: (row: T) => void | Promise<void>;
  variant?: "default" | "danger" | "success" | "warning";
  disabled?: (row: T) => boolean;   // Disable condition
  show?: (row: T) => boolean;       // Visibility condition
  loading?: boolean;                // Loading state
}
```

### usePagination Hook

```typescript
const {
  pagination,    // { page, pageSize, total }
  sort,         // { field, order }
  handlers,     // { onPaginationChange, onSort }
  resetPagination
} = usePagination(totalItems, {
  initialPage: 1,
  initialPageSize: 25
});
```

## 🎨 Styling

### Tailwind Classes Used
- Core: `w-full`, `flex`, `gap-`, `rounded-lg`, `border`
- States: `hover:`, `disabled:`, `group-`
- Colors: `slate-*`, `blue-*`, `red-*`, `green-*`, `amber-*`
- Typography: `text-xs`, `font-semibold`, `uppercase`

### Customization
Override styles using CSS:
```css
.data-table-header {
  background-color: #f3f4f6;
}

.data-table-row:hover {
  background-color: #f0f9ff;
}

.data-table-action {
  padding: 0.5rem;
}
```

## 📖 Examples

### With Search
```tsx
const [search, setSearch] = useState("");

useEffect(() => {
  // Fetch with search param
}, [search, pagination.page]);

return (
  <div className="space-y-4">
    <input
      placeholder="Search..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
    <DataTable {...props} />
  </div>
);
```

### With Filters
```tsx
const [status, setStatus] = useState("all");

useEffect(() => {
  // Fetch with status filter
}, [status, pagination.page]);

return (
  <div className="space-y-4">
    <select value={status} onChange={(e) => setStatus(e.target.value)}>
      <option value="all">All</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>
    <DataTable {...props} />
  </div>
);
```

### Custom Rendering
```tsx
const columns: DataTableColumn<User>[] = [
  {
    key: "avatar",
    header: "Avatar",
    width: "50px",
    render: (_, user) => (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="w-8 h-8 rounded-full"
      />
    ),
  },
  {
    key: "role",
    header: "Role",
    render: (value, user) => {
      const colors = {
        admin: "red",
        user: "blue",
        guest: "gray",
      };
      return (
        <Badge color={colors[value]}>
          {value.toUpperCase()}
        </Badge>
      );
    },
  },
];
```

## 🔒 TypeScript Support

Fully typed component with generics:

```tsx
interface MyData {
  id: number;
  name: string;
  status: "active" | "inactive";
}

<DataTable<MyData>
  columns={...}
  data={...}
  // Only valid keys and types allowed
/>
```

## 🧪 Testing Tips

1. **Unit Tests**: Test column rendering, action handlers
2. **Integration Tests**: Test pagination, sorting flows
3. **E2E Tests**: Test complete user workflows
4. **Accessibility**: Test keyboard navigation, screen reader

## 🐛 Troubleshooting

### Table not updating on sort
- Ensure `onSort` is passed and updates API call
- Check that sort state is included in API params

### Pagination not working
- Verify `total` is set correctly
- Ensure `onPaginationChange` updates state
- Check API returns correct pagination data

### Actions not responding
- Ensure action handlers are defined correctly
- Check for JavaScript errors in console
- Verify async operations complete

### Styling issues
- Ensure Tailwind CSS is configured
- Check for CSS conflicts
- Verify dark mode setup

## 📱 Browser Support

- Chrome/Edge: Latest
- Firefox: Latest
- Safari: Latest 2 versions
- Mobile browsers: Latest

## 🤝 Contributing

When extending the DataTable:
1. Update types in `types.ts`
2. Add new features to `DataTable.tsx`
3. Update `USAGE_GUIDE.md` with examples
4. Test with TypeScript strict mode

## 📝 License

Part of the TripPilot Admin UI
