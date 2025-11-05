# ImobiTools Component Registry
**Version:** 1.0.0
**Last Updated:** 2025-01-05
**Purpose:** Master registry to prevent duplicate components

---

## 📦 Component Status Legend

- ✅ **CREATED** - Component exists and is ready to use
- 🚧 **IN PROGRESS** - Currently being built
- 📋 **PLANNED** - Scheduled for creation
- ❌ **DEPRECATED** - Do not use, will be removed
- 🔄 **NEEDS REFACTOR** - Exists but needs improvement

---

## 🧱 Core UI Components

### Buttons
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| Button | ✅ CREATED | src/components/Button/ | Primary button component with 8 variants, 5 sizes | tokens.css |
| IconButton | ✅ CREATED | src/components/Button/ | Icon-only button (included in Button.js) | Button |
| ButtonGroup | ✅ CREATED | src/components/Button/ | Group of related buttons (included in Button.js) | Button |

**Variants to Implement:**
- Primary (default)
- Secondary
- Danger/Destructive
- Ghost/Text
- Outlined
- Disabled state
- Loading state

**Props Interface:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outlined';
  size: 'sm' | 'base' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  onClick?: (e: Event) => void;
  ariaLabel?: string;
}
```

---

### Cards
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| Card | 📋 PLANNED | src/components/Card/ | Base card container | tokens.css |
| StatCard | 📋 PLANNED | src/components/Card/ | Statistics card with icon | Card, Icon |
| TeamMemberCard | 📋 PLANNED | src/components/Card/ | Team member profile card | Card, Avatar |

**Card Variants:**
- Default
- Elevated (with shadow)
- Bordered
- Flat
- Interactive (hover effects)

---

### Forms
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| Input | 📋 PLANNED | src/components/Input/ | Text input with validation | tokens.css |
| Textarea | 📋 PLANNED | src/components/Input/ | Multi-line text input | Input |
| Select | 📋 PLANNED | src/components/Select/ | Dropdown select | tokens.css |
| Checkbox | 📋 PLANNED | src/components/Checkbox/ | Custom checkbox | tokens.css |
| Radio | 📋 PLANNED | src/components/Radio/ | Custom radio button | tokens.css |
| Switch | 📋 PLANNED | src/components/Switch/ | Toggle switch | tokens.css |
| FormGroup | 📋 PLANNED | src/components/Form/ | Form field wrapper | - |
| FormLabel | 📋 PLANNED | src/components/Form/ | Accessible label | - |
| FormError | 📋 PLANNED | src/components/Form/ | Error message display | - |

**Input States:**
- Default
- Focused
- Disabled
- Error
- Success
- Loading

---

### Feedback Components
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| Toast | 📋 PLANNED | src/components/Toast/ | Notification toast | Icon |
| Modal | 📋 PLANNED | src/components/Modal/ | Dialog modal | FocusTrap |
| Alert | 📋 PLANNED | src/components/Alert/ | Alert banner | Icon |
| ConfirmDialog | 📋 PLANNED | src/components/Modal/ | Confirmation modal | Modal, Button |
| Tooltip | 📋 PLANNED | src/components/Tooltip/ | Hover tooltip | Popper |
| Popover | 📋 PLANNED | src/components/Popover/ | Click popover | Popper |

**Toast Variants:**
- Success
- Error
- Warning
- Info
- Loading

---

### Loading States
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| Spinner | 📋 PLANNED | src/components/Loading/ | Loading spinner | tokens.css |
| ProgressBar | 📋 PLANNED | src/components/Loading/ | Linear progress | tokens.css |
| ProgressCircle | 📋 PLANNED | src/components/Loading/ | Circular progress | tokens.css |
| Skeleton | 📋 PLANNED | src/components/Loading/ | Skeleton loader | tokens.css |
| SkeletonText | 📋 PLANNED | src/components/Loading/ | Text skeleton | Skeleton |
| SkeletonCard | 📋 PLANNED | src/components/Loading/ | Card skeleton | Skeleton |

---

### Data Display
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| Table | 📋 PLANNED | src/components/Table/ | Data table | tokens.css |
| TableRow | 📋 PLANNED | src/components/Table/ | Table row | Table |
| TableHeader | 📋 PLANNED | src/components/Table/ | Table header | Table |
| TableCell | 📋 PLANNED | src/components/Table/ | Table cell | Table |
| Badge | 📋 PLANNED | src/components/Badge/ | Status badge | tokens.css |
| Tag | 📋 PLANNED | src/components/Tag/ | Label tag | tokens.css |
| Avatar | 📋 PLANNED | src/components/Avatar/ | User avatar | tokens.css |
| AvatarGroup | 📋 PLANNED | src/components/Avatar/ | Multiple avatars | Avatar |

**Table Features:**
- Sortable columns
- Filterable data
- Pagination
- Selection (checkboxes)
- Expandable rows
- Sticky header
- Responsive (horizontal scroll)

---

### Navigation
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| Sidebar | 🔄 NEEDS REFACTOR | public/dashboard.html | Collapsible sidebar | - |
| NavItem | 🔄 NEEDS REFACTOR | public/dashboard.html | Navigation item | - |
| Breadcrumb | 🔄 NEEDS REFACTOR | public/dashboard.html | Breadcrumb trail | - |
| Tabs | 📋 PLANNED | src/components/Tabs/ | Tab navigation | - |
| Pagination | 📋 PLANNED | src/components/Pagination/ | Page navigation | Button |

---

### Layout Components
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| Container | 📋 PLANNED | src/components/Layout/ | Max-width container | tokens.css |
| Grid | 📋 PLANNED | src/components/Layout/ | CSS Grid wrapper | tokens.css |
| Flex | 📋 PLANNED | src/components/Layout/ | Flexbox wrapper | tokens.css |
| Stack | 📋 PLANNED | src/components/Layout/ | Vertical stack | tokens.css |
| Divider | 📋 PLANNED | src/components/Layout/ | Visual separator | tokens.css |
| Spacer | 📋 PLANNED | src/components/Layout/ | Spacing utility | tokens.css |

---

### Utility Components
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| Icon | 📋 PLANNED | src/components/Icon/ | SVG icon wrapper | - |
| Image | 📋 PLANNED | src/components/Image/ | Optimized image | - |
| Link | 📋 PLANNED | src/components/Link/ | Styled link | - |
| EmptyState | 📋 PLANNED | src/components/EmptyState/ | Empty data state | Icon, Button |
| ErrorBoundary | 📋 PLANNED | src/components/ErrorBoundary/ | Error catcher | - |

---

## 📊 Feature-Specific Components

### Dashboard Components
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| SalesChart | 🔄 NEEDS REFACTOR | src/scripts/dashboard.js | Sales line chart | Chart.js/Canvas |
| StatCard | 🔄 NEEDS REFACTOR | public/dashboard.html | KPI statistics card | Card, Icon |
| TeamMemberList | 🔄 NEEDS REFACTOR | public/dashboard.html | Team members list | Avatar, Badge |
| TodoList | 🔄 NEEDS REFACTOR | public/dashboard.html | Todo checklist | Checkbox |
| ProgressTrack | 🔄 NEEDS REFACTOR | public/dashboard.html | Project progress | ProgressBar |

---

### Calculator Components
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| PaymentCalculator | 🔄 NEEDS REFACTOR | features-html/ | Payment flow calculator | Input, Button |
| InstallmentTable | 📋 PLANNED | - | Installment breakdown | Table |
| ShareCalculator | 📋 PLANNED | - | Share calculator link | Modal, Button |

---

### Market Study Components
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| PropertyForm | 🔄 NEEDS REFACTOR | ESTUDO DE MERCADO.html | Property input form | Input, FormGroup |
| SampleTable | 🔄 NEEDS REFACTOR | ESTUDO DE MERCADO.html | Market samples table | Table |
| ValuationResult | 🔄 NEEDS REFACTOR | ESTUDO DE MERCADO.html | Valuation display | Card |
| PDFExport | 📋 PLANNED | - | Export to PDF | Button |

---

### Projects Table Components
| Component | Status | Location | Description | Dependencies |
|-----------|--------|----------|-------------|--------------|
| ProjectsTable | 🔄 NEEDS REFACTOR | TABELA DE EMPREENDIMENTOS.html | Projects data table | Table |
| UnitRow | 🔄 NEEDS REFACTOR | TABELA DE EMPREENDIMENTOS.html | Unit details row | TableRow |
| FilterControls | 📋 PLANNED | - | Table filters | Select, Input |

---

## 🎨 Existing Components (Legacy - DO NOT DUPLICATE)

### ⚠️ These exist but need refactoring:

**From dashboard.html:**
- `.stat-card` → Refactor to use new Card component
- `.nav-item` → Refactor to use new NavItem component
- `.todo-item` → Refactor to use new Checkbox component
- `.team-member` → Refactor to use new Avatar + Card
- `.progress-item` → Refactor to use new ProgressBar
- `.data-table` → Refactor to use new Table component

**From dashboard.css:**
- Multiple button styles (`.btn`, `.btn-add`, `.btn-remove`, etc.) → Consolidate to Button component
- Various card styles → Use single Card component with variants
- Inconsistent form styles → Use Form components

**From dashboard.js:**
- Chart rendering code → Extract to Chart component
- Sidebar toggle logic → Extract to Sidebar component
- Todo checkbox logic → Extract to Checkbox component

---

## 🗂️ File Structure

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.css
│   │   ├── Button.js
│   │   ├── IconButton.js
│   │   ├── ButtonGroup.js
│   │   └── README.md
│   │
│   ├── Card/
│   │   ├── Card.css
│   │   ├── Card.js
│   │   ├── StatCard.js
│   │   └── README.md
│   │
│   ├── Input/
│   │   ├── Input.css
│   │   ├── Input.js
│   │   ├── Textarea.js
│   │   └── README.md
│   │
│   ├── Toast/
│   │   ├── Toast.css
│   │   ├── Toast.js
│   │   ├── ToastManager.js
│   │   └── README.md
│   │
│   └── [Other components following same pattern]
│
├── styles/
│   ├── tokens.css          (Design system variables)
│   ├── reset.css           (CSS reset)
│   ├── utilities.css       (Utility classes)
│   └── components.css      (Component imports)
│
├── types/
│   └── index.ts            (TypeScript interfaces)
│
└── utils/
    ├── validators.js       (Form validation)
    ├── formatters.js       (Data formatting)
    └── helpers.js          (Helper functions)
```

