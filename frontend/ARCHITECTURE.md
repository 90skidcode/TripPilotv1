# TripPilot Frontend Architecture

High-level overview of the TripPilot CRM frontend architecture, design patterns, and technology stack.

---

## Technology Stack

### Framework & Build
- **Next.js 16.2** — React framework with App Router
- **React 19** — UI library
- **TypeScript** — Type-safe JavaScript with strict mode
- **Turbopack** — Fast bundler and compiler
- **TailwindCSS v4** — Utility-first CSS framework

### Component Libraries
- **Radix UI** — Headless component primitives
- **TanStack Table v8** — Advanced data table framework
- **Class Variance Authority (CVA)** — Type-safe component variants
- **clsx + TailwindCSS Merge** — Intelligent classname merging

### Form & Validation
- **React Hook Form** — Lightweight form state management
- **Zod** — TypeScript-first schema validation
- **@hookform/resolvers** — Form validation bridge

### State Management
- **React Hooks** — Built-in state management
- **Context API** — Application-wide state (auth, theme)
- **localStorage** — Client-side persistence

### HTTP & API
- **Fetch API** — Native HTTP client
- **Custom API client** — Type-safe wrapper functions

---

## Project Structure

```
frontend/
├── .claude.md                    # This file - Developer guide
├── COMPONENT_LIBRARY.md          # Component reference
├── ARCHITECTURE.md               # This file
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home redirect
│   ├── dashboard/page.tsx        # Main pages
│   ├── leads/page.tsx
│   ├── itinerary/page.tsx
│   ├── [id]/page.tsx             # Dynamic routes
│   └── ...
├── components/
│   ├── ui/                       # Core UI components (button, input, etc.)
│   ├── layout/                   # Layout components (PageHeader, Section, etc.)
│   ├── forms/                    # Form components (FormProvider, FormField)
│   ├── tables/                   # Table components (DataTable, etc.)
│   ├── providers/                # Context providers
│   │   ├── ThemeProvider.tsx     # Light/dark mode
│   │   └── AuthProvider.tsx      # Authentication
│   ├── AppShell.tsx              # Main layout wrapper
│   └── index.ts                  # Central exports
├── hooks/                        # Custom React hooks
│   ├── useMediaQuery.ts
│   ├── useSidebar.ts
│   ├── useStorage.ts
│   ├── useAsync.ts
│   ├── useDisclosure.ts
│   └── index.ts
├── lib/
│   ├── theme-colors.ts           # Color tokens (50+ variables)
│   ├── spacing.ts                # Spacing scale (4px base)
│   ├── typography.ts             # Typography scale (6 sizes)
│   ├── cn.ts                     # classname merge utility
│   ├── storage.ts                # localStorage/sessionStorage helpers
│   ├── api.ts                    # API client setup
│   ├── schemas/                  # Zod validation schemas
│   │   ├── auth.schema.ts
│   │   ├── customer.schema.ts
│   │   ├── lead.schema.ts
│   │   ├── itinerary.schema.ts
│   │   └── index.ts
│   └── index.ts                  # Central exports
├── context/
│   ├── AuthContext.tsx           # Auth context
│   └── index.ts
├── styles/
│   └── globals.css               # Global CSS + Tailwind directives + CSS variables
├── public/                       # Static assets
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration (strict mode)
├── next.config.js                # Next.js configuration
├── postcss.config.js             # PostCSS/Tailwind config
└── package.json                  # Dependencies

```

---

## Design System

### Color Tokens

All colors are defined as CSS variables in `globals.css` and exposed via Tailwind:

```css
/* Light mode */
--primary: 280 100% 50%;        /* #7C3AED (Indigo) */
--primary-foreground: 0 0% 100%;
--secondary: 214 88% 54%;       /* #3B82F6 (Blue) */
--destructive: 0 84% 60%;       /* #EF4444 (Red) */
--success: 142 72% 29%;         /* #10B981 (Green) */
--warning: 38 92% 50%;          /* #F59E0B (Amber) */
--info: 217 92% 59%;            /* #0EA5E9 (Sky) */
--background: 0 0% 100%;
--muted: 210 40% 96%;
--border: 214 32% 91%;
```

**Usage:**
```tsx
className="bg-primary text-primary-foreground"
className="border border-border"
className="text-destructive"
```

### Spacing Scale

4px base scale (Tailwind default):

