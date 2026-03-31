# UX/UI Design Guide 🎨

Complete guide for UX/UI patterns, components, and animations in Alvo Diário.

## 📋 Table of Contents

1. [Design Principles](#design-principles)
2. [Color System & Dark Mode](#color-system--dark-mode)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Animations & Transitions](#animations--transitions)
6. [Component Library](#component-library)
7. [Form Design](#form-design)
8. [Accessibility (a11y)](#accessibility)
9. [Mobile Responsiveness](#mobile-responsiveness)
10. [Best Practices](#best-practices)

---

## Design Principles

### 1. **Clarity**
- Every interface element should have a clear purpose
- Use consistent visual hierarchy (headings, body text, labels)
- Provide context with hints and helper text
- Avoid unnecessary visual clutter

### 2. **Feedback**
- Provide immediate visual feedback for user actions
- Use animations and color changes to indicate state changes
- Show loading states and success confirmations
- Display error messages clearly with helpful guidance

### 3. **Consistency**
- Use the same components across similar use cases
- Maintain consistent spacing and alignment
- Keep color usage consistent with the design system
- Use standard icons and terminology

### 4. **Accessibility**
- Ensure sufficient color contrast (WCAG AA standard)
- Support keyboard navigation
- Use proper ARIA labels and semantic HTML
- Test with screen readers

### 5. **Performance**
- Use smooth animations (avoid janky transitions)
- Lazy load heavy content
- Optimize images and assets
- Keep initial load time under 3 seconds

---

## Color System & Dark Mode

### Color Palette

```css
/* Primary Colors */
--primary: hsl(221, 83%, 53%)          /* Brand blue */
--primary-foreground: hsl(210, 40%, 98%) /* Text on primary */

/* Secondary Colors */
--secondary: hsl(217, 33%, 17%)        /* Dark accent */
--secondary-foreground: hsl(210, 40%, 98%)

/* Semantic Colors */
--destructive: hsl(0, 84%, 60%)        /* Errors & warnings */
--destructive-foreground: hsl(210, 40%, 98%)

/* Neutral Colors */
--background: hsl(0, 0%, 100%)         /* Light mode background */
--foreground: hsl(217, 33%, 17%)       /* Text color */
--muted: hsl(210, 11%, 96%)            /* Subtle backgrounds */
--muted-foreground: hsl(217, 8%, 48%)  /* Secondary text */

/* Borders & Inputs */
--border: hsl(214, 32%, 91%)           /* Element borders */
--input: hsl(214, 32%, 91%)            /* Input borders */
--ring: hsl(221, 83%, 53%)             /* Focus ring */

/* Cards & Surfaces */
--card: hsl(0, 0%, 100%)               /* Card backgrounds */
--card-foreground: hsl(217, 33%, 17%)  /* Card text */

/* Sidebar Colors */
--sidebar-background: hsl(217, 33%, 17%)
--sidebar-foreground: hsl(210, 40%, 98%)
--sidebar-primary: hsl(221, 83%, 53%)
--sidebar-accent: hsl(217, 91%, 60%)
```

### Dark Mode

Dark mode is automatically enabled when user's system preference is set to dark. To manually toggle:

```javascript
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Dark Mode
    </button>
  );
}
```

**Dark Mode Colors (automatic via Tailwind):**
- Background becomes dark blue-gray
- Text becomes light gray
- Borders become darker
- Cards maintain contrast

### Contrast Ratios

All text must meet WCAG AA standards:
- **Normal text**: 4.5:1 minimum
- **Large text** (18pt+): 3:1 minimum
- **UI components**: 3:1 minimum

---

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
             sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
```

### Text Sizes

| Usage | Size | Weight | Line Height |
|-------|------|--------|-------------|
| H1 - Page Title | 2rem (32px) | 700 | 1.25 |
| H2 - Section | 1.5rem (24px) | 600 | 1.33 |
| H3 - Subsection | 1.125rem (18px) | 600 | 1.4 |
| Body - Default | 1rem (16px) | 400 | 1.5 |
| Body - Small | 0.875rem (14px) | 400 | 1.43 |
| Label | 0.875rem (14px) | 500 | 1.4 |
| Hint | 0.75rem (12px) | 400 | 1.5 |
| Caption | 0.75rem (12px) | 500 | 1.5 |

### Weight Usage

- **700 (Bold)**: Page titles, important headings
- **600 (Semibold)**: Section headers, card titles, labels
- **500 (Medium)**: Button text, strong emphasis
- **400 (Regular)**: Body text, default content

---

## Spacing & Layout

### Spacing Scale

```css
0.25rem (4px)   - xs
0.5rem (8px)    - sm
0.75rem (12px)  - md
1rem (16px)     - lg
1.5rem (24px)   - xl
2rem (32px)     - 2xl
2.5rem (40px)   - 3xl
3rem (48px)     - 4xl
```

### Grid System

The application uses a 12-column grid with 1rem (16px) gaps:

```jsx
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-12 md:col-span-6 lg:col-span-4">
    {/* Item */}
  </div>
</div>
```

### Responsive Breakpoints

| Breakpoint | Width | Device |
|-----------|-------|--------|
| Mobile | 320px - 639px | Phones |
| Tablet | 640px - 1023px | Tablets |
| Desktop | 1024px+ | Laptops, Desktops |

---

## Animations & Transitions

### Available Animations

All animations are defined in `tailwind.config.js` and can be applied with `animate-*` classes.

#### Entrance Animations

| Animation | Duration | Use Case |
|-----------|----------|----------|
| `animate-fade-in` | 0.3s | Content appearing, modals |
| `animate-slide-up` | 0.3s | Bottom sheet, notifications |
| `animate-slide-down` | 0.3s | Dropdown menus, headers |
| `animate-scale-in` | 0.3s | Modal content, popups |
| `animate-bounce-gentle` | 1s infinite | Attention-seeking elements |

#### Loading & Feedback Animations

| Animation | Duration | Use Case |
|-----------|----------|----------|
| `animate-pulse-soft` | 2s infinite | Loading states, placeholders |
| `animate-spin` | Linear infinite | Loading spinners |

#### Transitions

Use `transition-all` or `transition-{property}` with `duration-{time}`:

```jsx
{/* Smooth color/transform transitions */}
<button className="transition-all duration-250 hover:bg-primary hover:scale-105">
  Button
</button>

{/* Specific properties */}
<div className="transition-colors duration-200 hover:text-primary">
  Hover text
</div>
```

### Duration Recommendations

- **Fast**: 150ms - quick interactions, cursor feedback
- **Normal**: 250ms - button clicks, color changes
- **Slow**: 350ms - page transitions, complex animations
- **Very Slow**: 500ms+ - attention-grabbing animations

### Easing Functions

```css
ease-in         /* Starts slow, speeds up */
ease-out        /* Starts fast, slows down */
ease-in-out     /* Slow at both ends */
linear          /* Constant speed */
```

**Usage:**
- `ease-out` for most UI animations (feels more natural)
- `ease-in-out` for modal transitions
- `linear` for loaders and spinners

---

## Component Library

### Loading Components

#### LoadingSpinner

```jsx
import { LoadingSpinner } from '@/components/LoadingSpinner';

{/* Default spinner */}
<LoadingSpinner />

{/* With text */}
<LoadingSpinner text="Loading..." size="lg" />

{/* Full screen overlay */}
<LoadingSpinner fullScreen text="Please wait..." />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg'
- `text?`: string
- `fullScreen?`: boolean
- `className?`: string

#### SkeletonLoader

```jsx
import { SkeletonLoader } from '@/components/LoadingSpinner';

{/* Text skeleton - 3 lines */}
<SkeletonLoader lines={3} />

{/* Card skeleton */}
<CardSkeleton />
```

### Form Components

#### FormInput

Enhanced text input with validation, password toggle, and animations:

```jsx
import { FormInput } from '@/components/FormInput';

<FormInput
  label="Email"
  type="email"
  placeholder="user@example.com"
  error={errors.email?.message}
  success={!errors.email && value}
  hint="We'll never share your email"
  required
/>

{/* Password with toggle */}
<FormInput
  label="Password"
  type="password"
  showPasswordToggle
  error={errors.password?.message}
  hint="At least 8 characters"
/>

{/* Loading state */}
<FormInput isLoading placeholder="Checking availability..." />
```

**Props:**
- `label?`: string
- `error?`: string (shows error message with animation)
- `success?`: boolean (shows checkmark)
- `hint?`: string (helper text)
- `showPasswordToggle?`: boolean
- `isLoading?`: boolean

#### FormTextarea

Multi-line text input with character counter:

```jsx
import { FormTextarea } from '@/components/FormInput';

<FormTextarea
  label="Description"
  maxLength={500}
  placeholder="Enter description..."
  error={errors.description?.message}
/>
```

#### FormSelect

Dropdown select with consistent styling:

```jsx
import { FormSelect } from '@/components/FormInput';

<FormSelect
  label="Subject"
  options={[
    { value: 'math', label: 'Mathematics' },
    { value: 'english', label: 'English' },
  ]}
  error={errors.subject?.message}
/>
```

### Card Components

#### Basic Card

```jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

**Variants:**
- `default`: Standard card with border and shadow
- `elevated`: Card with stronger shadow (hover effect)
- `outline`: Borderonly card
- `ghost`: No border or background

#### Interactive Card

```jsx
<Card interactive onClick={handleClick}>
  Clickable content
</Card>
```

#### Stats Card

```jsx
import { StatsCard } from '@/components/Card';

<StatsCard
  label="Study Hours"
  value="24.5"
  change={{ value: 12, isPositive: true }}
  icon={<Clock className="h-4 w-4" />}
  description="Total hours studied this month"
/>
```

### Modal & Dialog Components

#### Modal

```jsx
import { Modal } from '@/components/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  description="Modal description"
  size="md"
>
  Modal content here
</Modal>
```

**Sizes:** sm | md | lg | xl

#### ConfirmDialog

```jsx
import { ConfirmDialog } from '@/components/Modal';

<ConfirmDialog
  isOpen={showConfirm}
  title="Delete Schedule"
  message="Are you sure? This action cannot be undone."
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
  isDangerous
  confirmText="Delete"
  cancelText="Cancel"
/>
```

---

## Form Design

### Form Structure

Always organize forms with proper structure:

```jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput, FormTextarea } from '@/components/FormInput';
import { Card, CardContent } from '@/components/Card';

// 1. Define validation schema
const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type FormData = z.infer<typeof schema>;

// 2. Create form component
export function MyForm() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await submitForm(data);
      // Success feedback
    } catch (error) {
      // Error handling
    }
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Email"
            type="email"
            placeholder="your@email.com"
            {...register('email')}
            error={errors.email?.message}
          />

          <FormInput
            label="Password"
            type="password"
            showPasswordToggle
            {...register('password')}
            error={errors.password?.message}
            hint="Use at least 8 characters for security"
          />

          <FormInput
            label="Full Name"
            {...register('name')}
            error={errors.name?.message}
          />

          <div className="flex gap-2 pt-4">
            <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-md">
              Submit
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="flex-1 px-4 py-2 border border-input rounded-md"
            >
              Reset
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Validation Feedback

Show validation feedback immediately:

```jsx
{/* Error message slides in with animation */}
{error && (
  <p className="text-xs text-destructive animate-slide-down">
    {error}
  </p>
)}

{/* Success feedback */}
{!error && value && (
  <p className="text-xs text-green-600">
    ✓ This looks good
  </p>
)}

{/* Helper hint */}
{hint && (
  <p className="text-xs text-muted-foreground">
    {hint}
  </p>
)}
```

---

## Accessibility

### WCAG Compliance

The application targets **WCAG 2.1 AA** compliance:

- ✅ Color contrast: 4.5:1 for normal text, 3:1 for large text
- ✅ Keyboard navigation: All interactive elements are keyboard accessible
- ✅ Screen reader support: Proper ARIA labels and semantic HTML
- ✅ Focus management: Clear focus indicators (ring-2 ring-ring)
- ✅ Motion: Respects `prefers-reduced-motion` preference

### Semantic HTML

Always use semantic elements:

```jsx
{/* ✅ GOOD: Semantic elements */}
<button>Submit</button>
<a href="/page">Link</a>
<form>Form content</form>
<section>Section content</section>
<nav>Navigation</nav>
<main>Main content</main>
<header>Header</header>
<footer>Footer</footer>

{/* ❌ AVOID: Using divs for buttons */}
<div onClick={handleClick} role="button">Click me</div>
```

### ARIA Labels

Use ARIA attributes for accessibility:

```jsx
{/* Form inputs */}
<label htmlFor="email">Email</label>
<input id="email" aria-describedby="email-hint" />
<p id="email-hint">We'll never share your email</p>

{/* Buttons */}
<button aria-label="Close dialog">×</button>

{/* Loading */}
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : 'Loaded'}
</div>

{/* Error messages */}
<input aria-invalid={!!error} aria-describedby="error" />
<p id="error" role="alert">{error}</p>
```

### Focus Management

Always show focus indicators:

```css
/* Global focus styles */
:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

In components:
```jsx
<button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
  Button
</button>
```

---

## Mobile Responsiveness

### Responsive Design Approach

Use mobile-first CSS and Tailwind breakpoints:

```jsx
{/* Mobile (320px) → Tablet (640px) → Desktop (1024px) */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</div>
```

### Viewport Sizes for Testing

Test on these common device sizes:

| Device | Width | Height |
|--------|-------|--------|
| iPhone SE | 375px | 812px |
| iPhone 14 | 390px | 844px |
| iPad | 810px | 1080px |
| Desktop | 1440px | 900px |
| Large Desktop | 1920px | 1080px |

### Touch-Friendly Design

On mobile, ensure:

- **Tap target size**: Minimum 44×44 pixels
- **Spacing**: At least 12px between interactive elements
- **Text size**: Minimum 16px to avoid zoom on iOS
- **Landscape support**: Test orientation changes

```jsx
{/* Good: Large tap targets */}
<button className="px-4 py-3 min-h-11">
  Tap me
</button>

{/* Good: Mobile-optimized form */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormInput label="First Name" />
  <FormInput label="Last Name" />
</div>
```

---

## Best Practices

### Do's ✅

- Use consistent spacing and alignment
- Provide clear visual feedback for interactions
- Use animations to guide user attention
- Show loading states for async operations
- Display helpful error messages with solutions
- Support keyboard navigation
- Test on real devices and browsers
- Use semantic HTML
- Optimize images and assets
- Lazy load heavy components

### Don'ts ❌

- Don't overuse animations (max 3 per interaction)
- Don't use color alone to convey information
- Don't make elements smaller than 44×44px for touch
- Don't forget about dark mode support
- Don't ignore contrast ratios
- Don't use flash or rapid animations
- Don't create auto-playing content
- Don't make forms difficult to fill
- Don't forget accessibility (a11y)
- Don't ship untested responsive designs

### Component Composition Example

```jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { FormInput } from '@/components/FormInput';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/Modal';

export function ScheduleForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              label="Exam Name (Edital)"
              placeholder="e.g., ENEM 2024"
              {...register('edital')}
              error={errors.edital?.message}
            />

            <FormInput
              label="Target Date"
              type="date"
              {...register('targetDate')}
              error={errors.targetDate?.message}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Create Schedule'}
            </button>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Schedule?"
        message="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        isDangerous
      />
    </>
  );
}
```

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Radix UI Components](https://radix-ui.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Accessibility by MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Design System Thinking](https://www.designsystems.com)

---

**Last Updated:** 2026-03-30
**Version:** 1.0