---

## 📝 Component Creation Checklist

Before creating a new component:

- [ ] Check this registry - does it already exist?
- [ ] Check DESIGN_SYSTEM.md for design tokens
- [ ] Check existing HTML files for similar implementations
- [ ] Define TypeScript interface in src/types/index.ts
- [ ] Create component folder with CSS + JS + README
- [ ] Use design tokens exclusively (no hardcoded values)
- [ ] Add accessibility attributes (ARIA labels, roles)
- [ ] Test keyboard navigation
- [ ] Test responsive behavior
- [ ] Document props and usage in README
- [ ] Update this registry with status and location
- [ ] Mark old implementations as 🔄 NEEDS REFACTOR

---

## 🔄 Refactoring Priority

### Phase 1 (Critical)
1. Button component (consolidate 8 button styles)
2. Card component (standardize card layouts)
3. Input component (consistent form fields)
4. Toast component (add user feedback)

### Phase 2 (High Priority)
5. Modal component (replace alerts)
6. Table component (reusable data tables)
7. Loading components (skeletons, spinners)
8. Avatar component (team members, profiles)

### Phase 3 (Medium Priority)
9. Tooltip component (contextual help)
10. Badge component (status indicators)
11. Empty state component (no data views)
12. Chart components (refactor dashboard charts)

---

## 📊 Component Usage Tracking

| Component | Used In | Count | Notes |
|-----------|---------|-------|-------|
| Button | dashboard.html, landing page | 30+ | Multiple inconsistent styles |
| Card | dashboard.html | 15+ | Different shadow/border styles |
| Input | All forms | 50+ | No consistent validation |
| Table | dashboard.html, projects | 5 | Missing features (sort, filter) |

---

## 🔗 Related Documentation

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Design tokens and styles
- [src/types/index.ts](./src/types/index.ts) - TypeScript interfaces
- [00-ARCHITECTURE.md](./implementation/00-ARCHITECTURE.md) - System architecture

---

## ⚠️ CRITICAL RULE

**BEFORE creating any new component:**
1. Search this file for similar component
2. Check if it's marked as 🔄 NEEDS REFACTOR
3. If exists, refactor existing instead of creating new
4. Update status in this registry
5. Mark old implementation as ❌ DEPRECATED

**This prevents:**
- Duplicate code
- Inconsistent styling
- Maintenance nightmares
- Increased bundle size

---

## 🔄 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-05 | UX/UI Expert | Initial component registry |

---

**STATUS:** This registry is the single source of truth for all UI components.
Update it immediately when creating, refactoring, or deprecating components.
