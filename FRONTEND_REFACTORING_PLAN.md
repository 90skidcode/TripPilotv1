# TripPilot Frontend Refactoring to Enterprise shadcn/ui Architecture

## Executive Summary

Converting the TripPilot frontend from custom CSS + inline styles to an enterprise-grade shadcn/ui design system. This plan spans 8 implementation phases with parallel execution opportunities.

**Current State:**
- 35+ .tsx page/component files
- Custom CSS, no design system
- Next.js 16 + React 19
- No UI component library
- Inline styling and ad-hoc layouts

**Target State:**
- 25+ reusable shadcn/ui components
- Enterprise table system (TanStack Table v8)
- Form architecture (React Hook Form + Zod validation)
- Consistent design tokens and spacing
- Dark/light theme support
- Responsive mobile-first design
- TypeScript strict mode
- Zero technical debt in styling

---

## Phase Breakdown with Token Estimates

### PHASE 1: Foundation & Setup (1,500–2,000 tokens)

**Duration:** 3–4 hours | **Files:** 8 new + 3 modified

**Deliverables:**
1. Install and configure shadcn/ui dependencies
   - `npm install @radix-ui/react-*` (18+ packages)
   - `npm install react-hook-form zod @hookform/resolvers`
   - `npm install @tanstack/react-table`
   - Update tsconfig.json for paths + strict mode

2. Create design token system
   - `lib/theme-colors.ts` — color palette (50+ token definitions)
   - `lib/spacing.ts` — spacing scale constants
   - `lib/typography.ts` — font size/weight/line-height scales
   - `lib/theme.ts` — theme context provider setup

3. Create base CSS framework
   - `app/globals.css` — Tailwind reset, CSS variables, dark mode
   - `app/layout.tsx` — Root layout with theme provider
   - Update Toast, Sidebar, Topbar for theme integration

4. TypeScript & ESLint configuration
   - `tsconfig.json` — strict mode, strict null checks
   - `.eslintrc.json` — shadcn/ui compatible rules
   - Add prettier config for code formatting

**Files to Create:**
- `lib/theme-colors.ts` (150 tokens)
- `lib/spacing.ts` (40 tokens)
- `lib/typography.ts` (25 scales)
- `lib/theme.ts` (150 lines)
- `app/globals.css` (250 lines)
- `app/theme-provider.tsx` (50 lines)
- `lib/cn.ts` (classname utility)
- `.prettierrc` (config)

**Files to Modify:**
- `tsconfig.json` (add paths, strict mode)
- `app/layout.tsx` (add ThemeProvider wrapper)
- `package.json` (dev dependencies)

**Token Estimate:**
- Setup & configuration: 400 tokens
- Design token system: 600 tokens
- CSS framework: 400 tokens
- Documentation: 100 tokens
- **Phase Total: 1,500 tokens (minimal) → 2,000 tokens (complete with comments)**

---

### PHASE 2: Components Library — Core (2,500–3,500 tokens)

**Duration:** 6–8 hours | **Files:** 15 new components

**Deliverables:**

Build reusable shadcn/ui-based components:

1. **Primitive Components** (Radix-based)
   - `components/ui/button.tsx` (variant system: primary, secondary, outline, ghost, destructive)
   - `components/ui/input.tsx` (input field with error state)
   - `components/ui/select.tsx` (dropdown with search)
   - `components/ui/textarea.tsx` (textarea with character count)
   - `components/ui/checkbox.tsx` (with label integration)
   - `components/ui/radio.tsx` (radio group)
   - `components/ui/switch.tsx` (toggle switch)
   - `components/ui/label.tsx` (form label with required indicator)

2. **Container Components**
   - `components/ui/card.tsx` (card with header, body, footer slots)
   - `components/ui/badge.tsx` (status badges: success, error, warning, info)
   - `components/ui/alert.tsx` (alert box with icons)
   - `components/ui/separator.tsx` (divider)

