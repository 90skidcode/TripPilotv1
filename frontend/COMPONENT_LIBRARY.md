# TripPilot Component Library

Complete reference for all available components in the TripPilot design system.

---

## Layout Components

### PageContainer
Responsive max-width container with consistent padding.

```tsx
import { PageContainer } from "@/components/layout";

<PageContainer>
  {/* Content */}
</PageContainer>
```

**Props:**
- `children: React.ReactNode` — Content to wrap

**Features:**
- Max-width 1280px
- Responsive padding (4px on mobile, 6px on desktop)
- Automatic margin centering

---

### PageHeader
Page title with optional description and action slot.

```tsx
import { PageHeader } from "@/components/layout";

<PageHeader 
  title="Dashboard"
  description="View your business metrics"
/>
```

**Props:**
- `title: string` — Page title
- `description?: string` — Subtitle/description
- `action?: React.ReactNode` — Optional action buttons slot

**Features:**
- Large, readable typography
- Semantic heading structure
- Action slot for buttons

---

### Section
Grouped content container with optional title.

```tsx
import { Section } from "@/components/layout";

<Section 
  title="Profile Details"
  description="Update your information"
>
  <Input placeholder="Name" />
</Section>
```

**Props:**
- `title?: string` — Section heading
- `description?: string` — Subtitle
- `children: React.ReactNode` — Content
- `className?: string` — Additional classes
- `contentClassName?: string` — Classes for content wrapper

---

### ResponsiveGrid
Adaptive grid layout with configurable columns.

```tsx
import { ResponsiveGrid } from "@/components/layout";

<ResponsiveGrid columns={3} gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</ResponsiveGrid>
```

**Props:**
- `columns: 1 | 2 | 3 | 4` — Number of columns (default: 3)
- `gap: 'sm' | 'md' | 'lg'` — Gap between items (default: 'md')
- `children: React.ReactNode` — Grid items
- `className?: string` — Additional classes

**Responsive Behavior:**
- 1 column: Mobile only
- 2 columns: Mobile (1), Tablet+ (2)
- 3 columns: Mobile (1), Tablet (2), Desktop (3)
- 4 columns: Mobile (1), Tablet (2), Desktop (4)

---

### Breadcrumb
Navigation breadcrumb trail with automatic styling.

```tsx
import { Breadcrumb } from "@/components/layout";

<Breadcrumb items={[
  { label: "Home", href: "/" },
  { label: "Leads", href: "/leads" },
  { label: "John Doe" },
]} />
```

**Props:**
- `items: BreadcrumbItem[]` — Breadcrumb items
  - `label: string` — Display text
  - `href?: string` — Link URL (omit for current page)

---

## UI Components

### Button
Interactive button with multiple variants and sizes.

```tsx
import { Button } from "@/components/ui/button";

<Button>Default</Button>
<Button variant="primary">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button disabled>Disabled</Button>
```

**Variants:**
- `default` — Secondary button
- `primary` — Main action button
- `secondary` — Muted action button
- `destructive` — Danger/delete action
- `outline` — Bordered button
- `ghost` — Text-only button
- `link` — Link-styled button

**Sizes:**
- `default` — 40px height, 16px padding
- `sm` — 36px height, 12px padding
- `lg` — 44px height, 20px padding
- `icon` — Square button for icon-only

**Props:**
- `variant?: string` — Button style
- `size?: string` — Button size
- `disabled?: boolean` — Disabled state
- `asChild?: boolean` — Render as child element
- `className?: string` — Additional classes

---

### Input
Text input field with optional label and error handling.

```tsx
import { Input } from "@/components/ui/input";

<Input 
  type="email"
  placeholder="user@example.com"
  disabled={false}
/>
```

**Props:**
- `type?: string` — HTML input type (default: 'text')
- `placeholder?: string` — Placeholder text
- `disabled?: boolean` — Disabled state
- `className?: string` — Additional classes
- All standard HTML input attributes

**Features:**
- Accessible focus states
- Error styling (add `aria-invalid` for errors)
- Mobile-friendly keyboard handling

---

### Label
Form label with optional required indicator.

```tsx
import { Label } from "@/components/ui/label";

<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />
```

**Props:**
- `htmlFor?: string` — Associated input ID
- `required?: boolean` — Show required indicator
- `children: React.ReactNode` — Label text
- `className?: string` — Additional classes

---

### Textarea
Multi-line text input with character counter.

```tsx
import { Textarea } from "@/components/ui/textarea";

<Textarea 
  placeholder="Enter your message"
  rows={4}
  maxLength={500}
/>
```

**Props:**
- `rows?: number` — Number of rows (default: 3)
- `maxLength?: number` — Maximum characters
- `placeholder?: string` — Placeholder text
- `disabled?: boolean` — Disabled state
- All standard HTML textarea attributes

**Features:**
- Character counter (if `maxLength` set)
- Auto-resize on content
- Error styling support

---

### Card
Container component with flexible sections.

