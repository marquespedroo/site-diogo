# ImobiTools Design System
**Version:** 1.0.0
**Last Updated:** 2025-01-05
**Status:** MASTER REFERENCE - DO NOT DUPLICATE

---

## 🎨 Color Palette

### Primary Colors
```css
--color-primary-50: #f5f7ff;
--color-primary-100: #ebf0ff;
--color-primary-200: #d6e0ff;
--color-primary-300: #a8bfff;
--color-primary-400: #7a9eff;
--color-primary-500: #667eea;  /* PRIMARY */
--color-primary-600: #5568d3;
--color-primary-700: #4451b8;
--color-primary-800: #333b9d;
--color-primary-900: #222682;
```

### Secondary Colors
```css
--color-secondary-50: #faf5ff;
--color-secondary-100: #f3e8ff;
--color-secondary-200: #e9d5ff;
--color-secondary-300: #d8b4fe;
--color-secondary-400: #c084fc;
--color-secondary-500: #764ba2;  /* SECONDARY */
--color-secondary-600: #6b3d92;
--color-secondary-700: #5f2f82;
--color-secondary-800: #542172;
--color-secondary-900: #491362;
```

### Semantic Colors
```css
/* Success */
--color-success-50: #ecfdf5;
--color-success-100: #d1fae5;
--color-success-500: #2dce89;  /* SUCCESS */
--color-success-600: #16a34a;
--color-success-700: #15803d;

/* Warning */
--color-warning-50: #fff7ed;
--color-warning-100: #ffedd5;
--color-warning-500: #fb6340;  /* WARNING */
--color-warning-600: #ea580c;
--color-warning-700: #c2410c;

/* Danger/Error */
--color-danger-50: #fef2f2;
--color-danger-100: #fee2e2;
--color-danger-500: #f5365c;  /* DANGER */
--color-danger-600: #dc2626;
--color-danger-700: #b91c1c;

/* Info */
--color-info-50: #ecfeff;
--color-info-100: #cffafe;
--color-info-500: #11cdef;  /* INFO */
--color-info-600: #0891b2;
--color-info-700: #0e7490;
```

### Neutral Colors (Grays)
```css
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
```

### Dark Theme Colors
```css
--color-dark-50: #2d3748;
--color-dark-100: #252c3a;
--color-dark-200: #1e242e;
--color-dark-300: #172b4d;  /* DARK PRIMARY */
--color-dark-400: #0f1c35;
--color-dark-500: #0a1426;
```

### Functional Colors
```css
--color-background: #ffffff;
--color-surface: #f8f9fa;
--color-border: #e9ecef;
--color-text-primary: #172b4d;
--color-text-secondary: #8392ab;
--color-text-tertiary: #adb5bd;
--color-text-inverse: #ffffff;
```

---

## 🎭 Gradients

### Primary Gradients (USE THESE ONLY)
```css
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-success: linear-gradient(135deg, #2dce89 0%, #2dcecc 100%);
--gradient-info: linear-gradient(135deg, #11cdef 0%, #1171ef 100%);
--gradient-warning: linear-gradient(135deg, #fb6340 0%, #fbb140 100%);
```

### Special Gradients (LIMITED USE)
```css
--gradient-purple-pink: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
--gradient-ocean: linear-gradient(135deg, #2e3192 0%, #1bffff 100%);
--gradient-sunset: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
```

### Overlay Gradients
```css
--gradient-overlay-light: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 100%);
--gradient-overlay-dark: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%);
```

---

## 📝 Typography

### Font Families
```css
--font-sans: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-heading: 'Roboto', 'Open Sans', sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;
```

### Font Sizes (Type Scale)
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px - BASE SIZE */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Letter Spacing
```css
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;
```

---

## 📏 Spacing System

### Base Spacing (4px unit)
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px - BASE */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-7: 1.75rem;   /* 28px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
```

### Semantic Spacing
```css
--spacing-xs: var(--space-2);    /* 8px */
--spacing-sm: var(--space-4);    /* 16px */
--spacing-md: var(--space-6);    /* 24px */
--spacing-lg: var(--space-8);    /* 32px */
--spacing-xl: var(--space-12);   /* 48px */
--spacing-2xl: var(--space-16);  /* 64px */
```

---

## 🔲 Border Radius

```css
--radius-none: 0;
--radius-sm: 0.25rem;    /* 4px */
--radius-base: 0.375rem; /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.25rem;   /* 20px */
--radius-3xl: 1.5rem;    /* 24px */
--radius-full: 9999px;   /* Fully rounded */
```

---

## 🌑 Shadows

### Standard Shadows
```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 2px 6px 0 rgba(0, 0, 0, 0.08);
--shadow-base: 0 4px 8px 0 rgba(0, 0, 0, 0.10);
--shadow-md: 0 5px 14px 0 rgba(0, 0, 0, 0.12);
--shadow-lg: 0 10px 30px 0 rgba(0, 0, 0, 0.15);
--shadow-xl: 0 20px 40px 0 rgba(0, 0, 0, 0.20);
--shadow-2xl: 0 25px 50px 0 rgba(0, 0, 0, 0.25);
```

### Colored Shadows
```css
--shadow-primary: 0 4px 14px 0 rgba(102, 126, 234, 0.3);
--shadow-success: 0 4px 14px 0 rgba(45, 206, 137, 0.3);
--shadow-danger: 0 4px 14px 0 rgba(245, 54, 92, 0.3);
--shadow-warning: 0 4px 14px 0 rgba(251, 99, 64, 0.3);
```

### Inner Shadows
```css
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
--shadow-inner-lg: inset 0 4px 8px 0 rgba(0, 0, 0, 0.12);
```

---

## ⚡ Transitions & Animations

### Timing Functions
```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration
```css
--duration-fast: 150ms;
--duration-base: 300ms;
--duration-slow: 500ms;
--duration-slower: 700ms;
```