3. **Utility Components**
   - `components/ui/skeleton.tsx` (replacement for SkeletonLoader)
   - `components/ui/spinner.tsx` (loading indicator)
   - `components/ui/empty-state.tsx` (for empty lists/tables)

4. **Modal & Overlay**
   - `components/ui/dialog.tsx` (modal base from Radix)
   - `components/ui/sheet.tsx` (side panel/drawer)

**Token Estimate:**
- Button variants: 300 tokens
- Form primitives (input, select, textarea, checkbox, radio, switch, label): 1,200 tokens
- Container components (card, badge, alert, separator): 600 tokens
- Utility components (skeleton, spinner, empty-state): 400 tokens
- Dialog & Sheet: 500 tokens
- **Phase Total: 3,000 tokens (minimal) → 3,500 tokens (with full variants)**

---

### PHASE 3: Form Architecture (2,000–2,800 tokens)

**Duration:** 5–7 hours | **Files:** 6 new + 5 modified

**Deliverables:**

1. **Form Builder Components**
   - `components/forms/FormProvider.tsx` — React Hook Form wrapper with Zod validation
   - `components/forms/FormField.tsx` — wrapper for form field + label + error
   - `components/forms/FormFieldArray.tsx` — dynamic field array (add/remove)

2. **Typed Form Hooks**
   - `hooks/useForm.ts` — wrapper around React Hook Form with types
   - `hooks/useFormField.ts` — field-level controller

3. **Validation Schemas**
   - `schemas/auth.schema.ts` (login, register)
   - `schemas/lead.schema.ts` (lead create/update)
   - `schemas/customer.schema.ts` (customer CRUD)
   - `schemas/itinerary.schema.ts` (itinerary create/edit)
   - `schemas/voucher.schema.ts` (voucher creation)

4. **Refactored Form Pages**
   - Update `app/leads/AddLeadSidePanel.tsx` — use form builder
   - Update `app/leads/AddCustomerModal.tsx` — use form builder
   - Update `app/itinerary/new/page.tsx` — use form builder
   - Update `app/vouchers/new/page.tsx` — use form builder
   - Update `app/login/page.tsx` — use form builder

**Token Estimate:**
- FormProvider + FormField: 600 tokens
- Form hooks: 300 tokens
- Validation schemas (5 schemas × 150 tokens): 750 tokens
- Refactoring form pages (5 pages × 200 tokens): 1,000 tokens
- Error handling & UX: 150 tokens
- **Phase Total: 2,800 tokens (complete) → 2,000 tokens (minimal without full refactor)**

---

### PHASE 4: Tables & Data Display (2,500–3,500 tokens)

**Duration:** 6–8 hours | **Files:** 8 new + 3 modified

**Deliverables:**

1. **TanStack Table Integration**
   - `components/tables/DataTable.tsx` — base table component with:
     - Sorting (multi-column)
     - Filtering
     - Pagination
     - Row selection
     - Column visibility toggle
   - `components/tables/ColumnHeader.tsx` — sortable column headers
   - `components/tables/DataTablePagination.tsx` — pagination controls
   - `components/tables/DataTableToolbar.tsx` — filter + search + actions toolbar
   - `components/tables/RowActions.tsx` — contextual row actions menu

2. **Table Variants for Each Domain**
   - `components/tables/LeadsTable.tsx` — leads list with lead-specific actions
   - `components/tables/CustomersTable.tsx` — customers with edit/delete
   - `components/tables/InvoicesTable.tsx` — invoices with view PDF action
   - `components/tables/FollowupsTable.tsx` — follow-ups with status
   - `components/tables/InventoryTable.tsx` — hotels/activities inventory

3. **Refactor Existing Tables**
   - Update `app/leads/LeadTable.tsx` → use DataTable + TanStack
   - Update `app/invoice/page.tsx` → use DataTable
   - Update other list pages

