'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import { Table, Pagination } from '@/components/ui/Table';
import { StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, CheckCircle, Clock, Play } from 'lucide-react';

export function PayrollClient() {
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState('');
  const [status, setStatus] = useState<'paid' | 'pending' | 'processing' | ''>('');
  const { toast } = useToast();

  const { data: result, isLoading } = trpc.payroll.list.useQuery({
    page, pageSize: 20,
    month: month || undefined,
    status: status || undefined,
  });

  const { data: summary } = trpc.payroll.summary.useQuery();
  const { data: months = [] } = trpc.payroll.months.useQuery();

  const utils = trpc.useUtils();

  const runPayrollMutation = trpc.payroll.runPayroll.useMutation({
    onSuccess: (res) => {
      toast('success', `Payroll run: ${res.created} created, ${res.skipped} skipped.`);
      utils.payroll.list.invalidate();
      utils.payroll.summary.invalidate();
    },
    onError: (e) => toast('error', e.message),
  });

  const markAllPaidMutation = trpc.payroll.markAllPaid.useMutation({
    onSuccess: (res) => {
      toast('success', `${res.updated} entries marked as paid.`);
      utils.payroll.list.invalidate();
      utils.payroll.summary.invalidate();
    },
    onError: (e) => toast('error', e.message),
  });

  const entries = result?.data ?? [];
  const totalPages = result?.totalPages ?? 1;

  const currentMonth = new Date().toISOString().slice(0, 7);

  type Entry = (typeof entries)[number];

  const columns = [
    {
      key: 'faculty',
      header: 'Faculty',
      render: (e: Entry) => (
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{e.faculty?.name}</p>
          <p className="text-xs text-[var(--text-tertiary)]">{e.faculty?.designation}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (e: Entry) => e.faculty?.department ?? '—',
    },
    { key: 'month', header: 'Month' },
    {
      key: 'baseSalary',
      header: 'Base',
      render: (e: Entry) => formatCurrency(Number(e.baseSalary)),
    },
    {
      key: 'allowances',
      header: 'Allowances',
      render: (e: Entry) => (
        <span className="text-[var(--color-success)]">+{formatCurrency(Number(e.allowances))}</span>
      ),
    },
    {
      key: 'deductions',
      header: 'Deductions',
      render: (e: Entry) => (
        <span className="text-[var(--color-danger)]">-{formatCurrency(Number(e.deductions))}</span>
      ),
    },
    {
      key: 'netSalary',
      header: 'Net',
      render: (e: Entry) => (
        <span className="font-semibold">{formatCurrency(Number(e.netSalary))}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e: Entry) => (
        <Badge
          variant={e.status === 'paid' ? 'success' : e.status === 'processing' ? 'info' : 'warning'}
          dot
        >
          {e.status}
        </Badge>
      ),
    },
    {
      key: 'paidDate',
      header: 'Paid On',
      render: (e: Entry) => e.paidDate ? formatDate(e.paidDate) : '—',
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Payroll</h2>
          <p className="text-sm text-[var(--text-tertiary)]">{summary?.count ?? 0} entries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => runPayrollMutation.mutate({ month: currentMonth })}
            loading={runPayrollMutation.isPending}
          >
            <Play size={14} /> Run {currentMonth}
          </Button>
          {month && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllPaidMutation.mutate({ month })}
              loading={markAllPaidMutation.isPending}
            >
              Mark All Paid
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Payroll"
          value={formatCurrency(summary?.totalPayroll ?? 0)}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Disbursed"
          value={formatCurrency(summary?.disbursed ?? 0)}
          icon={<CheckCircle size={18} />}
        />
        <StatCard
          label="Pending"
          value={formatCurrency(summary?.pending ?? 0)}
          icon={<Clock size={18} />}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <select
          value={month}
          onChange={(e) => { setMonth(e.target.value); setPage(1); }}
          aria-label="Filter by month"
          className="h-[38px] px-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
        >
          <option value="">All Months</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}
          aria-label="Filter by status"
          className="h-[38px] px-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
        </select>
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
              data={entries}
              keyExtractor={(e) => e.id}
              emptyMessage="No payroll entries found."
            />
          </div>
          {totalPages > 1 && (
            <div className="flex justify-end">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
