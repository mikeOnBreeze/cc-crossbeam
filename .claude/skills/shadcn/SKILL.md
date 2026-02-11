---
name: shadcn
description: Expert guide for ShadCN UI component library with Next.js. Use when working with ShadCN/UI projects including (1) Initial setup and configuration, (2) Adding and customizing components, (3) Theming and styling patterns, (4) Avoiding common mistakes like hardcoding styles instead of using variants/design tokens. Critical for maintaining consistent, reusable component patterns instead of one-off hardcoded implementations.
---

# ShadCN UI Expert Guide

## Core Philosophy

**ShadCN UI is NOT a traditional component library** - it's a code distribution system that copies source code directly into your project at `components/ui/`. You own and control the code completely.

**Critical Rule**: Always use CSS variables and component variants for styling. NEVER hardcode styles directly in components. This maintains consistency across your design system.

## ⚠️ Critical: Tailwind v4 Color Issue

**If colors aren't showing up in Tailwind v4**, you need to wrap CSS variables with `hsl()`:

```css
/* ❌ WRONG - Colors won't work */
@theme inline {
  --color-primary: var(--primary);
}

/* ✅ CORRECT - Wrap with hsl() */
@theme inline {
  --color-primary: hsl(var(--primary));
}
```

ShadCN stores HSL channels as raw values (`28 100% 50%`). Tailwind v4's `@theme inline` needs `hsl()` wrapper to recognize them as colors.

See [theming-guide.md](references/theming-guide.md#tailwind-v4-color-issue) for full details.

## Quick Reference

### Initial Setup
```bash
npx shadcn@latest init        # Interactive setup
npx shadcn@latest init -d     # Use defaults (recommended)
```

### Adding Components
```bash
npx shadcn@latest add button card dialog
```

Components install to `components/ui/[component-name].tsx`

### Import & Use
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default" size="lg">Click me</Button>
```

## Core Principles

1. **Use Variants** - Never hardcode styles; always create/use component variants
2. **CSS Variables** - Theme with CSS variables in `globals.css`, not hardcoded colors
3. **Composition** - Build complex UIs by composing simple components
4. **cn() Utility** - Always use `cn()` from `lib/utils.ts` for conditional classes
5. **Own Your Code** - Components live in your repo; modify them as needed

## Detailed Documentation

For comprehensive guides and examples, read these reference files:

- **[setup-guide.md](references/setup-guide.md)** - Detailed installation, configuration, and components.json setup
- **[component-patterns.md](references/component-patterns.md)** - Complete examples: forms with validation, data tables, dialogs, layouts
- **[theming-guide.md](references/theming-guide.md)** - CSS variables, dark mode, custom themes, color systems
- **[variant-creation.md](references/variant-creation.md)** - How to create and extend component variants properly
- **[common-mistakes.md](references/common-mistakes.md)** - Anti-patterns to avoid with correct alternatives

## Quick Anti-Patterns

### ❌ Wrong
```tsx
// Hardcoded styling
<Button className="bg-blue-600 text-white px-8">Submit</Button>

// Arbitrary overrides
<Button className="!bg-red-500 !text-lg">Click</Button>

// Duplicated code
<button className="rounded-lg bg-primary px-4 py-2">Save</button>
```

### ✅ Correct
```tsx
// Use variants
<Button variant="primary" size="lg">Submit</Button>

// Create new variant in components/ui/button.tsx
variants: {
  variant: {
    danger: "bg-destructive text-destructive-foreground"
  }
}

// Use component system
<Button>Save</Button>
```

## File Structure
```
project/
├── components/
│   ├── ui/              # ShadCN components (YOU OWN)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── custom/          # Your extensions
├── lib/
│   └── utils.ts         # cn() utility
├── app/
│   └── globals.css      # Theme CSS variables
└── components.json      # ShadCN config
```

## When to Use Web Search

Search the official docs for:
- Specific component API details
- New/updated component examples
- Advanced composition patterns
- Latest features or changes

Example: `shadcn ui [component-name] examples`

## Server vs Client Components

- **Server Components** (no `"use client"`): Card, Badge, Typography, Separator
- **Client Components** (has `"use client"`): Dialog, Dropdown, Sheet, Form

Interactive components automatically include the directive.

## Key Reminders

- Components don't auto-update; manually re-add or update them
- Always use the theming system - never hardcode colors or spacing
- Build reusable patterns with variants, not one-off implementations
- Use composition to build complex UIs from simple pieces
- Official docs: https://ui.shadcn.com
