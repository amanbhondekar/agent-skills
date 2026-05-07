'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  id: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, id, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'text-xs font-medium',
            error ? 'text-[var(--color-danger)]' : 'text-[var(--text-secondary)]',
          )}
        >
          {label}
          {props.required && <span className="text-[var(--color-danger)] ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          'w-full h-[38px] px-3 bg-[var(--color-bg-elevated)] border rounded-[var(--radius-md)]',
          'text-sm text-[var(--text-primary)]',
          'transition-colors duration-[var(--dur-fast)] cursor-pointer',
          'focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-brand-alpha-20)]',
          error
            ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger-alpha)]'
            : 'border-[var(--border-standard)] hover:border-[var(--border-prominent)]',
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-[var(--text-tertiary)]">
          {hint}
        </p>
      )}
    </div>
  ),
);

Select.displayName = 'Select';
