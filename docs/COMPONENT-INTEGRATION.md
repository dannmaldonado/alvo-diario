# Component Integration Guide 🚀

Quick reference for integrating new UX/UI components and patterns into pages.

## Table of Contents

1. [Loading States](#loading-states)
2. [Form Integration](#form-integration)
3. [Modal & Dialog](#modal--dialog)
4. [Card Components](#card-components)
5. [Animations](#animations)
6. [Dark Mode](#dark-mode)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Loading States

### Page Loading

When a page is code-split with `React.lazy()`, it uses `PageLoader` as a fallback:

```jsx
// App.tsx - Already configured
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));

<Suspense fallback={<PageLoader />}>
  <DashboardPage />
</Suspense>
```

### Inline Loading Spinner

```jsx
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Basic spinner
<LoadingSpinner size="md" />

// With text
<LoadingSpinner size="lg" text="Processing your schedule..." />

// Full screen overlay (for critical operations)
<LoadingSpinner fullScreen text="Saving changes..." />
```

### Skeleton Placeholders

```jsx
import { SkeletonLoader, CardSkeleton } from '@/components/LoadingSpinner';

// For text content
<SkeletonLoader lines={5} />

// For card layout
<div className="grid grid-cols-3 gap-4">
  {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
</div>
```

---

## Form Integration

### Complete Form Example

```jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput, FormTextarea, FormSelect } from '@/components/FormInput';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// 1. Define validation schema
const scheduleSchema = z.object({
  edital: z.string().min(2, 'Exam name is required'),
  targetDate: z.string().min(1, 'Target date is required'),
  subjects: z.string().min(1, 'Select at least one subject'),
  notes: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

// 2. Create form component
export function CreateScheduleForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
  });

  // 3. Handle form submission
  const onSubmit = async (data: ScheduleFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Call API
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create schedule');

      // Success feedback
      reset();
      // Show success message to user
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Schedule</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Error message */}
          {submitError && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive font-medium">{submitError}</p>
            </div>
          )}

          {/* Form fields */}
          <FormInput
            label="Exam Name (Edital)"
            placeholder="e.g., ENEM 2024"
            {...register('edital')}
            error={errors.edital?.message}
            hint="Enter the official exam name"
            isLoading={isSubmitting}
          />

          <FormInput
            label="Target Date"
            type="date"
            {...register('targetDate')}
            error={errors.targetDate?.message}
            isLoading={isSubmitting}
          />

          <FormSelect
            label="Primary Subject"
            options={[
              { value: 'math', label: 'Mathematics' },
              { value: 'portuguese', label: 'Portuguese' },
              { value: 'science', label: 'Science' },
            ]}
            {...register('subjects')}
            error={errors.subjects?.message}
          />

          <FormTextarea
            label="Notes (Optional)"
            placeholder="Add any additional information..."
            maxLength={500}
            {...register('notes')}
            error={errors.notes?.message}
          />

          {/* Submit button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => reset()}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Schedule'
              )}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Individual Form Fields

```jsx
// Email input
<FormInput
  label="Email Address"
  type="email"
  placeholder="your@email.com"
  {...register('email')}
  error={errors.email?.message}
  hint="We'll use this to send you updates"
/>

// Password with toggle
<FormInput
  label="Password"
  type="password"
  showPasswordToggle
  {...register('password')}
  error={errors.password?.message}
  hint="At least 8 characters with a mix of letters and numbers"
/>

// Number input
<FormInput
  label="Study Hours"
  type="number"
  min="0"
  max="24"
  step="0.5"
  {...register('studyHours', { valueAsNumber: true })}
  error={errors.studyHours?.message}
/>

// Textarea with counter
<FormTextarea
  label="Study Goals"
  maxLength={1000}
  placeholder="What do you want to achieve?"
  {...register('goals')}
  error={errors.goals?.message}
/>
```

---

## Modal & Dialog

### Basic Modal

```jsx
import { useState } from 'react';
import { Modal } from '@/components/Modal';

export function ScheduleDetails() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        View Details
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Schedule Details"
        description="View your exam schedule information"
        size="md"
      >
        <div className="space-y-3">
          <p><strong>Exam:</strong> ENEM 2024</p>
          <p><strong>Target Date:</strong> November 10, 2024</p>
          <p><strong>Days Remaining:</strong> 45 days</p>
        </div>
      </Modal>
    </>
  );
}
```

### Confirmation Dialog

```jsx
import { useState } from 'react';
import { ConfirmDialog } from '@/components/Modal';

export function DeleteSchedule({ scheduleId }: { scheduleId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    await fetch(`/api/schedules/${scheduleId}`, { method: 'DELETE' });
    // Handle success
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-destructive"
      >
        Delete Schedule
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule? This action cannot be undone and all associated study data will be lost."
        onConfirm={handleDelete}
        onCancel={() => setIsOpen(false)}
        isDangerous
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}
```

---

## Card Components

### Basic Card

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/Card';

<Card>
  <CardHeader>
    <CardTitle>Study Progress</CardTitle>
    <CardDescription>Your progress this week</CardDescription>
  </CardHeader>

  <CardContent>
    <p>You've completed 45 of 100 study sessions</p>
  </CardContent>

  <CardFooter>
    <button className="text-sm text-primary hover:underline">View details</button>
  </CardFooter>
</Card>
```

### Interactive Card

```jsx
<Card
  interactive
  onClick={() => navigate(`/schedules/${schedule.id}`)}
  className="cursor-pointer"
>
  <h3 className="text-lg font-semibold">{schedule.edital}</h3>
  <p className="text-sm text-muted-foreground">
    Target: {schedule.targetDate}
  </p>
</Card>
```

### Stats Card

```jsx
import { StatsCard } from '@/components/Card';
import { Clock, Flame, Target } from 'lucide-react';

<div className="grid grid-cols-3 gap-4">
  <StatsCard
    label="Total Hours"
    value="124.5"
    change={{ value: 15, isPositive: true }}
    icon={<Clock className="h-5 w-5" />}
    description="Hours studied this month"
  />

  <StatsCard
    label="Current Streak"
    value="12"
    change={{ value: 8, isPositive: true }}
    icon={<Flame className="h-5 w-5" />}
    description="Days in a row"
  />

  <StatsCard
    label="Subjects"
    value="5"
    icon={<Target className="h-5 w-5" />}
    description="Active subjects"
  />
</div>
```

---

## Animations

### Using Animation Classes

All animations are defined in `tailwind.config.js` and use Tailwind classes:

```jsx
// Fade animation
<div className="animate-fade-in">Content appears smoothly</div>

// Slide animations
<div className="animate-slide-up">Content slides up</div>
<div className="animate-slide-down">Content slides down</div>

// Scale animation
<div className="animate-scale-in">Content scales in</div>

// Pulse animation
<div className="animate-pulse-soft">Subtle pulse effect</div>

// Bounce animation
<div className="animate-bounce-gentle">Gentle bounce</div>
```

### Custom Animations

Create custom animations by combining classes:

```jsx
// Staggered animations
<div className="space-y-4">
  {items.map((item, i) => (
    <div
      key={item.id}
      className="animate-slide-up"
      style={{ animationDelay: `${i * 100}ms` }}
    >
      {item.name}
    </div>
  ))}
</div>

// Combined animations
<div className="animate-fade-in animate-slide-up">
  Content with multiple animations
</div>
```

### Transitions

Use `transition-*` classes for smooth state changes:

```jsx
<button className="transition-all duration-250 hover:bg-primary hover:scale-105 active:scale-95">
  Interactive Button
</button>

<div className="transition-colors duration-200 hover:text-primary">
  Hover text
</div>
```

---

## Dark Mode

Dark mode is automatic based on system preference and can be toggled:

```jsx
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md hover:bg-accent"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

### Dark Mode Specific Styles

```jsx
// Use dark: prefix for dark-mode-specific styles
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
  Content that changes in dark mode
</div>

// For components
<Card className="dark:shadow-2xl">
  Card with enhanced shadow in dark mode
</Card>
```

---

## Common Patterns

### Loading Page Content

```jsx
import { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/Card';

export function ScheduleList() {
  const [schedules, setSchedules] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const response = await fetch('/api/schedules');
        if (!response.ok) throw new Error('Failed to load schedules');
        const data = await response.json();
        setSchedules(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchedules();
  }, []);

  if (isLoading) return <LoadingSpinner text="Loading your schedules..." />;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!schedules?.length) return <div>No schedules found</div>;

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => (
        <Card key={schedule.id} interactive>
          {schedule.edital}
        </Card>
      ))}
    </div>
  );
}
```

### Form with Async Validation

```jsx
<FormInput
  label="Email"
  type="email"
  placeholder="your@email.com"
  {...register('email')}
  error={errors.email?.message}
  success={!errors.email && email}
  isLoading={isCheckingEmail}
  onBlur={async () => {
    setIsCheckingEmail(true);
    const exists = await checkEmailExists(email);
    if (exists) {
      // Show error
    }
    setIsCheckingEmail(false);
  }}
/>
```

### Success/Error Notifications

```jsx
import { useEffect, useState } from 'react';

export function FormWithFeedback() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (data: FormData) => {
    try {
      await submitForm(data);
      setFeedback({ type: 'success', message: 'Schedule created successfully!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to create schedule' });
    }
  };

  return (
    <>
      {feedback && (
        <div
          className={cn(
            'p-4 rounded-md mb-4 animate-slide-down',
            feedback.type === 'success'
              ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200'
              : 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200'
          )}
        >
          {feedback.message}
        </div>
      )}
      {/* Form content */}
    </>
  );
}
```

---

## Troubleshooting

### Components Not Rendering

**Problem:** Component doesn't appear on page
- Check that `forwardRef` is used for form components
- Verify import path is correct: `@/components/ComponentName`
- Ensure component is exported from file

### Animations Stuttering

**Problem:** Animations are janky or laggy
- Use `transition-all duration-250` instead of longer durations
- Avoid animating large DOM trees
- Check for `prefers-reduced-motion` preference
- Profile with DevTools (Performance tab)

**Solution:**
```jsx
// Smooth animation with proper duration
<div className="transition-all duration-250 hover:scale-105">
  Content
</div>

// Respect reduced motion preference (handled in CSS)
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

### Dark Mode Not Working

**Problem:** Dark mode colors not applying
- Check that `next-themes` provider is in root layout
- Verify `darkMode: ["class"]` in tailwind.config.js
- Clear browser cache
- Check system dark mode preference

### Form Validation Not Showing

**Problem:** Error messages don't appear
- Ensure schema is defined with `z.object()`
- Verify `zodResolver(schema)` is passed to `useForm()`
- Check that field name in `register()` matches schema key
- Verify error message is being accessed: `errors.fieldName?.message`

### Mobile Layout Issues

**Problem:** Layout breaks on mobile
- Test with `md:` and `lg:` Tailwind breakpoints
- Use mobile-first CSS: default is mobile, then add `md:` for larger screens
- Check form fields have min height of 44px for touch
- Test on actual devices, not just DevTools

---

**Last Updated:** 2026-03-30
**Version:** 1.0