### Standard Transitions (USE THESE)
```css
--transition-fast: all var(--duration-fast) var(--ease-out);
--transition-base: all var(--duration-base) var(--ease-out);
--transition-slow: all var(--duration-slow) var(--ease-out);
--transition-colors: color var(--duration-base) var(--ease-out),
                     background-color var(--duration-base) var(--ease-out),
                     border-color var(--duration-base) var(--ease-out);
```

---

## 📐 Layout Constants

### Container Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### Sidebar Width
```css
--sidebar-width: 260px;
--sidebar-collapsed-width: 64px;
```

### Header Height
```css
--header-height: 80px;
--header-height-mobile: 60px;
```

### Z-Index Scale
```css
--z-base: 1;
--z-dropdown: 100;
--z-sticky: 200;
--z-fixed: 300;
--z-modal-backdrop: 400;
--z-modal: 500;
--z-popover: 600;
--z-tooltip: 700;
--z-toast: 800;
--z-overlay: 900;
```

---

## 📱 Breakpoints

```css
/* Mobile First Approach */
--breakpoint-xs: 0px;       /* Extra small devices (phones) */
--breakpoint-sm: 480px;     /* Small devices (large phones) */
--breakpoint-md: 768px;     /* Medium devices (tablets) */
--breakpoint-lg: 1024px;    /* Large devices (laptops) */
--breakpoint-xl: 1280px;    /* Extra large devices (desktops) */
--breakpoint-2xl: 1536px;   /* 2X large devices (large desktops) */
```

### Media Query Usage
```css
/* Mobile (default) */
@media (min-width: 480px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

---

## 🎯 Opacity Scale

```css
--opacity-0: 0;
--opacity-5: 0.05;
--opacity-10: 0.1;
--opacity-20: 0.2;
--opacity-30: 0.3;
--opacity-40: 0.4;
--opacity-50: 0.5;
--opacity-60: 0.6;
--opacity-70: 0.7;
--opacity-80: 0.8;
--opacity-90: 0.9;
--opacity-100: 1;
```

---

## 🔤 Content Constants

### Icon Sizes
```css
--icon-xs: 12px;
--icon-sm: 16px;
--icon-base: 20px;
--icon-md: 24px;
--icon-lg: 32px;
--icon-xl: 48px;
--icon-2xl: 64px;
```

### Avatar Sizes
```css
--avatar-xs: 24px;
--avatar-sm: 32px;
--avatar-base: 40px;
--avatar-md: 48px;
--avatar-lg: 64px;
--avatar-xl: 80px;
--avatar-2xl: 128px;
```

### Button Heights
```css
--button-height-sm: 32px;
--button-height-base: 40px;
--button-height-md: 44px;
--button-height-lg: 48px;
--button-height-xl: 56px;
```

### Input Heights
```css
--input-height-sm: 32px;
--input-height-base: 40px;
--input-height-md: 44px;
--input-height-lg: 48px;
```

---

## ♿ Accessibility Standards

### Minimum Touch Targets (iOS/Android)
```css
--touch-target-min: 44px;  /* Minimum 44x44px */
```

### Color Contrast Ratios (WCAG AA)
```
Text (normal):     4.5:1 minimum
Text (large):      3:1 minimum
Interactive:       4.5:1 minimum
Graphics:          3:1 minimum
```

### Focus Indicators
```css
--focus-ring: 0 0 0 3px rgba(102, 126, 234, 0.3);
--focus-ring-offset: 2px;
```

---

## 🎨 Component-Specific Tokens

### Cards
```css
--card-padding: var(--space-6);
--card-padding-sm: var(--space-4);
--card-border-radius: var(--radius-xl);
--card-shadow: var(--shadow-md);
--card-background: var(--color-background);
```

### Tables
```css
--table-cell-padding: var(--space-3) var(--space-4);
--table-header-background: var(--color-gray-50);
--table-border-color: var(--color-border);
--table-row-hover-background: var(--color-gray-50);
```

### Forms
```css
--form-element-border: 1px solid var(--color-border);
--form-element-border-focus: 2px solid var(--color-primary-500);
--form-element-padding: var(--space-3) var(--space-4);
--form-element-border-radius: var(--radius-md);
--form-label-margin-bottom: var(--space-2);
```

---

## 📋 Usage Rules

### ✅ DO:
- Use design tokens exclusively (no hardcoded values)
- Reference existing tokens before creating new ones
- Follow the 8-point spacing grid (multiples of 8px)
- Use semantic color names for functional purposes
- Test color contrast ratios for accessibility

### ❌ DON'T:
- Create duplicate tokens with different names
- Use arbitrary values (e.g., `margin: 13px`)
- Mix different spacing systems (px, rem, em) randomly
- Create new gradients without approval
- Override tokens with inline styles

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-05 | Initial design system establishment |

---

**IMPORTANT:** Before adding any new design token, CHECK THIS FILE FIRST.
This is the single source of truth for all design decisions.