**Token Estimate:**
- DataTable base component: 800 tokens
- Column header + pagination + toolbar: 600 tokens
- Row actions + selection: 400 tokens
- 5 domain-specific tables: 1,000 tokens
- Refactoring existing tables: 700 tokens
- **Phase Total: 3,500 tokens (complete) → 2,500 tokens (basic)**

---

### PHASE 5: Layout & Navigation (1,500–2,000 tokens)

**Duration:** 4–5 hours | **Files:** 6 modified + 2 new

**Deliverables:**

1. **Responsive Layout System**
   - Refactor `components/AppShell.tsx` — responsive sidebar (mobile collapse)
   - Refactor `components/Sidebar.tsx` — collapsible nav with icons + labels
   - Refactor `components/Topbar.tsx` — user menu, notifications, theme toggle
   - Create `components/MobileNav.tsx` — mobile-only nav drawer

2. **Layout Variants**
   - `app/layout.tsx` — main layout with sidebar
   - `app/(auth)/layout.tsx` — auth layout (no sidebar)
   - `app/(public)/layout.tsx` — optional public pages layout

3. **Responsive Breakpoints**
   - Mobile-first Tailwind approach
   - Collapsible sidebar on sm breakpoint
   - Stack layout on xs
   - Grid adjustments for tablet (md)

**Token Estimate:**
- AppShell refactor: 400 tokens
- Sidebar refactor: 350 tokens
- Topbar refactor: 300 tokens
- MobileNav component: 250 tokens
- Layout variants: 200 tokens
- Responsive testing & tweaks: 200 tokens
- **Phase Total: 1,700 tokens (complete) → 1,500 tokens (minimal)**

---

### PHASE 6: Custom Hooks & Utilities (1,200–1,600 tokens)

**Duration:** 3–4 hours | **Files:** 10 new utilities

**Deliverables:**

1. **Data Fetching Hooks**
   - `hooks/useApi.ts` — wrapper around fetch with error handling + loading
   - `hooks/usePagination.ts` — pagination state management
   - `hooks/useDebounce.ts` — debounced search input

2. **UI State Hooks**
   - `hooks/useDisclosure.ts` — modal/dialog open/close state
   - `hooks/useSidebar.ts` — sidebar collapsed state
   - `hooks/useTheme.ts` — theme toggling (light/dark)

3. **Form Utilities**
   - `hooks/useFormValidation.ts` — Zod validation wrapper
   - `hooks/useAsyncForm.ts` — async form submission with debounce

4. **Local Storage Utilities**
   - `lib/storage.ts` — type-safe localStorage wrapper

5. **Notification/Toast**
   - Refactor `components/Toast.tsx` → use hook-based state
   - `hooks/useToast.ts` — add auto-dismiss, queue management

**Token Estimate:**
- Data fetching hooks: 400 tokens
- UI state hooks: 350 tokens
- Form utilities: 300 tokens
- Storage utilities: 150 tokens
- Toast refactor: 250 tokens
- Documentation: 150 tokens
- **Phase Total: 1,600 tokens (complete) → 1,200 tokens (minimal)**

---

### PHASE 7: Feature Pages Refactoring (4,500–6,000 tokens)

**Duration:** 12–16 hours | **Files:** 25 modified

**Deliverables:**

Systematically refactor each major feature page using the new component library:

1. **Dashboard** (`app/dashboard/page.tsx`)
   - Replace inline stats with Card + Badge components
   - Add charts (simple bar/pie using recharts)
   - Use DataTable for recent activity

2. **Leads Module** (5 files: 800 tokens)
   - `app/leads/page.tsx` — DataTable + toolbar
   - `app/leads/AddLeadSidePanel.tsx` — FormProvider + FormFields
   - `app/leads/AddCustomerModal.tsx` — Form builder
   - `app/leads/LeadDetailView.tsx` — Card-based detail panel
   - `app/leads/FollowupList.tsx` — Mini DataTable

