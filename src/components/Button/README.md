# Button Component

**Version:** 1.0.0
**Status:** ✅ CREATED
**Location:** `src/components/Button/`

## Overview

Enterprise-grade button component that consolidates all button styles across the ImobiTools application. Fully accessible (WCAG AA compliant) with keyboard navigation support.

## Features

- ✅ 8 variants (Primary, Secondary, Danger, Success, Warning, Ghost, Outlined, Text)
- ✅ 5 sizes (sm, base, md, lg, xl)
- ✅ Loading states with spinner
- ✅ Disabled states
- ✅ Icon support (left/right positioning)
- ✅ Button groups
- ✅ Full accessibility (ARIA labels, keyboard navigation)
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Minimum 44x44px touch targets
- ✅ Micro-interactions (hover, active, focus states)

## Usage

### HTML (Static)

```html
<!-- Import styles -->
<link rel="stylesheet" href="/src/styles/tokens.css" />
<link rel="stylesheet" href="/src/components/Button/Button.css" />

<!-- Primary button -->
<button class="btn btn--primary btn--md">Click me</button>

<!-- Secondary button with icon -->
<button class="btn btn--secondary btn--base">
  <span class="btn__icon btn__icon--left">
    <svg>...</svg>
  </span>
  <span class="btn__text">Save</span>
</button>

<!-- Danger button (small) -->
<button class="btn btn--danger btn--sm">Delete</button>

<!-- Loading state -->
<button class="btn btn--primary btn--md btn--loading">Processing...</button>

<!-- Disabled state -->
<button class="btn btn--primary btn--md" disabled>Disabled</button>

<!-- Full width -->
<button class="btn btn--primary btn--md btn--full">Full Width Button</button>

<!-- Icon-only button -->
<button class="btn btn--ghost btn--icon btn--round" aria-label="Settings">
  <svg class="btn__icon">...</svg>
</button>
```

### JavaScript (Programmatic)

```javascript
import { Button, createButton } from './components/Button/Button.js';

// Create a button
const btn = createButton({
  variant: 'primary',
  size: 'md',
  text: 'Click me',
  onClick: () => console.log('Clicked!'),
});

// Add to DOM
document.body.appendChild(btn.element);

// Set loading state
btn.setLoading(true);

// Later...
btn.setLoading(false);

// Update text
btn.setText('Success!');

// Change variant
btn.setVariant('success');

// Disable button
btn.setDisabled(true);
```

### Advanced Usage

#### Icon Button

```javascript
import { createIconButton } from './components/Button/Button.js';

const iconBtn = createIconButton({
  icon: '<svg>...</svg>',
  ariaLabel: 'Delete item', // Required!
  variant: 'danger',
  onClick: () => deleteItem(),
});
```

#### Confirm Button (with loading)

```javascript
import { createConfirmButton } from './components/Button/Button.js';

const confirmBtn = createConfirmButton({
  text: 'Delete Account',
  confirmText: 'Deleting...',
  onConfirm: async () => {
    await deleteAccount();
  },
});
```

#### Button Group

```javascript
import { Button, ButtonGroup } from './components/Button/Button.js';

const group = new ButtonGroup({
  buttons: [
    new Button({ text: 'Left', variant: 'secondary' }),
    new Button({ text: 'Center', variant: 'secondary' }),
    new Button({ text: 'Right', variant: 'secondary' }),
  ],
  attached: true, // Buttons connected
});

document.body.appendChild(group.element);
```

### Data Attributes (Auto-initialization)

```html
<!-- Buttons with data-button attribute are auto-initialized -->
<button data-button data-button-variant="primary" data-button-size="md">
  Auto-initialized Button
</button>

<!-- With loading on click -->
<button data-button data-button-loading-target="true">Click to Load</button>
```

## Variants

### Primary

Default button style. Use for main call-to-action.

```html
<button class="btn btn--primary btn--md">Primary</button>
```

### Secondary

Alternative style. Use for secondary actions.

```html
<button class="btn btn--secondary btn--md">Secondary</button>
```

### Danger

Destructive actions (delete, remove, cancel).

```html
<button class="btn btn--danger btn--md">Delete</button>
```

### Success

Positive actions (save, confirm, approve).

```html
<button class="btn btn--success btn--md">Save</button>
```

### Warning

Warning actions (proceed with caution).

```html
<button class="btn btn--warning btn--md">Warning</button>
```

