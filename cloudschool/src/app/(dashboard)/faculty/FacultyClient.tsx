'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/utils';

export function FacultyClient() {
  const [dept, setDept] = useState('');

  const { data: result, isLoading } = trpc.faculty.list.useQuery({
    page: 1, pageSize: 200,
    dept: dept || undefined,
  });

  const { data: departments = [] } = trpc.faculty.departments.useQuery();

  const items = result?.data ?? [];
  type FacultyItem = (typeof items)[number];

  const byDept = items.reduce<Record<string, FacultyItem[]>>((acc, f) => {
    (acc[f.department] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Faculty</h2>
          <p className="text-sm text-[var(--text-tertiary)]">{result?.total ?? 0} members</p>
        </div>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          aria-label="Filter by department"
          className="h-[38px] px-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-[var(--text-tertiary)]">No faculty members yet.</p>
        </div>
      ) : (
        Object.entries(byDept).map(([deptName, members]) => (
          <section key={deptName}>
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
              {deptName} · {members.length}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((f) => (
                <Card key={f.id} padding="md" className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={f.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{f.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{f.designation}</p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">{f.email}</p>
                    </div>
                    <Badge variant={f.status === 'active' ? 'success' : 'danger'} dot>
                      {f.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)]">Salary</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {formatCurrency(Number(f.salary))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-tertiary)]">Joined</p>
                      <p className="text-xs text-[var(--text-secondary)]">{formatDate(f.joinDate)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
