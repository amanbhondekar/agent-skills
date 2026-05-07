import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--color-bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)]',
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ── Stat Card ──────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;
  footer?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, delta, footer, icon, className }: StatCardProps) {
  const isUp = delta !== undefined && delta >= 0;
  const isDown = delta !== undefined && delta < 0;

  return (
    <Card className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          {label}
        </p>
        {icon && (
          <span className="text-[var(--text-tertiary)]" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      {delta !== undefined && (
        <p
          className={cn(
            'text-xs font-medium',
            isUp && 'text-[var(--color-success)]',
            isDown && 'text-[var(--color-danger)]',
          )}
          aria-label={`${Math.abs(delta)}% ${isUp ? 'increase' : 'decrease'} from last month`}
        >
          {isUp ? '↑' : '↓'} {Math.abs(delta)}% vs last month
        </p>
      )}
      {footer && <p className="text-xs text-[var(--text-tertiary)] mt-auto">{footer}</p>}
    </Card>
  );
}