### Ghost

Transparent background. Use for tertiary actions.

```html
<button class="btn btn--ghost btn--md">Ghost</button>
```

### Outlined

Outlined style. Use for secondary emphasis.

```html
<button class="btn btn--outlined btn--md">Outlined</button>
```

### Text

Text-only. Use for least emphasis.

```html
<button class="btn btn--text btn--md">Text Only</button>
```

## Sizes

| Class       | Height | Padding   | Font Size | Use Case                |
| ----------- | ------ | --------- | --------- | ----------------------- |
| `btn--sm`   | 32px   | 8px 12px  | 14px      | Compact spaces, tables  |
| `btn--base` | 40px   | 12px 16px | 16px      | Default, most common    |
| `btn--md`   | 44px   | 12px 20px | 16px      | Touch-friendly (mobile) |
| `btn--lg`   | 48px   | 16px 24px | 18px      | Hero sections           |
| `btn--xl`   | 56px   | 20px 32px | 20px      | Landing pages           |

## States

### Loading

Shows spinner, disables interaction.

```javascript
button.setLoading(true);
```

### Disabled

Grayed out, not clickable.

```html
<button class="btn btn--primary btn--md" disabled>Disabled</button>
```

### Focus

Keyboard navigation support with visible focus ring.

```css
/* Automatic - no code needed */
.btn:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### Active (Pressed)

Visual feedback when clicked.

```css
/* Automatic - no code needed */
.btn:active {
  transform: translateY(1px) scale(0.98);
}
```

## Accessibility

✅ **WCAG AA Compliant**

- Minimum 44x44px touch targets (mobile)
- Color contrast ratios > 4.5:1
- Keyboard navigable (Tab, Enter, Space)
- Visible focus indicators
- ARIA labels for icon buttons
- ARIA states (disabled, busy)
- Screen reader friendly

### Required ARIA Labels

Icon-only buttons **MUST** have `aria-label`:

```html
<!-- ❌ BAD -->
<button class="btn btn--icon">
  <svg>...</svg>
</button>

<!-- ✅ GOOD -->
<button class="btn btn--icon" aria-label="Delete item">
  <svg>...</svg>
