# ShadCN UI Common Mistakes

Anti-patterns to avoid with correct alternatives and explanations.

## Critical Mistake #1: Hardcoding Styles

### ❌ Wrong: Hardcoded Colors

```tsx
// BAD - Hardcoding colors defeats the entire theming system
<Button className="bg-blue-600 text-white hover:bg-blue-700">
  Submit
</Button>

<Card className="bg-gray-100 border-gray-200">
  <CardHeader className="text-gray-900">Title</CardHeader>
</Card>

<div className="bg-red-500 text-white p-4">
  Error message
</div>
```

**Why it's wrong**:
- Breaks dark mode
- Bypasses theming system
- Not reusable across components
- Inconsistent with design system
- Hard to maintain

### ✅ Correct: Use Theme Variables

```tsx
// GOOD - Uses theme variables that work in light/dark mode
<Button variant="default">
  Submit
</Button>

<Card>
  <CardHeader>Title</CardHeader>
</Card>

<div className="bg-destructive text-destructive-foreground p-4">
  Error message
</div>
```

### ✅ Even Better: Create Variants

```tsx
// BEST - Add new variant to components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800",
      },
    },
  }
)

// Use it
<Button variant="danger">Delete</Button>
<Button variant="success">Confirm</Button>
```

## Critical Mistake #2: Arbitrary Style Overrides

### ❌ Wrong: Using !important and Arbitrary Values

```tsx
// BAD - Forces styles with !important
<Button className="!bg-red-500 !text-lg !p-4 !rounded-full">
  Click me
</Button>

// BAD - Arbitrary values bypass design system
<Card className="p-[17px] m-[23px] rounded-[13px]">
  Content
</Card>
```

**Why it's wrong**:
- Breaks component variants
- Creates maintenance nightmares
- Inconsistent spacing/sizing
- Can't be themed
- Defeats design tokens

### ✅ Correct: Extend Components or Create Variants

```tsx
// GOOD - Create a custom wrapper component
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LargeButton({ className, ...props }) {
  return (
    <Button
      className={cn("text-lg px-6 py-3", className)}
      {...props}
    />
  )
}

// GOOD - Or add to button variants
const buttonVariants = cva(
  "...",
  {
    variants: {
      size: {
        default: "h-10 px-4 py-2",
        lg: "h-11 px-8 text-lg",
        xl: "h-12 px-10 text-xl",  // Add new size
      },
    },
  }
)

// Use it
<Button size="xl">Click me</Button>
```

## Critical Mistake #3: Duplicating Component Code

### ❌ Wrong: Copy-Pasting Styles Everywhere

```tsx
// BAD - Same styles repeated everywhere
<button className="rounded-lg bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">
  Save
</button>

<button className="rounded-lg bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">
  Submit
</button>

<button className="rounded-lg bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">
  Confirm
</button>
```

**Why it's wrong**:
- Not DRY (Don't Repeat Yourself)
- Hard to update consistently
- Prone to copy-paste errors
- Misses accessibility features
- No keyboard/focus management

### ✅ Correct: Use ShadCN Components

```tsx
// GOOD - Reusable, accessible, themeable
import { Button } from "@/components/ui/button"

<Button>Save</Button>
<Button>Submit</Button>
<Button>Confirm</Button>
```

## Mistake #4: Not Using the cn() Utility

### ❌ Wrong: Manual Class Concatenation

```tsx
// BAD - String concatenation for conditional classes
<Button
  className={`px-4 py-2 ${isActive ? "bg-primary" : "bg-secondary"} ${
    isLarge ? "text-lg" : "text-sm"
  }`}
>
  Click
</Button>

// BAD - No proper class merging
<Button className={"bg-primary " + additionalClasses}>
  Click
</Button>
```

**Why it's wrong**:
- Doesn't properly merge conflicting classes
- Messy, hard to read
- Can cause styling conflicts
- Doesn't handle falsy values well

### ✅ Correct: Use cn() Utility

```tsx
// GOOD - Clean, handles conflicts properly
import { cn } from "@/lib/utils"

<Button
  className={cn(
    "px-4 py-2",
    isActive ? "bg-primary" : "bg-secondary",
    isLarge && "text-lg",
    additionalClasses
  )}
>
  Click
</Button>
```

## Mistake #5: Breaking Component Composition

### ❌ Wrong: Reinventing Component Structure

```tsx
// BAD - Not using Card's composition pattern
<div className="border rounded-lg p-4">
  <div className="font-bold mb-2">Title</div>
  <div className="text-gray-500 mb-4">Description</div>
  <div>Content here</div>
  <div className="mt-4">
    <button>Action</button>
  </div>
</div>
```

**Why it's wrong**:
- Doesn't match design system
- Missing semantic HTML
- No accessibility features
- Inconsistent styling

### ✅ Correct: Use Proper Composition

```tsx
// GOOD - Proper Card composition
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

## Mistake #6: Ignoring Variant Props

### ❌ Wrong: CSS Classes Instead of Variants

```tsx
// BAD - Styling with classes instead of using variants
<Button className="bg-red-600 hover:bg-red-700">
  Delete
</Button>

<Badge className="bg-green-500 text-white">
  Success
</Badge>
```

**Why it's wrong**:
- Bypasses built-in variants
- Loses component functionality
- Not consistent with other buttons

### ✅ Correct: Use Built-in Variants

```tsx
// GOOD - Using component variants
<Button variant="destructive">
  Delete
</Button>

<Badge variant="success">
  Success
</Badge>
```

## Mistake #7: Modifying Core Component Files Incorrectly

### ❌ Wrong: Changing Base Functionality

```tsx
// BAD - Modifying base component behavior in components/ui/button.tsx
export function Button({ children, ...props }: ButtonProps) {
  // Adding business logic in base component
  const handleClick = () => {
    trackAnalytics("button_click")
    sendToBackend()
  }
  
  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}
```

**Why it's wrong**:
- Breaks base component for all uses
- Mixes concerns (UI + business logic)
- Not reusable

### ✅ Correct: Extend, Don't Modify

```tsx
// GOOD - Create a specific wrapper component
import { Button } from "@/components/ui/button"

export function AnalyticsButton({ onClick, children, ...props }: ButtonProps) {
  const handleClick = (e) => {
    trackAnalytics("button_click")
    onClick?.(e)
  }
  
  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  )
}
```

## Mistake #8: Not Using Form Components Properly

### ❌ Wrong: Manual Form Handling

```tsx
// BAD - Manual form state without proper validation
const [email, setEmail] = useState("")
const [error, setError] = useState("")