3. **Itinerary Module** (5 files: 900 tokens)
   - `app/itinerary/page.tsx` — DataTable + search
   - `app/itinerary/[id]/page.tsx` — refactor form + Day cards
   - `app/itinerary/new/page.tsx` — FormProvider + builder
   - Update day card components to use Card + Badge
   - Update flight/stay option components

4. **Vouchers Module** (3 files: 700 tokens)
   - `app/vouchers/page.tsx` — DataTable
   - `app/vouchers/[id]/page.tsx` — form refactor
   - `app/vouchers/new/page.tsx` — FormProvider

5. **Inventory** (`app/inventory/page.tsx` — 300 tokens)
   - DataTable with inline edit (hotels + activities)
   - Refactor add/edit modals

6. **Invoices** (`app/invoice/page.tsx` — 250 tokens)
   - DataTable with PDF export button
   - Status badge colors

7. **Messaging** (3 files: 500 tokens)
   - `app/whatsapp/page.tsx` — message list + send form
   - `app/instagram/page.tsx` — message list
   - `app/whatsapp-studio/page.tsx` — template editor

8. **Settings** (`app/settings/page.tsx` — 400 tokens)
   - Tab-based layout using Dialog tabs
   - Form sections with Card wrappers
   - Config forms refactored

9. **Usage & Analytics** (`app/usage/page.tsx` — 250 tokens)
   - DataDisplay with cards
   - Charts integration

**Token Estimate:**
- Dashboard refactor: 300 tokens
- Leads module (5 pages): 800 tokens
- Itinerary module (5 pages): 1,200 tokens
- Vouchers module (3 pages): 700 tokens
- Inventory: 300 tokens
- Invoices: 250 tokens
- Messaging (3 pages): 500 tokens
- Settings: 400 tokens
- Usage: 250 tokens
- Integration testing & fixes: 300 tokens
- **Phase Total: 5,000 tokens (complete) → 4,500 tokens (minimal)**

---

### PHASE 8: Documentation & Polish (800–1,200 tokens)

**Duration:** 2–3 hours | **Files:** 3 new

**Deliverables:**

1. **Component Documentation**
   - `COMPONENTS.md` — all 25+ components with usage examples
   - Component prop interfaces documented
   - Variant showcase (buttons, badges, alerts)

2. **Architecture Guide**
   - `ARCHITECTURE.md` — design system overview
   - File structure explanation
   - Data flow diagrams

3. **Developer Handbook**
   - `DEVELOPER_GUIDE.md` — setup, conventions, best practices
   - Form creation walkthrough
   - Table implementation guide
   - Adding new pages checklist

4. **Theme Customization**
   - `THEMING.md` — how to modify colors, spacing, typography
   - Dark mode implementation details
   - Adding custom CSS variables

5. **Polish & Quality**
   - Accessibility audit (WCAG 2.1 AA compliance)
   - Performance optimization (bundle size analysis)
   - Browser compatibility testing
   - Mobile responsiveness verification

**Token Estimate:**
- Component documentation: 300 tokens
- Architecture guide: 200 tokens
- Developer handbook: 200 tokens
- Theming guide: 150 tokens
- Accessibility review: 150 tokens
- Polish & testing: 100 tokens
- **Phase Total: 1,100 tokens (complete) → 800 tokens (minimal)**

---

## Summary: Phase Token Costs

| Phase | Minimal | Standard | Complete | Duration |
|-------|---------|----------|----------|----------|
| 1. Foundation | 1,500 | 1,750 | 2,000 | 3–4 hrs |
| 2. Components | 2,500 | 3,000 | 3,500 | 6–8 hrs |
| 3. Forms | 2,000 | 2,400 | 2,800 | 5–7 hrs |
| 4. Tables | 2,500 | 3,000 | 3,500 | 6–8 hrs |
| 5. Layout | 1,500 | 1,750 | 2,000 | 4–5 hrs |
| 6. Hooks | 1,200 | 1,400 | 1,600 | 3–4 hrs |
| 7. Pages | 4,500 | 5,250 | 6,000 | 12–16 hrs |
| 8. Docs | 800 | 950 | 1,200 | 2–3 hrs |
| **TOTAL** | **16,500** | **19,500** | **22,600** | **41–55 hrs** |

