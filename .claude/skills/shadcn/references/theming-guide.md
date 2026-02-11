# ShadCN UI Theming Guide

Complete guide to theming, CSS variables, dark mode, and custom color systems.

## CSS Variables System

ShadCN uses CSS custom properties (variables) for theming. This enables:
- Easy theme switching
- Dark mode support
- Consistent color systems
- Runtime theme updates

### Default Theme Structure

In `app/globals.css`:

```css
@layer base {
  :root {
    /* Background & Foreground */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    /* Card */
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    /* Popover */
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    /* Primary */
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    /* Secondary */
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    /* Muted */
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    /* Accent */
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    /* Destructive */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    /* Border */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    /* Border Radius */
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

### Color Format: HSL

Variables use HSL format without `hsl()`:
```css
/* Correct */
--primary: 222.2 47.4% 11.2%;

/* Incorrect */
--primary: hsl(222.2, 47.4%, 11.2%);
```

Tailwind automatically wraps it:
```tsx
className="bg-primary" // → background-color: hsl(222.2 47.4% 11.2%)
```

## Using Theme Colors

### In Components

```tsx
// Use Tailwind classes with theme variables
<div className="bg-primary text-primary-foreground">
  Primary styled content
</div>

<div className="bg-secondary text-secondary-foreground">
  Secondary styled content
</div>

<Button variant="destructive">
  Delete
</Button>
```

### Convention: Background & Foreground Pairs

Every background color has a corresponding foreground color:
- `--primary` + `--primary-foreground`
- `--secondary` + `--secondary-foreground`
- `--destructive` + `--destructive-foreground`

This ensures text is always readable on backgrounds.

## Dark Mode Setup

### Using next-themes

1. Install:
```bash
npm install next-themes
```

2. Create theme provider:

```tsx
// components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

3. Wrap app in provider:

```tsx
// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Theme Toggle Component

```tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## Custom Themes

### Creating a Custom Theme

Add your theme to `globals.css`:

```css
:root {
  /* ... default theme ... */
}

.theme-blue {
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
  --secondary: 214 95% 93%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  /* ... other colors ... */
}

.theme-green {
  --primary: 142 76% 36%;
  --primary-foreground: 355.7 100% 97.3%;
  --secondary: 138 76% 97%;
  --secondary-foreground: 142 76% 36%;
  /* ... other colors ... */
}
```

### Apply Custom Theme

```tsx
// Apply via className
<div className="theme-blue">
  <Button>Blue themed button</Button>
</div>

// Or set on body/html
<body className="theme-green">
  {/* All components use green theme */}
</body>
```

## Adding New Colors

### 1. Define CSS Variable

```css
:root {
  --warning: 38 92% 50%;
  --warning-foreground: 48 96% 89%;
}

.dark {
  --warning: 48 96% 89%;
  --warning-foreground: 38 92% 50%;
}
```

### 2. Extend Tailwind Config

```js
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        warning: "hsl(var(--warning))",
        "warning-foreground": "hsl(var(--warning-foreground))",
      },
    },
  },
}
```

### 3. Use in Components

```tsx
<div className="bg-warning text-warning-foreground">
  Warning content
</div>

<Button className="bg-warning text-warning-foreground hover:bg-warning/90">
  Warning Action
</Button>
```

## Theme Customization Tools

### Shadcn Theme Builder

Visit https://ui.shadcn.com/themes and:
1. Choose style (default/new-york)
2. Select base color
3. Adjust border radius
4. Toggle between light/dark
5. Copy generated CSS

### Theme Example: Purple

```css
:root {
  --primary: 262 83% 58%;
  --primary-foreground: 210 40% 98%;
  --secondary: 262 15% 92%;
  --secondary-foreground: 262 20% 20%;
}

.dark {
  --primary: 262 83% 58%;
  --primary-foreground: 262 15% 5%;
  --secondary: 262 20% 15%;
  --secondary-foreground: 262 15% 92%;
}
```