const handleSubmit = (e) => {
  e.preventDefault()
  if (!email.includes("@")) {
    setError("Invalid email")
  }
}

return (
  <form onSubmit={handleSubmit}>
    <label>Email</label>
    <input
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
    {error && <span>{error}</span>}
    <button type="submit">Submit</button>
  </form>
)
```

**Why it's wrong**:
- No proper validation
- Missing accessibility
- Poor error handling
- Not type-safe

### ✅ Correct: Use Form Components with Zod

```tsx
// GOOD - Proper form with validation
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  email: z.string().email("Please enter a valid email"),
})

export function EmailForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

## Mistake #9: Inconsistent Spacing

### ❌ Wrong: Random Spacing Values

```tsx
// BAD - Random, inconsistent spacing
<div className="p-[13px] m-[27px] gap-[19px]">
  <div className="mb-[8px]">Item</div>
  <div className="mb-[11px]">Item</div>
</div>
```

**Why it's wrong**:
- Not using design tokens
- Inconsistent visual rhythm
- Hard to maintain

### ✅ Correct: Use Tailwind's Spacing Scale

```tsx
// GOOD - Consistent spacing from design system
<div className="p-4 m-6 space-y-4">
  <div>Item</div>
  <div>Item</div>
</div>

// Or for consistent gaps
<div className="flex flex-col gap-4">
  <div>Item</div>
  <div>Item</div>
</div>
```

## Mistake #10: Not Considering Dark Mode

### ❌ Wrong: Only Testing Light Mode

```tsx
// BAD - Assumes light mode only
<div className="bg-white text-black border-gray-300">
  Content
</div>
```

**Why it's wrong**:
- Breaks in dark mode
- Poor user experience
- Not using theme system

### ✅ Correct: Theme-Aware Styling

```tsx
// GOOD - Works in both modes
<div className="bg-background text-foreground border">
  Content
</div>

// Or with specific intent
<Card className="bg-card text-card-foreground">
  Content
</Card>
```

## Mistake #11: Tailwind v4 Colors Not Working

### ❌ Wrong: Missing hsl() Wrapper

```css
/* BAD - Tailwind v4 won't recognize these as colors */
@theme inline {
  --color-primary: var(--primary);
  --color-foreground: var(--foreground);
}
```

**Why it's wrong**:
- ShadCN stores HSL as raw values: `--primary: 28 100% 50%`
- Tailwind v4's `@theme inline` needs `hsl()` to recognize colors
- Without it, classes like `bg-primary` won't apply colors
- Components appear unstyled

**Symptoms**:
- Buttons have no background color
- Text doesn't have proper colors
- Theme appears broken
- DevTools shows invalid color values

### ✅ Correct: Wrap with hsl()

```css
/* GOOD - Properly wrapped for Tailwind v4 */
@theme inline {
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-foreground: hsl(var(--foreground));
  --color-background: hsl(var(--background));
  /* Wrap ALL color variables */
}
```

### Complete Fix

In `globals.css`:

```css
@import "tailwindcss";

@layer base {
  :root {
    /* Raw HSL values - NO hsl() here */
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
  }
}

/* Tailwind v4 mapping - YES hsl() here */
@theme inline {
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
}
```

### Quick Fix Command

Tell ClaudeCode:
> "Wrap all color variables in @theme inline with hsl() - use hsl(var(--primary)) not var(--primary)"

## Quick Checklist

Before committing code, ask:
- [ ] Am I using CSS variables instead of hardcoded colors?
- [ ] Am I using component variants instead of className overrides?
- [ ] Am I using the cn() utility for conditional classes?
- [ ] Am I using proper component composition (Card, Form, etc.)?
- [ ] Did I test in both light and dark mode?
- [ ] Am I using consistent spacing from Tailwind's scale?
- [ ] Could this be a reusable variant instead of a one-off?
- [ ] Am I extending components properly instead of modifying base files?
- [ ] **[Tailwind v4]** Are colors wrapped with hsl() in @theme inline block?

## Summary

**Always Do**:
- Use CSS variables and theme colors
- Create variants for reusable patterns
- Use cn() utility for class merging
- Follow component composition patterns
- Test in both light and dark mode

**Never Do**:
- Hardcode colors or spacing
- Use !important or arbitrary values
- Copy-paste styled divs instead of using components
- Modify base component files for specific use cases
- Bypass the variant system with className overrides