---

## Implementation Strategy

### Execution Phases (Recommended)

**Week 1: Foundation + Components (Parallel)**
- Phase 1 (Foundation): 3–4 hours
- Phase 2 (Components): 6–8 hours
  - Can run in parallel; components depend on Phase 1 design tokens

**Week 2: Forms + Tables (Sequential)**
- Phase 3 (Forms): 5–7 hours
- Phase 4 (Tables): 6–8 hours

**Week 3: Layout + Hooks (Parallel)**
- Phase 5 (Layout): 4–5 hours
- Phase 6 (Hooks): 3–4 hours

**Week 4: Feature Pages (Sequential, chunked)**
- Phase 7 Part A (Dashboard, Leads): 6–8 hours
- Phase 7 Part B (Itinerary, Vouchers): 6–8 hours
- Phase 7 Part C (Other pages): 4–6 hours

**Week 5: Polish + Docs**
- Phase 8 (Documentation): 2–3 hours
- Testing + QA: 2–4 hours

**Total: 41–55 hours of development = 5–7 business days (full-time)**

---

## Token Cost Scenarios

### Scenario 1: Minimal Scope (MVP)
**Cost:** 16,500 tokens | **Duration:** 30–35 hours
- Foundation + Components + Basic Forms
- Essential pages only (leads, dashboard, itinerary)
- Minimal documentation

### Scenario 2: Standard Scope (Recommended)
**Cost:** 19,500 tokens | **Duration:** 40–48 hours
- All core phases complete
- All major pages refactored
- Comprehensive documentation

### Scenario 3: Complete Scope (Enterprise)
**Cost:** 22,600 tokens | **Duration:** 50–60 hours
- All phases with full polish
- Accessibility audit & fixes
- Performance optimization
- Extended documentation

---

## Dependencies & Prerequisites

**Required Installations:**
```bash
npm install -D @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-collapsible @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast
npm install react-hook-form zod @hookform/resolvers
npm install @tanstack/react-table
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
```

**Estimated final package.json:**
- 25+ new dependencies (Radix UI, form, table libraries)
- 15+ new dev dependencies (Tailwind, types, testing)

---

## Quality Criteria

✅ **Completion Definition:**
- [ ] All 25+ components implemented with full variant support
- [ ] Form validation works across all feature pages
- [ ] Tables sortable, filterable, paginated
- [ ] Dark/light theme toggle functional
- [ ] Mobile responsive (tested on 320px–2560px)
- [ ] TypeScript strict mode enabled, no `any` types
- [ ] Zero console errors or warnings
- [ ] 90+ Lighthouse performance score
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] All feature pages functional and styled

---

## Risk Mitigation

**Risk 1: Large Refactor Scope**
- *Mitigation:* Implement in phases; backend remains stable; deploy behind feature flags

**Risk 2: Breaking Changes**
- *Mitigation:* Maintain parallel old components during transition; test each page after refactor

**Risk 3: Performance Regression**
- *Mitigation:* Monitor bundle size growth; lazy-load components; audit after Phase 2

**Risk 4: Browser Compatibility**
- *Mitigation:* Test on Chrome, Firefox, Safari, Edge; use PostCSS for fallbacks

---

## Success Metrics

- **Code Quality:** 0 `any` types, 100% TypeScript strict
- **Performance:** Bundle size ≤ 300KB (gzipped)
- **Accessibility:** WCAG 2.1 AA score ≥ 95%
- **Developer Experience:** New feature pages created in <1 hour
- **Maintainability:** Single source of truth for design tokens
- **Consistency:** All pages follow same visual + interaction patterns

