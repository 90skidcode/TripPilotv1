# Frontend Refactoring: Quick Reference Summary

## Token Cost Overview

```
┌─────────────────────────────────────────┐
│ TOTAL TOKEN COSTS BY SCOPE              │
├─────────────────────────────────────────┤
│ Minimal (MVP):       16,500 tokens      │
│ Standard (Recom.):   19,500 tokens      │
│ Complete (Full):     22,600 tokens      │
└─────────────────────────────────────────┘
```

## Time Estimates

| Scope | Duration | Daily Burn | 5-Day Sprint |
|-------|----------|-----------|--------------|
| **Minimal** | 30–35 hrs | ~7 hrs/day | Achievable |
| **Standard** | 40–48 hrs | ~8 hrs/day | Tight fit |
| **Complete** | 50–60 hrs | ~10+ hrs/day | 2 sprints |

---

## What You Get in Each Scope

### ✅ Minimal (16,500 tokens) — MVP Focus
- Shadcn/ui foundation + design tokens
- 20 core UI components
- React Hook Form + Zod validation
- Basic DataTable (no advanced features)
- Responsive layout
- 4 major pages refactored (Dashboard, Leads, Itinerary, Vouchers)
- **Missing:** Advanced table features, comprehensive docs, full accessibility

### ✅✅ Standard (19,500 tokens) — **RECOMMENDED**
- **Everything in Minimal +**
- Complete component library (25+ components)
- Advanced DataTable (sorting, filtering, pagination, selection)
- All custom hooks (useApi, useDisclosure, useTheme, etc.)
- All major feature pages refactored (25+ page files)
- Comprehensive documentation
- Accessibility review

### ✅✅✅ Complete (22,600 tokens) — Enterprise Grade
- **Everything in Standard +**
- Full WCAG 2.1 AA accessibility compliance with fixes
- Performance optimization & bundle analysis
- Dark mode fully polished
- Extended documentation with examples
- Theme customization guide
- Developer handbook

---

## Phase Breakdown & Dependencies

### Critical Path (Blocking Dependencies)
```
Phase 1 (Foundation) → Phase 2 (Components) → Phase 3,4,5,6 (Parallel) → Phase 7 (Pages) → Phase 8 (Docs)
```

**Can Run in Parallel:**
- Phase 1 + 2: After Phase 1 complete, start Phase 2 immediately
- Phase 3 + 4 + 5 + 6: All independent, can run simultaneously after Phase 2
- Dashboard refactor (Phase 7a) can start after Phase 4 (tables)

---

## What Gets Built

### Components Library (25+ Components)
| Category | Count | Examples |
|----------|-------|----------|
| Primitives | 8 | Button, Input, Select, Checkbox, Radio, Switch, Label, Textarea |
| Containers | 5 | Card, Badge, Alert, Separator, Empty State |
| Forms | 3 | FormProvider, FormField, FormFieldArray |
| Tables | 6 | DataTable, ColumnHeader, Pagination, Toolbar, RowActions |
| Overlays | 2 | Dialog, Sheet |
| Layouts | 3 | AppShell, Sidebar, Topbar, MobileNav |
| **Total** | **25+** | |

### Pages to Refactor (25+ Files)
- **Dashboard:** 1 page
- **Leads:** 5 files (list, form, customer modal, detail, followups)
- **Itinerary:** 5 files (list, create, edit, day card, flight/stay)
- **Vouchers:** 3 files (list, create, edit)
- **Inventory:** 1 page
- **Invoices:** 1 page
- **Messaging:** 3 files (WhatsApp, Instagram, WhatsApp Studio)
- **Settings:** 1 page
- **Usage/Analytics:** 1 page
- **Auth:** 1 page (login refactor)

---

## Implementation Plan

### Week 1: Foundation (Days 1–2)
```
Day 1: Phase 1 (Foundation & Setup) — 3–4 hrs
  ✓ shadcn/ui installation
  ✓ Design tokens (colors, spacing, typography)
  ✓ Tailwind + CSS variables
  ✓ TypeScript strict mode + TSConfig

Day 2: Phase 2 (Component Library) — 6–8 hrs
  ✓ Primitive components (button, input, form fields)
  ✓ Container components (card, badge, alert)
  ✓ Modal & overlay base
```

### Week 2: Logic & Data (Days 3–4)
```
Day 3: Phase 3 (Forms) + Phase 4 (Tables) — 8–10 hrs
  ✓ React Hook Form integration
  ✓ Zod validation schemas
  ✓ TanStack Table setup with sorting/filtering

Day 4: Phase 5 (Layout) + Phase 6 (Hooks) — 7–8 hrs
  ✓ Responsive sidebar & topbar
  ✓ Data fetching hooks
  ✓ State management hooks (useDisclosure, useTheme, etc.)
```

### Week 3: Pages (Days 5–7)
```
Day 5: Phase 7a — Dashboard & Leads refactor — 6–8 hrs
Day 6: Phase 7b — Itinerary & Vouchers refactor — 6–8 hrs
Day 7: Phase 7c — Other pages & polish — 4–6 hrs
```

### Week 4: Documentation (Day 8)
```
Day 8: Phase 8 — Docs, accessibility audit, QA — 2–3 hrs
```

---

## Recommended Scope Choice

**👉 Choose Standard (19,500 tokens) because:**

1. **Minimal** is incomplete — missing table features, docs, accessibility
2. **Standard** includes everything needed for production
3. **Complete** is nice-to-have polish (10% features, 20% tokens)
4. Standard delivers: full refactor + documentation in ~40–48 hours
5. Can upgrade to Complete later if time allows

---

## What Happens to Existing Code

**Parallel Availability During Refactor:**
- Old components remain in codebase during transition
- New pages use new components; old pages gradually migrate
- Backend (Django/FastAPI) completely unchanged
- Database schema unchanged
- API layer unchanged

**Safe to Deploy:**
- Each page refactored independently = low blast radius
- Can test in staging environment before merge
- No database migrations needed

---

## Critical Success Factors

1. **Stick to Design System** — No new custom CSS after Phase 1
2. **Centralize Variants** — All component props in one place
3. **Type Everything** — Enable TypeScript strict mode immediately
4. **Test Responsive** — Verify on mobile during Phase 5
5. **Document as You Go** — Add to COMPONENTS.md during Phase 2/3

---

## Fallback Plans

**If Running Short on Time:**

| Situation | Action |
|-----------|--------|
| 50% through Phase 7? | Stop at 3 major pages, mark others as "next sprint" |
| Can't complete Phase 8? | Auto-generate component docs from JSDoc |
| Accessibility issues? | Defer to Phase 8.5 (separate accessibility sprint) |

---

## Questions to Decide Now

1. **Go with Standard or Complete scope?** (19.5k vs 22.6k tokens)
2. **Start immediately or schedule?** (Affects availability)
3. **Any pages to prioritize?** (Leads/Dashboard often most critical)
4. **Dark mode required for launch?** (Affects testing scope)

---

## Next Steps

1. **Review this plan** — Confirm scope choice
2. **Check team availability** — 40–50 hours over 4 weeks
3. **Staging environment ready?** — For safe deployment
4. **Approve Phase 1 start** — Once decision made, can begin immediately

---

**Detailed breakdown available in:** `FRONTEND_REFACTORING_PLAN.md`