```tsx
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional subtitle</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Components:**
- `Card` — Main container
- `CardHeader` — Top section
- `CardTitle` — Large heading
- `CardDescription` — Subtitle text
- `CardContent` — Main content area
- `CardFooter` — Bottom action area

**Features:**
- Consistent padding and spacing
- Subtle shadow and border
- Flexible composition

---

### Badge
Status indicator with multiple variants.

```tsx
import { Badge } from "@/components/ui/badge";

<Badge>Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Completed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Error</Badge>
```

**Variants:**
- `default` — Gray neutral
- `primary` — Purple primary
- `secondary` — Light gray
- `destructive` — Red danger
- `success` — Green success
- `warning` — Amber warning
- `info` — Blue information
- `outline` — Bordered style

**Props:**
- `variant?: string` — Badge style
- `children: React.ReactNode` — Badge text
- `className?: string` — Additional classes

---

### Alert
Alert message container with variants.

```tsx
import { Alert, AlertDescription } from "@/components/ui/alert";

<Alert variant="destructive">
  <AlertDescription>
    An error occurred. Please try again.
  </AlertDescription>
</Alert>
```

**Variants:**
- `default` — Neutral alert
- `destructive` — Error message
- `success` — Success message
- `warning` — Warning message
- `info` — Information message

**Components:**
- `Alert` — Container
- `AlertDescription` — Text content

**Features:**
- Icon and colored left border
- Accessible for screen readers
- Full-width by default

---

### Dialog
Modal dialog for important interactions.

```tsx
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="destructive">Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Components:**
- `Dialog` — Modal container
- `DialogContent` — Centered content area
- `DialogHeader` — Top section
- `DialogTitle` — Modal title
- `DialogDescription` — Description text
- `DialogFooter` — Bottom action area

**Features:**
- Focus trap
- Escape key to close
- Click outside to close
- Accessibility support

---

### Checkbox
Accessible checkbox input with custom styling.

```tsx
import { Checkbox } from "@/components/ui/checkbox";

<Checkbox id="terms" />
<label htmlFor="terms">I agree to terms</label>
```

**Props:**
- `id?: string` — Input ID for label association
- `checked?: boolean` — Checked state
- `onChange?: (checked: boolean) => void` — Change handler
- `disabled?: boolean` — Disabled state
- `indeterminate?: boolean` — Indeterminate state (for select-all)

**Features:**
- Custom SVG checkmark
- Indeterminate state support
- Keyboard accessible

---

### Radio
Accessible radio button group.

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";

<RadioGroup value={selected} onValueChange={setSelected}>
  <RadioGroupItem value="option1" id="opt1" />
  <label htmlFor="opt1">Option 1</label>
  
  <RadioGroupItem value="option2" id="opt2" />
  <label htmlFor="opt2">Option 2</label>
</RadioGroup>
```

**Components:**
- `RadioGroup` — Container
- `RadioGroupItem` — Individual radio

**Props:**
- `value: string` — Selected value
- `onValueChange: (value: string) => void` — Change handler
- `disabled?: boolean` — Disabled state

---

### Select
Dropdown select input.

```tsx
import { Select } from "@/components/ui/select";

<Select value={selected} onValueChange={setSelected}>
  <option value="">-- Select --</option>
  <option value="a">Option A</option>
  <option value="b">Option B</option>
</Select>
```

**Props:**
- `value: string` — Selected value
- `onValueChange: (value: string) => void` — Change handler
- `disabled?: boolean` — Disabled state
- All standard HTML select attributes

---

### Switch
Toggle switch for boolean values.

```tsx
import { Switch } from "@/components/ui/switch";

<Switch 
  checked={isEnabled}
  onChange={setIsEnabled}
/>
```

**Props:**
- `checked: boolean` — Current state
- `onChange: (checked: boolean) => void` — Change handler
- `disabled?: boolean` — Disabled state

**Features:**
- Animated thumb
- Keyboard accessible
- Label support

---

### Separator
Horizontal or vertical divider.

```tsx
import { Separator } from "@/components/ui/separator";

<div>Content 1</div>
<Separator />
<div>Content 2</div>
```

**Props:**
- `orientation?: 'horizontal' | 'vertical'` — Direction
- `className?: string` — Additional classes

---

### Spinner
Loading indicator with multiple sizes.

```tsx
import { Spinner } from "@/components/ui/spinner";

<Spinner />
<Spinner size="sm" />
<Spinner size="lg" />
```

**Props:**
- `size?: 'sm' | 'md' | 'lg'` — Spinner size
- `className?: string` — Additional classes

**Features:**
- Animated border gradient
- Accessible (uses aria-live)
- Multiple size options

---

### Skeleton
Placeholder for loading states.

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-2/3" />
</div>
```

**Features:**
- Animated pulse effect
- Flexible sizing
- Multiple variations

---

## Form Components

### FormProvider
React Hook Form provider with Zod validation.