## Opacity with Colors

Use Tailwind's opacity utilities:

```tsx
<div className="bg-primary/50">50% opacity</div>
<div className="bg-primary/25">25% opacity</div>
<div className="bg-primary/10">10% opacity</div>

<Button className="hover:bg-primary/90">
  Slightly transparent on hover
</Button>
```

## Border Radius Theming

Control global border radius:

```css
:root {
  --radius: 0.5rem;  /* Medium rounded */
}

/* Or try: */
--radius: 0rem;      /* Square corners */
--radius: 0.3rem;    /* Slightly rounded */
--radius: 1rem;      /* Very rounded */
```

All components automatically use this value.

## Tailwind Config Integration

Ensure your `tailwind.config.ts` uses CSS variables:

```ts
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

## Best Practices

1. **Always use CSS variables** - Never hardcode colors
2. **Maintain background/foreground pairs** - Ensures readability
3. **Test in both modes** - Check light and dark themes
4. **Use semantic naming** - Name colors by purpose (primary/secondary) not appearance (blue/green)
5. **Document custom colors** - Add comments for team members
6. **Consistent opacity patterns** - Use standard opacity values (10%, 25%, 50%, 75%, 90%)

## Tailwind v4 Color Issue

### The Problem

**Symptoms**: Colors defined in CSS variables don't show up in components. Buttons appear unstyled, theme colors are missing.

**Root Cause**: Tailwind v4 uses a new `@theme inline` directive that requires `hsl()` wrapper around CSS variable references.

ShadCN stores colors as HSL channels (raw values):
```css
:root {
  --primary: 28 100% 50%;  /* Just the HSL values, no hsl() */
}
```

### The Fix

In your `globals.css`, find the `@theme inline` block and wrap all color variables with `hsl()`:

**❌ WRONG - This won't work:**
```css
@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
}
```

**✅ CORRECT - Wrap with hsl():**
```css
@theme inline {
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
}
```

### Complete Example

Here's a full `globals.css` with proper Tailwind v4 setup:

```css
@import "tailwindcss";

@layer base {
  :root {
    /* ShadCN color definitions - HSL channels only */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    /* ... other dark mode values */
  }
}

/* Tailwind v4 theme mapping - MUST wrap with hsl() */
@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
}
```

### Why This Happens

1. ShadCN convention: Store HSL as three separate values (`28 100% 50%`)
2. Tailwind v3: Used `hsl(var(--primary))` in config file
3. Tailwind v4: Moved to `@theme inline`, requires explicit `hsl()` wrapper
4. Without `hsl()`: Tailwind sees `28 100% 50%` but doesn't know it's a color

### Quick Command for ClaudeCode

When hitting this issue, use:
```
"Wrap all color variables in the @theme inline block with hsl() - 
they need to be hsl(var(--primary)) not just var(--primary)"
```

### Verification

After fixing, test in browser DevTools:
```css
/* Should see this computed value: */
.bg-primary {
  background-color: hsl(222.2 47.4% 11.2%);  /* ✅ Good */
}

/* Not this: */
.bg-primary {
  background-color: 222.2 47.4% 11.2%;  /* ❌ Bad - no hsl() */
}
```

### Related Issues

**Other Tailwind v4 changes affecting ShadCN:**
- `@import "tailwindcss"` replaces individual layer imports
- `@theme inline` replaces `tailwind.config.ts` for some settings
- CSS variable syntax stays the same in `:root` and `.dark`

## Common Theme Issues

### Issue: Dark mode not working
**Solution**: Check `<html>` tag has `suppressHydrationWarning` and theme provider uses `attribute="class"`

### Issue: Colors not applying
**Solution**: Verify Tailwind config extends colors with `hsl(var(--variable))` format

### Issue: Flash of unstyled content
**Solution**: Use `disableTransitionOnChange` in ThemeProvider

### Issue: Custom color not showing
**Solution**: Check both CSS variable definition and Tailwind config extension
