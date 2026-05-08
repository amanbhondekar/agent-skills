'use client';

import { trpc } from '@/lib/trpc';
import { StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Users, GraduationCap, BookOpen, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate, statusBadge } from '@/lib/utils';

export function DashboardClient() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: recentStudents = [] } = trpc.dashboard.recentStudents.useQuery();
  const { data: recentFees = [] } = trpc.dashboard.recentFees.useQuery();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Overview</h2>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
          Welcome back. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={(stats?.students ?? 0).toLocaleString()}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Faculty Members"
          value={(stats?.faculty ?? 0).toLocaleString()}
          icon={<GraduationCap size={18} />}
        />
        <StatCard
          label="Active Courses"
          value={(stats?.courses ?? 0).toLocaleString()}
          icon={<BookOpen size={18} />}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats?.revenue ?? 0)}
          icon={<DollarSign size={18} />}
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--color-bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recent Students</h3>
          {recentStudents.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-6">No students yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recentStudents.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <Avatar name={s.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {s.department} · Year {s.year}
                    </p>
                  </div>
                  <Badge variant={s.status === 'active' ? 'success' : 'danger'} dot>
                    {s.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[var(--color-bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recent Transactions</h3>
          {recentFees.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-6">No transactions yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recentFees.map((f) => {
                const variant = statusBadge(f.status).replace('badge-', '') as 'success' | 'danger' | 'warning' | 'neutral';
                return (
                  <li key={f.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {f.student?.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {f.feeType} · {formatDate(f.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {formatCurrency(Number(f.amount))}
                      </p>
                      <Badge variant={variant} className="mt-0.5">{f.status}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
