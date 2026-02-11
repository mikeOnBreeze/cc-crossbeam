# ShadCN UI Variant Creation Guide

Complete guide to creating and extending component variants using class-variance-authority (cva).

## Understanding Variants

Variants are predefined style configurations for components. They enable:
- Consistent component styling
- Type-safe style options
- Composable style combinations
- Maintainable design systems

## Basic Variant Structure

Every ShadCN component uses `cva` from class-variance-authority:

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  // Base styles (always applied)
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      // Variant options
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## Adding New Variants to Existing Components

### Example: Adding a "Success" Variant to Button

1. **Open the component file**:
```bash
# Edit components/ui/button.tsx
```

2. **Add the new variant**:
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // NEW: Add success variant
        success: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

3. **Update TypeScript types** (automatic):
```tsx
// The type is automatically inferred
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
```

4. **Use the new variant**:
```tsx
<Button variant="success">Save Changes</Button>
```

## Creating Custom Size Variants

### Add "Extra Large" and "Icon" sizes:

```tsx
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: { /* ... */ },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        // NEW: Extra large size
        xl: "h-12 rounded-md px-10 text-lg",
        // NEW: Square icon button
        icon: "h-10 w-10",
      },
    },
  }
)
```

Usage:
```tsx
<Button size="xl">Large Action</Button>
<Button size="icon">
  <Icons.search className="h-4 w-4" />
</Button>
```

## Compound Variants

Compound variants apply specific styles when multiple variant conditions are met:

```tsx
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        default: "...",
        destructive: "...",
      },
      size: {
        default: "h-10 px-4",
        lg: "h-11 px-8",
      },
      loading: {
        true: "opacity-50 cursor-not-allowed",
      },
    },
    compoundVariants: [
      {
        // When both destructive AND large
        variant: "destructive",
        size: "lg",
        className: "font-bold uppercase",
      },
      {
        // Any variant when loading
        loading: true,
        className: "pointer-events-none",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## Complete Example: Enhanced Badge Component

Let's create a Badge with multiple variant types:

```tsx
// components/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Base styles
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-600 text-white hover:bg-green-700",
        warning: "border-transparent bg-yellow-600 text-white hover:bg-yellow-700",
        info: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
      shape: {
        default: "rounded-full",
        rounded: "rounded-md",
        square: "rounded-none",
      },
    },
    compoundVariants: [
      {
        variant: "outline",
        className: "border-current",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, shape, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size, shape }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
```

Usage:
```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning" size="lg">Pending</Badge>
<Badge variant="info" shape="rounded">New</Badge>
```

## Adding Conditional Variants

Create variants that respond to state:

```tsx
const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border",
        elevated: "border-0 shadow-md",
        ghost: "border-0 shadow-none",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-lg transition-shadow",
      },
      selected: {
        true: "ring-2 ring-primary",
      },
    },
    compoundVariants: [
      {
        interactive: true,
        selected: true,
        className: "ring-2 ring-primary shadow-xl",
      },
    ],
    defaultVariants: {
      variant: "default",
    },
  }
)
```

Usage:
```tsx
<Card variant="elevated" interactive selected>
  Selected interactive card
</Card>
```

## Creating Theme-Specific Variants

Support both light and dark mode in variants:

```tsx
const alertVariants = cva(
  "relative w-full rounded-lg border p-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: cn(
          "border-destructive/50 text-destructive",
          "dark:border-destructive [&>svg]:text-destructive"
        ),
        success: cn(
          "border-green-500 bg-green-50 text-green-900",
          "dark:border-green-900 dark:bg-green-950 dark:text-green-100"
        ),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

## Best Practices for Variants

### 1. Use Semantic Names

```tsx
// ❌ Bad: Based on appearance
variant: {
  blue: "bg-blue-600",
  red: "bg-red-600",
}

// ✅ Good: Based on purpose
variant: {
  primary: "bg-primary",
  destructive: "bg-destructive",
  success: "bg-green-600",
}
```

### 2. Maintain Consistency

```tsx
// ✅ Good: Consistent pattern across components
// Button:
variant: { default, destructive, outline, secondary, ghost, link }

// Badge:
variant: { default, destructive, outline, secondary }

// Alert:
variant: { default, destructive }
```

### 3. Always Include Dark Mode

```tsx
// ✅ Good: Dark mode considered
variant: {
  custom: cn(
    "bg-purple-100 text-purple-900 border-purple-300",
    "dark:bg-purple-950 dark:text-purple-100 dark:border-purple-800"
  ),
}
```

### 4. Use Hover States

```tsx
// ✅ Good: Interactive feedback
variant: {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
}
```

### 5. Consider Accessibility

```tsx
// ✅ Good: Focus states for keyboard navigation
cva(
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  { /* variants */ }
)
```

## Common Variant Patterns

### Loading State Variant

```tsx
const buttonVariants = cva("...", {
  variants: {
    variant: { /* ... */ },
    isLoading: {
      true: "opacity-50 cursor-wait",
    },
  },
})

// Usage
<Button isLoading={loading}>
  {loading ? "Loading..." : "Submit"}
</Button>
```

### Disabled State Variant

```tsx
const inputVariants = cva("...", {
  variants: {
    disabled: {
      true: "cursor-not-allowed opacity-50 bg-muted",
    },
  },
})
```

### Full Width Variant

```tsx
const buttonVariants = cva("...", {
  variants: {
    fullWidth: {
      true: "w-full",
    },
  },
})

// Usage
<Button fullWidth>Full Width Button</Button>
```

## Testing Variants

Always test your variants:

1. **All combinations**:
```tsx
// Test matrix
<Button variant="default" size="sm" />
<Button variant="default" size="default" />
<Button variant="default" size="lg" />
<Button variant="destructive" size="sm" />
// ... etc
```

2. **Dark mode**:
```tsx
<div className="dark">
  <Button variant="custom">Test in dark mode</Button>
</div>
```

3. **Interactive states**:
```tsx
<Button variant="custom" disabled>Disabled</Button>
<Button variant="custom" aria-pressed="true">Active</Button>
```

## Variant Type Safety

TypeScript automatically infers variant types:

```tsx
import { Button, type ButtonProps } from "@/components/ui/button"

// ✅ TypeScript knows these are valid
<Button variant="default" />
<Button variant="destructive" />

// ❌ TypeScript error - "invalid" is not a valid variant
<Button variant="invalid" />

// Props are fully typed
const MyButton = (props: ButtonProps) => {
  return <Button {...props} />
}
```

## Summary

**Key Principles**:
1. Always use cva for variant-based styling
2. Use semantic naming for variants
3. Support dark mode in all variants
4. Include hover/focus states
5. Test all variant combinations
6. Leverage TypeScript type safety

**When to Create Variants**:
- When you need the same style in multiple places
- When styles have clear semantic meaning (primary, destructive, etc.)
- When you need consistent behavior across components

**When NOT to Use Variants**:
- One-off styles specific to a single component instance
- Highly dynamic styles based on data
- Layout-specific positioning (use className instead)
