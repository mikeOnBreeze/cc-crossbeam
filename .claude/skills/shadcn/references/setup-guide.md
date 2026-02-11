# ShadCN UI Setup Guide

## Installation & Configuration

### Initial Setup

**For New Projects**
```bash
# Initialize ShadCN (interactive prompts)
npx shadcn@latest init

# OR use defaults (faster)
npx shadcn@latest init -d
```

**For Existing Next.js Projects**
```bash
cd your-nextjs-project
npx shadcn@latest init
```

### Configuration Prompts

You'll be asked:

1. **Style**: `default` or `new-york`
   - `default`: Clean, modern design
   - `new-york`: More refined, professional look (recommended)

2. **Base Color**: `slate`, `gray`, `zinc`, `neutral`, `stone`
   - Affects borders, muted text, neutral elements
   - `slate` or `zinc` work well for most projects

3. **CSS Variables**: `yes` or `no`
   - Choose `yes` for flexible theming (recommended)
   - Enables easy theme switching and customization

### What Init Does

The `init` command automatically:

1. Creates `components.json` config file
2. Sets up Tailwind CSS (if not already configured)
3. Adds CSS variables to `app/globals.css`
4. Configures path aliases in `tsconfig.json`
5. Installs required dependencies:
   - `tailwindcss`
   - `class-variance-authority` (for variants)
   - `clsx` & `tailwind-merge` (for cn utility)
   - `@radix-ui/*` packages (as needed)

## components.json Configuration

Example configuration file:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### Key Configuration Options

**style**: Visual theme variant (cannot be changed after init)
**rsc**: React Server Components support (true for Next.js App Router)
**tsx**: Use TypeScript (recommended)
**tailwind.cssVariables**: Use CSS custom properties for theming
**aliases**: Import path shortcuts (must match tsconfig.json paths)

## Adding Components

### Individual Components
```bash
# Add specific components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
```

### Multiple Components at Once
```bash
npx shadcn@latest add button card dialog form input
```

### All Form Components
```bash
npx shadcn@latest add form input label textarea select checkbox
```

### Common Component Sets

**Basic UI**
```bash
npx shadcn@latest add button card badge separator
```

**Forms**
```bash
npx shadcn@latest add form input label textarea select checkbox radio-group
```

**Data Display**
```bash
npx shadcn@latest add table data-table pagination
```

**Overlays**
```bash
npx shadcn@latest add dialog sheet popover tooltip
```

**Navigation**
```bash
npx shadcn@latest add navigation-menu tabs breadcrumb
```

## File Structure After Init

```
project-root/
├── app/
│   └── globals.css          # Theme CSS variables
├── components/
│   └── ui/                  # ShadCN components (you own these)
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── lib/
│   └── utils.ts             # cn() utility function
├── components.json          # ShadCN configuration
├── tailwind.config.ts       # Tailwind configuration
└── tsconfig.json            # Path aliases
```

## Path Aliases Setup

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

This enables imports like:
```tsx
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

## globals.css Structure

After init, your `globals.css` will include:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... more CSS variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    /* ... dark mode variables */
  }
}
```

## Verifying Installation

Test your setup:

```tsx
// app/page.tsx
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Button>Hello ShadCN</Button>
    </main>
  )
}
```

If this works, your setup is complete!

## Troubleshooting

### "Module not found" errors
- Check `tsconfig.json` path aliases match `components.json`
- Ensure `baseUrl` is set to `"."`
- Restart TypeScript server in IDE

### Components not styling correctly
- Verify `globals.css` is imported in root layout
- Check Tailwind config includes correct content paths
- Clear `.next` cache and restart dev server

### CSS variables not working
- Ensure `tailwind.cssVariables: true` in `components.json`
- Verify theme CSS variables exist in `globals.css`
- Check that colors use `var(--variable-name)` syntax

## Manual Installation

If you prefer manual setup:

1. Install dependencies:
```bash
npm install tailwindcss class-variance-authority clsx tailwind-merge
```

2. Create `lib/utils.ts`:
```tsx
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

3. Add CSS variables to `globals.css` (see structure above)

4. Configure Tailwind (see theming-guide.md)

5. Copy component code from https://ui.shadcn.com

## Next Steps

After setup:
1. Read [component-patterns.md](component-patterns.md) for usage examples
2. Review [theming-guide.md](theming-guide.md) for customization
3. Check [common-mistakes.md](common-mistakes.md) to avoid pitfalls
4. Learn [variant-creation.md](variant-creation.md) for extending components
