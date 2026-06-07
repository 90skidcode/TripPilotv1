# 🚀 Developer Quick Start Guide

**Welcome to TripPilot Frontend!** This is your fastest path to productivity.

---

## ⚡ 5-Minute Setup

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
# http://localhost:3000
```

---

## 📚 3 Key Files to Read

### 1️⃣ [`.claude.md`](./.claude.md) — START HERE
**Your daily reference for development (1,200+ lines)**

Covers:
- Page creation template ✅
- Component creation template ✅
- All 30+ components with examples ✅
- Code patterns (forms, tables, layouts) ✅
- Common tasks & how-tos ✅
- Code standards ✅
- Debugging ✅

**Read this first:** 30 minutes will make you 80% productive

### 2️⃣ [`COMPONENT_LIBRARY.md`](./COMPONENT_LIBRARY.md) — Reference
**Complete API for all components (700+ lines)**

Includes:
- Button, Input, Card, Badge, Alert, etc.
- Form, Table, and Layout components
- All hooks (useMediaQuery, useStorage, etc.)
- Color palette reference

**Use this to:** Look up component APIs

### 3️⃣ [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Deep Dive
**System architecture & design decisions (600+ lines)**

Explains:
- Tech stack
- Project structure
- Design patterns
- Component architecture
- Page structure patterns
- State management
- Performance & accessibility

**Use this to:** Understand the big picture

---

## 🎯 First 30 Minutes

### ✅ Do This Now

1. **Read `.claude.md`** — "Quick Start" section (5 min)
2. **Run `npm run dev`** — Start dev server (2 min)
3. **Open Dashboard page** — See what it looks like (2 min)
4. **Read `.claude.md`** — "Design System" section (10 min)
5. **Read `.claude.md`** — "Core Components" section (10 min)

**Result:** You understand the design system and component structure

---

## 🏗️ Creating Your First Page

### Step 1: Read Template (3 min)
In `.claude.md`, find "Quick Start" → "Creating a New Page"

### Step 2: Create File (1 min)
```bash
# Create app/my-page/page.tsx
```

### Step 3: Copy Template (1 min)
```tsx
"use client";

import { PageContainer, PageHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader title="My Page" description="Description" />
        
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Your content */}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
```

### Step 4: Add Your Content (Varies)
Replace placeholder content with your component/logic

### Step 5: Test (1 min)
```bash
npm run dev
# Visit http://localhost:3000/my-page
```

**Done!** You've created a page in 10 minutes

---

## 🎨 Creating Your First Component

### Step 1: Read Template (3 min)
In `.claude.md`, find "Quick Start" → "Creating a New Component"

### Step 2: Create File (1 min)
```bash
# Create components/ui/my-component.tsx
```

### Step 3: Copy Template (1 min)
```tsx
import { cn } from "@/lib/cn";

export interface MyComponentProps {
  label: string;
  className?: string;
}

export function MyComponent({ label, className }: MyComponentProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <span className="font-semibold">{label}</span>
    </div>
  );
}
```

### Step 4: Build Your Component (Varies)
Add your UI and logic

### Step 5: Export (1 min)
Add to `components/ui/index.ts`:
```tsx
export { MyComponent } from "./my-component";
export type { MyComponentProps } from "./my-component";
```

### Step 6: Use It (1 min)
```tsx
import { MyComponent } from "@/components/ui";

<MyComponent label="Hello" />
```

**Done!** You've created a reusable component in ~10 minutes

---

## 🎓 Learning Path

### Day 1: Fundamentals (2 hours)
- [ ] Read `.claude.md` (sections 1-4)
- [ ] Run `npm run dev`
- [ ] Browse `COMPONENT_LIBRARY.md`
- [ ] Review 1-2 completed pages (Dashboard, Leads)
- [ ] Create first simple component

### Day 2: Patterns (3 hours)
- [ ] Read `.claude.md` (sections 5-7)
- [ ] Create first page using template
- [ ] Implement data fetching from a page
- [ ] Add form to a page
- [ ] Test responsive design

### Day 3: Advanced (4 hours)
- [ ] Read `ARCHITECTURE.md`
- [ ] Create page with table
- [ ] Create page with form validation
- [ ] Implement error handling
- [ ] Add loading states

**By Day 3:** Full productivity on new features

---

## 🔑 Essential Patterns

### Page Structure
```tsx
<PageContainer>
  <div className="space-y-6">
    <PageHeader title="Title" description="Desc" />
    <Card>
      <CardHeader><CardTitle>Title</CardTitle></CardHeader>
      <CardContent>{/* Content */}</CardContent>
    </Card>
  </div>
</PageContainer>
```

### Component Pattern
```tsx
export interface MyProps {
  variant?: "primary" | "secondary";
  className?: string;
}

export function MyComponent({ variant, className }: MyProps) {
  return <div className={cn("base-classes", className)} />;
}
```

### Data Fetching
```tsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadData();
}, []);

async function loadData() {
  try {
    const result = await api.fetch();
    setData(result);
  } finally {
    setLoading(false);
  }
}
```

### Form Validation
```tsx
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const form = useForm({
  resolver: zodResolver(schema),
});

<form onSubmit={form.handleSubmit(onSubmit)}>
  <FormField control={form.control} name="email" />
  <Button type="submit">Submit</Button>