</button>
```

### Loading State

Automatically sets `aria-busy="true"` when loading:

```javascript
btn.setLoading(true); // Sets aria-busy="true"
```

## Keyboard Navigation

| Key       | Action                |
| --------- | --------------------- |
| Tab       | Focus next button     |
| Shift+Tab | Focus previous button |
| Enter     | Activate button       |
| Space     | Activate button       |

## Migration Guide

### From Old Button Classes

| Old Class      | New Class                               | Notes                      |
| -------------- | --------------------------------------- | -------------------------- |
| `.btn-primary` | `.btn .btn--primary .btn--base`         | Use base size              |
| `.btn-add`     | `.btn .btn--success .btn--sm`           | Changed to success variant |
| `.btn-remove`  | `.btn .btn--danger .btn--sm .btn--icon` | Icon button                |
| `.btn-product` | `.btn .btn--primary .btn--lg`           | Large size                 |
| `.btn-outline` | `.btn .btn--outlined .btn--base`        | Renamed                    |
| `.btn-tool`    | `.btn .btn--secondary .btn--base`       | Secondary variant          |

### Example Migration

**Before:**

```html
<button class="btn-primary">Click me</button>
<button class="btn-add">Add</button>
<button class="btn-remove">×</button>
```

**After:**

```html
<button class="btn btn--primary btn--base">Click me</button>
<button class="btn btn--success btn--sm">Add</button>
<button class="btn btn--danger btn--sm btn--icon" aria-label="Remove">×</button>
```

## Props API (JavaScript)

| Prop           | Type                                                                                                | Default     | Description                            |
| -------------- | --------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------- |
| `variant`      | `'primary' \| 'secondary' \| 'danger' \| 'success' \| 'warning' \| 'ghost' \| 'outlined' \| 'text'` | `'primary'` | Button style variant                   |
| `size`         | `'sm' \| 'base' \| 'md' \| 'lg' \| 'xl'`                                                            | `'base'`    | Button size                            |
| `text`         | `string`                                                                                            | -           | Button text content                    |
| `icon`         | `string`                                                                                            | -           | SVG string or icon class               |
| `iconPosition` | `'left' \| 'right'`                                                                                 | `'left'`    | Icon position                          |
| `disabled`     | `boolean`                                                                                           | `false`     | Disabled state                         |
| `loading`      | `boolean`                                                                                           | `false`     | Loading state                          |
| `fullWidth`    | `boolean`                                                                                           | `false`     | Full width button                      |
| `pill`         | `boolean`                                                                                           | `false`     | Pill-shaped button                     |
| `elevated`     | `boolean`                                                                                           | `false`     | Extra shadow elevation                 |
| `type`         | `'button' \| 'submit' \| 'reset'`                                                                   | `'button'`  | HTML button type                       |
| `ariaLabel`    | `string`                                                                                            | -           | ARIA label (required for icon buttons) |
| `className`    | `string`                                                                                            | -           | Additional CSS classes                 |
| `onClick`      | `function`                                                                                          | -           | Click event handler                    |
| `onFocus`      | `function`                                                                                          | -           | Focus event handler                    |
| `onBlur`       | `function`                                                                                          | -           | Blur event handler                     |

## Methods API

| Method                  | Params    | Description               |
| ----------------------- | --------- | ------------------------- |
| `setLoading(loading)`   | `boolean` | Set loading state         |
| `setDisabled(disabled)` | `boolean` | Set disabled state        |
| `setText(text)`         | `string`  | Update button text        |
| `setVariant(variant)`   | `string`  | Change button variant     |
| `destroy()`             | -         | Remove button and cleanup |
| `getElement()`          | -         | Get button DOM element    |

## Best Practices

### ✅ DO:

- Use `btn--primary` for main call-to-action (one per section)
- Use `btn--secondary` for alternative actions
- Use `btn--danger` for destructive actions only
- Add `aria-label` to all icon-only buttons
- Use `btn--md` or larger for mobile touch targets
- Set loading state during async operations
- Disable buttons to prevent double-clicks

### ❌ DON'T:

- Don't use multiple primary buttons in one section
- Don't create buttons smaller than `btn--sm` (32px)
- Don't forget `aria-label` on icon buttons
- Don't use colored backgrounds behind buttons
- Don't rely on color alone to convey meaning
- Don't manually animate buttons (use built-in states)

## Examples

### Form Submit Button

```html
<form id="myForm">
  <!-- form fields -->
  <button type="submit" class="btn btn--primary btn--md btn--full">Submit Form</button>
</form>

<script>
  import { createButton } from './components/Button/Button.js';

  const form = document.getElementById('myForm');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Set loading state
    submitBtn.classList.add('btn--loading');
    submitBtn.disabled = true;

    try {
      await submitForm(new FormData(form));
      // Success
      submitBtn.textContent = 'Success!';
      submitBtn.classList.remove('btn--loading', 'btn--primary');
      submitBtn.classList.add('btn--success');
    } catch (error) {
      // Error
      alert('Submission failed');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('btn--loading');
    }
  });
</script>
```

### Delete Confirmation

```javascript
import { createConfirmButton } from './components/Button/Button.js';

const deleteBtn = createConfirmButton({
  text: 'Delete Item',
  confirmText: 'Deleting...',
  onConfirm: async () => {
    const response = await fetch('/api/items/123', { method: 'DELETE' });
    if (response.ok) {
      // Remove from UI
      document.getElementById('item-123').remove();
    }
  },
});
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **CSS:** 12 KB (gzipped: ~3 KB)
- **JS:** 5 KB (gzipped: ~2 KB)
- **First Paint:** <50ms
- **No external dependencies**

## Related Components

- [ButtonGroup](#button-group) - Group multiple buttons
- [IconButton](#icon-button) - Icon-only buttons
- [Modal](/src/components/Modal/) - Modal dialogs with buttons
- [Form](/src/components/Form/) - Form components

## Changelog

| Version | Date       | Changes                                                               |
| ------- | ---------- | --------------------------------------------------------------------- |
| 1.0.0   | 2025-01-05 | Initial release - consolidated 8 button styles into unified component |

## Support

For issues or questions:

- Check [COMPONENT_REGISTRY.md](../../../COMPONENT_REGISTRY.md)
- Review [DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md)
- See [Architecture Document](../../../implementation/00-ARCHITECTURE.md)

---

**Status:** ✅ Production Ready
**Replaces:** `.btn-primary`, `.btn-add`, `.btn-remove`, `.btn-product`, `.btn-outline`, `.btn-tool`, `.btn-secondary`
