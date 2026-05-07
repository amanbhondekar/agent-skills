'use client';

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  id: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, id, className, ...props }, ref) => (
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
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            'w-full h-[38px] px-3 bg-[var(--color-bg-elevated)] border rounded-[var(--radius-md)]',
            'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
            'transition-colors duration-[var(--dur-fast)]',
            'focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-brand-alpha-20)]',
            error
              ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger-alpha)]'
              : 'border-[var(--border-standard)] hover:border-[var(--border-prominent)]',
            icon && 'pl-9',
            className,
          )}
          {...props}
        />
      </div>
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

Input.displayName = 'Input';