```tsx
import { FormProvider } from "@/components/forms";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </FormProvider>
  );
}
```

---

### FormField
Wrapper for form field with label, description, and error display.

```tsx
import { FormField } from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Controller, useFormContext } from "react-hook-form";

export function EmailField() {
  const { control } = useFormContext();
  
  return (
    <FormField
      control={control}
      name="email"
      label="Email Address"
      description="We'll never share your email"
      render={({ field }) => <Input {...field} type="email" />}
    />
  );
}
```

---

### FormFieldArray
Dynamic field array for repeated fields.

```tsx
import { FormFieldArray } from "@/components/forms";
import { useFieldArray, useFormContext } from "react-hook-form";

export function LineItems() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  return (
    <FormFieldArray
      fields={fields}
      onAdd={() => append({ description: "", qty: 1, rate: 0 })}
      onRemove={(index) => remove(index)}
      render={(field, index) => (
        // Field content
      )}
    />
  );
}
```

---

## Table Components

### DataTable
Advanced data table with sorting, filtering, pagination, and selection.

```tsx
import { DataTable } from "@/components/tables/DataTable";
import { createColumnHelper } from "@tanstack/react-table";

interface User {
  id: number;
  name: string;
  email: string;
}

export function UsersTable({ data, loading }) {
  const columnHelper = createColumnHelper<User>();

  const columns = [
    columnHelper.accessor("name", {
      header: "Name",
    }),
    columnHelper.accessor("email", {
      header: "Email",
    }),
  ];

  return (
    <DataTable 
      columns={columns} 
      data={data}
      loading={loading}
    />
  );
}
```

**Features:**
- Column sorting
- Global search/filter
- Row selection
- Pagination
- Loading state
- Empty state

---

### ColumnHeader
Sortable column header with icons.

```tsx
import { ColumnHeader } from "@/components/tables/ColumnHeader";

columnHelper.accessor("name", {
  header: ({ column }) => (
    <ColumnHeader column={column} title="Name" />
  ),
})
```

---

### DataTablePagination
Pagination controls for tables.

Automatically included in `DataTable` component.

---

### DataTableToolbar
Search and filter toolbar for tables.

Automatically included in `DataTable` component.

---

### RowActions
Context menu for row-level actions.

```tsx
import { RowActions } from "@/components/tables/RowActions";

<RowActions
  items={[
    { label: "Edit", icon: "✏️", onClick: handleEdit },
    { label: "Delete", icon: "🗑️", onClick: handleDelete },
  ]}
/>
```

---

## Hooks

### useMediaQuery
Media query matching hook.

```tsx
import { useMediaQuery, useIsMobile, useIsTablet } from "@/hooks";

const isMobile = useIsMobile();
const isTablet = useIsTablet();
const isDesktop = useIsDesktop();
const matches = useMediaQuery("(max-width: 768px)");
```

**Breakpoints:**
- `xs`: 320px
- `sm`: 640px (mobile)
- `md`: 768px (tablet)
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

### useSidebar
Sidebar open/closed state with localStorage persistence.

```tsx
import { useSidebar } from "@/hooks";

const { isOpen, toggle, open, close } = useSidebar();
```

---

### useStorage
localStorage/sessionStorage with React integration.

```tsx
import { useLocalStorage, useSessionStorage } from "@/hooks";

const { value, setValue, removeValue, isLoading } = useLocalStorage("key");
const { value: sessionVal } = useSessionStorage("session-key");
```

---

### useAsync
Async function execution with state management.

```tsx
import { useAsync } from "@/hooks";

const { data, status, error, execute, reset } = useAsync(
  async () => {
    const res = await fetch("/api/data");
    return res.json();
  },
  true // Execute immediately
);
```

**Status:** `'idle' | 'pending' | 'success' | 'error'`

---

### useDisclosure
Simple open/closed state management.

```tsx
import { useDisclosure } from "@/hooks";

const { isOpen, open, close, toggle } = useDisclosure(false);
```

---

## Theme

### Colors
All colors are CSS variables defined in `globals.css`. Use via Tailwind:

```tsx
className="bg-primary text-primary"
className="bg-destructive text-destructive-foreground"
className="bg-muted text-muted-foreground"
```

**Available Colors:**
- Primary & variants
- Secondary & variants
- Destructive & variants
- Success & variants
- Warning & variants
- Info & variants
- Background & variants
- Muted & variants
- Border
- Ring

---

### Spacing
4px base scale:

```tsx
className="p-1"  // 4px
className="p-2"  // 8px
className="p-4"  // 16px
className="p-6"  // 24px
```

---

## Validation Schemas

All validation schemas located in `lib/schemas/`:

- `auth.schema.ts` — Login/register forms
- `customer.schema.ts` — Customer data
- `lead.schema.ts` — Lead management
- `itinerary.schema.ts` — Itinerary creation
- `voucher.schema.ts` — Voucher generation

Import and use with React Hook Form + Zod.

---

**Last Updated:** May 2026
