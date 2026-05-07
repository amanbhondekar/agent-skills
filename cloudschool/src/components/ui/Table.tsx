import { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  srOnly?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage = 'No records found.', className }: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border-standard)]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide whitespace-nowrap',
                  col.srOnly && 'sr-only',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-[var(--text-tertiary)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="border-b border-[var(--border-subtle)] hover:bg-[var(--color-bg-elevated)] transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 text-[var(--text-primary)] whitespace-nowrap', col.className)}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ── Pagination ─────────────────────────────────────────────── */
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-1', className)}>
      <PageBtn onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page">
        ‹
      </PageBtn>
      {pages.map((p) => (
        <PageBtn
          key={p}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={p === page ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]' : ''}
        >
          {p}
        </PageBtn>
      ))}
      <PageBtn onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
        ›
      </PageBtn>
    </nav>
  );
}

function PageBtn({ className, ...props }: HTMLAttributes<HTMLButtonElement> & { disabled?: boolean }) {
  return (
    <button
      className={cn(
        'w-8 h-8 flex items-center justify-center text-sm rounded-[var(--radius-md)]',
        'border border-[var(--border-standard)] text-[var(--text-secondary)]',
        'hover:border-[var(--border-prominent)] hover:text-[var(--text-primary)] transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
}