```
p-1  = 4px   (1 unit)
p-2  = 8px   (2 units)
p-3  = 12px  (3 units)
p-4  = 16px  (4 units)
p-6  = 24px  (6 units)
p-8  = 32px  (8 units)
```

Used consistently across components and pages.

### Typography System

6-tier typography scale:

```
Display:  32px, bold,       (h1.text-3xl)
Heading:  24px, bold,       (h2.text-2xl)
Title:    18px, semibold,   (h3.text-lg)
Subtitle: 16px, semibold,   (h4.text-base)
Body:     16px, normal,     (p.text-base)
Caption:  12px, normal,     (p.text-xs)
```

---

## Data Flow

### Component Hierarchy

```
Layout
  ↓
PageContainer
  ↓
PageHeader + [Main Content]
  ↓
Card / Grid / Form
  ↓
UI Components (Button, Input, Badge, etc.)
```

### State Management Pattern

**Local Component State:**
```tsx
const [isOpen, setIsOpen] = useState(false);
const [data, setData] = useState<Data[]>([]);
```

**Global Application State:**
```tsx
// Contexts (auth, theme, user permissions)
const { user, isAuthenticated } = useAuth();
const { theme, toggleTheme } = useTheme();
```

**Persistent State:**
```tsx
// localStorage with hooks
const { value, setValue } = useLocalStorage("key");
const { isOpen, toggle } = useSidebar();
```

### Data Fetching Pattern

```tsx
useEffect(() => {
  loadData();
}, [dependencies]);

async function loadData() {
  setLoading(true);
  try {
    const data = await api.fetch();
    setData(data);
  } catch (error) {
    showToast({ type: "error", message: "Failed to load" });
  } finally {
    setLoading(false);
  }
}
```

---

## Component Architecture

### UI Component Pattern (CVA-based)

All UI components use Class Variance Authority for type-safe variants:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-muted",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

**Benefits:**
- ✅ Type-safe variant combinations
- ✅ No invalid variant combinations possible
- ✅ Intellisense in editor
- ✅ Easy to extend and maintain

### Layout Component Pattern

Layout components compose to create page structure:

```tsx
<PageContainer>
  <PageHeader title="Title" />
  <ResponsiveGrid columns={3}>
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Section title="Group">
          {/* Content */}
        </Section>
      </CardContent>
    </Card>
  </ResponsiveGrid>
</PageContainer>
```

### Form Component Pattern

Forms use React Hook Form + Zod validation:

```tsx
const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});

type FormData = z.infer<typeof schema>;

export function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur", // Validate on blur
  });

  async function onSubmit(data: FormData) {
    // Submit to API
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="email"
        label="Email"
        render={({ field }) => <Input type="email" {...field} />}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

**Benefits:**
- ✅ Single source of truth for validation
- ✅ Type-safe form data
- ✅ Automatic error handling and display
- ✅ Minimal boilerplate

### Table Component Pattern

Tables use TanStack Table v8 for advanced features:

```tsx
interface Item {
  id: number;
  name: string;
  status: string;
}

export function ItemsTable({ items, loading }) {
  const columns = useMemo(() => [
    {
      id: "name",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => row.original.name,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge>{row.original.status}</Badge>
      ),
    },
  ], []);

  return <DataTable columns={columns} data={items} loading={loading} />;
}
```

**Built-in Features:**
- ✅ Column sorting
- ✅ Global and column-specific filtering
- ✅ Row selection
- ✅ Pagination
- ✅ Loading and empty states

---

## Page Architecture

### Standard Page Structure

All pages follow this pattern:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { PageContainer, PageHeader } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { someApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";

export default function PageName() {
  // Permission checks
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("resource", "write");

  // Toast notifications
  const { showToast } = useToast();

  // Page state
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Data fetching
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await someApi.list({ page });
      setItems(data.items);
    } catch (error) {
      showToast({ type: "error", message: "Failed to load" });
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Event handlers
  async function handleCreate() {
    try {
      // Create logic
      showToast({ type: "success", message: "Created" });
      loadData();
    } catch (error) {
      showToast({ type: "error", message: "Failed" });
    }
  }

  // Render
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader title="Title" description="Description" />
        
        <Card>
          <CardContent className="pt-6">
            {/* Content */}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
```

### Page Checklist

When creating a new page:

- [ ] Import `PageContainer` and `PageHeader`
- [ ] Add `"use client"` directive
- [ ] Import components and hooks needed
- [ ] Use `useAuth()` for permission checks
- [ ] Use `useToast()` for notifications
- [ ] Implement error handling with try/catch
- [ ] Show loading and empty states
- [ ] Use TypeScript for all state
- [ ] Make API calls in useCallback/useEffect
- [ ] Test responsive layout (mobile, tablet, desktop)

---

## Authentication & Authorization

### Auth Context

Located in `context/AuthContext.tsx`:

```tsx
const { 
  user,                    // Current user object
  isAuthenticated,         // Boolean
  login,                   // Login function
  logout,                  // Logout function
  hasPermission,           // Permission check: hasPermission("resource", "read|write")
} = useAuth();
```

### Permission Model

Permissions are checked via `hasPermission(resource, action)`:

```tsx
const canViewLeads = hasPermission("leads", "read");
const canWriteLeads = hasPermission("leads", "write");
const canManageTeam = hasPermission("team", "admin");
```

### Protected Routes

Routes are protected via `AuthContext`. Unauthenticated users are redirected to login.

---

## API Integration

### API Client

Located in `lib/api.ts`:

```tsx
// Example API calls
const data = await leadsApi.list({ page: 1, search: "John" });
const lead = await leadsApi.get(id);
await leadsApi.create(leadData);
await leadsApi.update(id, leadData);
await leadsApi.delete(id);
```

### API Response Handling

```tsx
async function loadData() {
  try {
    const response = await fetch("/api/endpoint");
    if (!response.ok) {
      throw new Error("API error");
    }
    const data = await response.json();
    setData(data);
  } catch (error) {
    console.error(error);
    showToast({ type: "error", message: error.message });
  }
}
```

---

## Performance Optimization

### Code Splitting

Pages are automatically code-split by Next.js App Router. Dynamic imports for heavy components:

```tsx
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Spinner />,
});
```

### Memoization

Use `useMemo` for expensive calculations:

```tsx
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

Use `useCallback` for event handlers:

```tsx
const handleClick = useCallback(() => {
  // Handle click
}, [dependencies]);
```

### Image Optimization

Use Next.js Image component for images:

```tsx
import Image from "next/image";

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority
/>
```

---

## Testing & Quality

### TypeScript Strict Mode

All code must pass TypeScript strict mode:

```bash
npm run build  # Includes TypeScript check
```

### Code Quality Checks

```bash
# Build with full type checking
npm run build

# Development mode with hot reload
npm run dev

# Format code (if configured)
npm run format
```

---

## Accessibility (a11y)

### Semantic HTML

Always use semantic HTML elements:

```tsx
// ✅ CORRECT
<button onClick={handleClick}>Click me</button>
<a href="/page">Link</a>
<nav>Navigation</nav>
<main>Main content</main>

// ❌ WRONG
<div onClick={handleClick}>Click me</div>
<div role="button">Click me</div>
```

### ARIA Attributes

Use ARIA attributes for complex components:

```tsx
<div role="alert" aria-live="polite">
  Error message
</div>

<div aria-expanded={isOpen} aria-controls="menu">
  Toggle menu
</div>
```

### Keyboard Navigation

All interactive elements must be keyboard accessible:

```tsx
<button tabIndex={0} onKeyDown={handleKeyDown}>
  Interactive
</button>
```

### Color Contrast

All text must have sufficient color contrast (WCAG AA minimum).

---

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

---

## Deployment

### Build Process

```bash
npm run build  # Next.js build with Turbopack
```

Output: `.next/` directory with optimized static and dynamic pages.

### Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_NAME=TripPilot
```

---

## Troubleshooting

### TypeScript Errors

If TypeScript fails to compile:

1. Check imports are correct
2. Verify component prop interfaces
3. Ensure all types are properly exported
4. Run `npm run build` to see full error

### Component Not Working

1. Check component is imported correctly
2. Verify prop names and types
3. Check for missing dependencies
4. Look for console errors

### Styling Not Applied

1. Never use inline `style={{}}` — use Tailwind classes
2. Check class names are spelled correctly
3. Verify Tailwind is processing the file
4. Check CSS variable names in globals.css

---

## Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Components](https://www.radix-ui.com/)
- [React Hook Form Guide](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [TanStack Table](https://tanstack.com/table/v8/)

---

**Last Updated:** May 2026  
**Maintained By:** TripPilot Development Team
