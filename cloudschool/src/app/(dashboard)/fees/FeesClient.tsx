'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import { Table, Pagination } from '@/components/ui/Table';
import { StatCard } from '@/components/ui/Card';
import { formatCurrency, formatDate, statusBadge } from '@/lib/utils';
import { DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function FeesClient() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'paid' | 'unpaid' | 'partial' | 'overdue' | ''>('');
  const [semester, setSemester] = useState('');

  const { data: result, isLoading } = trpc.fee.list.useQuery({
    page, pageSize: 20,
    status: status || undefined,
    semester: semester || undefined,
  });

  const { data: summary } = trpc.fee.summary.useQuery();

  const fees = result?.data ?? [];
  const totalPages = result?.totalPages ?? 1;

  type Fee = (typeof fees)[number];

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (f: Fee) => (
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{f.student?.name}</p>
          <p className="text-xs text-[var(--text-tertiary)]">{f.student?.studentId}</p>
        </div>
      ),
    },
    { key: 'feeType',  header: 'Type' },
    { key: 'semester', header: 'Semester' },
    {
      key: 'amount',
      header: 'Amount',
      render: (f: Fee) => formatCurrency(Number(f.amount)),
    },
    {
      key: 'paid',
      header: 'Paid',
      render: (f: Fee) => (
        <span className="text-[var(--color-success)]">{formatCurrency(Number(f.paid))}</span>
      ),
    },
    {
      key: 'due',
      header: 'Due',
      render: (f: Fee) => (
        <span className={Number(f.due) > 0 ? 'text-[var(--color-danger)]' : ''}>
          {formatCurrency(Number(f.due))}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (f: Fee) => formatDate(f.dueDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (f: Fee) => {
        const v = statusBadge(f.status).replace('badge-', '') as 'success' | 'danger' | 'warning' | 'neutral';
        return <Badge variant={v} dot>{f.status}</Badge>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Fee Management</h2>
          <p className="text-sm text-[var(--text-tertiary)]">{summary?.count ?? 0} transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}
            aria-label="Filter by status"
            className="h-[38px] px-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Billed"
          value={formatCurrency(summary?.totalBilled ?? 0)}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(summary?.totalCollected ?? 0)}
          icon={<CheckCircle size={18} />}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(summary?.totalDue ?? 0)}
          icon={<AlertCircle size={18} />}
        />
        <StatCard
          label="Overdue"
          value={String(summary?.overdueCount ?? 0)}
          icon={<Clock size={18} />}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-[var(--color-bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden">
            <Table
              columns={columns}
              data={fees}
              keyExtractor={(f) => f.id}
              emptyMessage="No fee records found."
            />
          </div>
          {totalPages > 1 && (
            <div className="flex justify-end px-4 pb-3">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