</form>
```

---

## 📖 What to Read When

| Need | File | Section |
|------|------|---------|
| Create page | `.claude.md` | Quick Start → Creating a New Page |
| Create component | `.claude.md` | Quick Start → Creating a New Component |
| Use a component | `COMPONENT_LIBRARY.md` | [Component Name] |
| Understand system | `ARCHITECTURE.md` | Data Flow or Component Architecture |
| Form patterns | `.claude.md` | Architecture Patterns → Form Patterns |
| Table patterns | `.claude.md` | Architecture Patterns → Table Patterns |
| Code style | `.claude.md` | Code Standards |
| Debug issue | `.claude.md` | Debugging |

---

## ✨ Completed Page Examples

Learn by reading these:

1. **Simple:** `app/login/page.tsx` (90 lines)
   - Basic form page
   - No state management
   - No data fetching

2. **Medium:** `app/itinerary/page.tsx` (107 lines)
   - List with grid layout
   - Pagination
   - Basic CRUD

3. **Complex:** `app/dashboard/page.tsx` (280 lines)
   - Multiple sections
   - Charts and KPIs
   - Data aggregation

4. **Very Complex:** `app/leads/page.tsx` (250 lines)
   - Tabs
   - Search and filtering
   - Table with actions
   - Modals

---

## 🎯 Common Tasks

### Add a Button
```tsx
import { Button } from "@/components/ui/button";

<Button variant="primary">Click me</Button>
<Button variant="destructive" size="sm">Delete</Button>
```

### Add an Input
```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>
```

### Show Error Toast
```tsx
import { useToast } from "@/components/Toast";

const { showToast } = useToast();

showToast({
  type: "error",
  message: "Something went wrong!",
  duration: 5000,
});
```

### Show Loading State
```tsx
import { Spinner } from "@/components/ui/spinner";

{loading ? <Spinner /> : <Content />}
```

### Responsive Grid
```tsx
import { ResponsiveGrid } from "@/components/layout";

<ResponsiveGrid columns={3} gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</ResponsiveGrid>
```

---

## ❌ Common Mistakes

### ❌ Don't Do This

```tsx
// ❌ WRONG: Using inline styles
<div style={{ padding: "16px", color: "#7C3AED" }}>

// ❌ WRONG: Hardcoding colors
<div className="bg-purple-600">

// ❌ WRONG: Using custom CSS classes
<div className="custom-card">

// ❌ WRONG: No error handling
const data = await fetch(url).then(r => r.json());

// ❌ WRONG: Complex logic in render
{complexFunction() && <Component />}
```

### ✅ Do This Instead

```tsx
// ✅ CORRECT: Tailwind classes
<div className="p-4 text-primary">

// ✅ CORRECT: Design system colors
<div className="bg-primary">

// ✅ CORRECT: Design system components
<Card>

// ✅ CORRECT: Proper error handling
try {
  const data = await fetch(url).then(r => r.json());
} catch (error) {
  showToast({ type: "error", message: "Failed" });
}

// ✅ CORRECT: Extract complex logic
const isVisible = complexFunction();
{isVisible && <Component />}
```

---

## 🚨 When You Get Stuck

### TypeScript Error?
1. Read the error message carefully
2. Check `.claude.md` → Debugging → Common Issues
3. Run `npm run build` to see full error
4. Check imports and prop types

### Component Not Showing?
1. Check component is imported
2. Verify prop names are correct
3. Check for console errors
4. Make sure you're using the right component

### Styling Wrong?
1. Never use inline `style={{}}` 
2. Use Tailwind classes instead
3. Check class names are spelled right
4. Verify color/spacing tokens exist

### Data Not Fetching?
1. Check API endpoint is correct
2. Add console.log to debug
3. Check network tab in DevTools
4. Handle errors properly

---

## 🔗 Quick Links

| Resource | Location |
|----------|----------|
| Developer Guide | [`.claude.md`](./.claude.md) |
| Component Library | [`COMPONENT_LIBRARY.md`](./COMPONENT_LIBRARY.md) |
| Architecture | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Completion Summary | [`PHASE_7_8_COMPLETION.md`](./PHASE_7_8_COMPLETION.md) |
| Completed Pages | [`app/`](./app/) |
| UI Components | [`components/ui/`](./components/ui/) |
| Validation Schemas | [`lib/schemas/`](./lib/schemas/) |
| Custom Hooks | [`hooks/`](./hooks/) |

---

## 💡 Pro Tips

1. **Use TypeScript Intellisense** — Hover over components for full API docs
2. **Check Completed Pages** — Copy patterns from similar pages
3. **Read JSDoc Comments** — Components have `@example` sections
4. **Test Responsive Design** — Use DevTools device toolbar
5. **Keep Documentation Updated** — Update `.claude.md` as you add features
6. **Follow Established Patterns** — Don't invent new patterns
7. **Write Accessibility First** — Use semantic HTML and ARIA labels
8. **Component Reusability** — Check component library before creating custom

---

## 📞 Need Help?

1. **Quick lookup:** `COMPONENT_LIBRARY.md`
2. **How-to guide:** `.claude.md` → Common Tasks
3. **Architecture question:** `ARCHITECTURE.md`
4. **Code example:** Completed pages in `app/`
5. **Component API:** `COMPONENT_LIBRARY.md` → [Component Name]

---

## ✅ You're Ready!

**You now have everything needed to be productive on this project.**

### Next Steps:
1. ✅ Run `npm run dev`
2. ✅ Read `.claude.md` (30 min)
3. ✅ Create first component or page
4. ✅ Ask questions if stuck

---

**Happy coding!** 🚀

---

**Last Updated:** May 23, 2026  
**Maintained By:** TripPilot Development Team
