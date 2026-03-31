import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  showPasswordToggle?: boolean;
  isLoading?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      showPasswordToggle = false,
      isLoading = false,
      type = 'text',
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = showPasswordToggle && showPassword ? 'text' : type;

    return (
      <div className='w-full space-y-2'>
        {label && (
          <label className='block text-sm font-medium text-foreground'>
            {label}
            {props.required && <span className='text-destructive ml-1'>*</span>}
          </label>
        )}

        <div className='relative'>
          {/* Input field with validation states */}
          <input
            ref={ref}
            type={inputType}
            disabled={disabled || isLoading}
            className={cn(
              'w-full px-3 py-2 border rounded-md',
              'text-sm font-medium',
              'bg-background text-foreground',
              'placeholder:text-muted-foreground',
              'transition-all duration-250',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              // Border color based on state
              error
                ? 'border-destructive focus:ring-destructive/50'
                : success
                  ? 'border-green-500 focus:ring-green-500/50'
                  : 'border-input focus:border-primary focus:ring-primary/50',
              // Disabled state
              disabled && 'opacity-50 cursor-not-allowed',
              // Animation on focus
              'focus:animate-scale-in',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.name}-error` : hint ? `${props.name}-hint` : undefined}
            {...props}
          />

          {/* Success icon - slides in from right */}
          {success && !error && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 animate-slide-down'>
              <CheckCircle2 className='h-4 w-4 text-green-500' />
            </div>
          )}

          {/* Error icon - slides in from right */}
          {error && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 animate-slide-down'>
              <AlertCircle className='h-4 w-4 text-destructive' />
            </div>
          )}

          {/* Password toggle button */}
          {showPasswordToggle && type === 'password' && (
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              disabled={disabled}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'text-muted-foreground hover:text-foreground',
                'transition-colors duration-200',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className='h-4 w-4' />
              ) : (
                <Eye className='h-4 w-4' />
              )}
            </button>
          )}

          {/* Loading spinner overlay */}
          {isLoading && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2'>
              <div className='h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin' />
            </div>
          )}
        </div>

        {/* Error message with animation */}
        {error && (
          <p
            id={`${props.name}-error`}
            className='text-xs font-medium text-destructive animate-slide-down'
          >
            {error}
          </p>
        )}

        {/* Hint text */}
        {hint && !error && (
          <p
            id={`${props.name}-hint`}
            className='text-xs text-muted-foreground animate-fade-in'
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

// Textarea component with similar styling
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, hint, maxLength, className, ...props }, ref) => {
    const [charCount, setCharCount] = React.useState(0);

    return (
      <div className='w-full space-y-2'>
        {label && (
          <label className='block text-sm font-medium text-foreground'>
            {label}
            {props.required && <span className='text-destructive ml-1'>*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          maxLength={maxLength}
          onChange={(e) => {
            setCharCount(e.target.value.length);
            props.onChange?.(e);
          }}
          className={cn(
            'w-full px-3 py-2 border rounded-md',
            'text-sm font-medium',
            'bg-background text-foreground',
            'placeholder:text-muted-foreground',
            'transition-all duration-250',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'min-h-[100px] resize-none',
            error
              ? 'border-destructive focus:ring-destructive/50'
              : 'border-input focus:border-primary focus:ring-primary/50',
            'focus:animate-scale-in',
            className
          )}
          aria-invalid={!!error}
          {...props}
        />

        <div className='flex items-center justify-between'>
          {error && (
            <p className='text-xs font-medium text-destructive animate-slide-down'>
              {error}
            </p>
          )}
          {!error && hint && (
            <p className='text-xs text-muted-foreground animate-fade-in'>
              {hint}
            </p>
          )}
          {maxLength && (
            <p className={cn('text-xs font-medium', charCount === maxLength && 'text-destructive')}>
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

// Select component with better styling
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, hint, options, className, ...props }, ref) => {
    return (
      <div className='w-full space-y-2'>
        {label && (
          <label className='block text-sm font-medium text-foreground'>
            {label}
            {props.required && <span className='text-destructive ml-1'>*</span>}
          </label>
        )}

        <select
          ref={ref}
          className={cn(
            'w-full px-3 py-2 border rounded-md',
            'text-sm font-medium',
            'bg-background text-foreground',
            'transition-all duration-250',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            error
              ? 'border-destructive focus:ring-destructive/50'
              : 'border-input focus:border-primary focus:ring-primary/50',
            'focus:animate-scale-in',
            'cursor-pointer',
            className
          )}
          aria-invalid={!!error}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className='text-xs font-medium text-destructive animate-slide-down'>
            {error}
          </p>
        )}
        {!error && hint && (
          <p className='text-xs text-muted-foreground animate-fade-in'>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
