import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-[var(--color-success-alpha)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-alpha)] text-[var(--color-warning)]',
  danger:  'bg-[var(--color-danger-alpha)] text-[var(--color-danger)]',
  info:    'bg-[var(--color-info-alpha)] text-[var(--color-info)]',
  neutral: 'bg-[var(--color-bg-elevated)] text-[var(--text-secondary)]',
  brand:   'bg-[var(--color-brand-alpha-20)] text-[var(--text-brand)]',
};

export function Badge({ variant = 'neutral', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[var(--radius-pill)]',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
