import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { StatCard } from '@/components/ui/Card';
import { formatCurrency, formatDate, statusBadge } from '@/lib/utils';
import { DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const metadata: Metadata = { title: 'Fees' };

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const institutionId = (session?.user as { institutionId?: string })?.institutionId ?? '';
  const params = await searchParams;
  const statusFilter = params.status ?? '';

  const [fees, summary] = await Promise.all([
    prisma.feeTransaction.findMany({
      where: {
        institutionId,
        ...(statusFilter && { status: statusFilter as 'paid' | 'unpaid' | 'partial' | 'overdue' }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { student: { select: { name: true, studentId: true } } },
    }),
    prisma.feeTransaction.aggregate({
      where: { institutionId },
      _sum: { amount: true, paid: true, due: true },
      _count: true,
    }),
  ]);

  const statusCounts = await prisma.feeTransaction.groupBy({
    by: ['status'],
    where: { institutionId },
    _count: true,
  });
  const countMap = Object.fromEntries(statusCounts.map((s: { status: string; _count: number }) => [s.status, s._count]));

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (f: (typeof fees)[0]) => (
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
      render: (f: (typeof fees)[0]) => formatCurrency(Number(f.amount)),
    },
    {
      key: 'paid',
      header: 'Paid',
      render: (f: (typeof fees)[0]) => (
        <span className="text-[var(--color-success)]">{formatCurrency(Number(f.paid))}</span>
      ),
    },
    {
      key: 'due',
      header: 'Due',
      render: (f: (typeof fees)[0]) => (
        <span className={Number(f.due) > 0 ? 'text-[var(--color-danger)]' : ''}>
          {formatCurrency(Number(f.due))}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (f: (typeof fees)[0]) => formatDate(f.dueDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (f: (typeof fees)[0]) => {
        const v = statusBadge(f.status).replace('badge-', '') as 'success' | 'danger' | 'warning' | 'neutral';
        return <Badge variant={v} dot>{f.status}</Badge>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Fee Management</h2>
        <p className="text-sm text-[var(--text-tertiary)]">{summary._count} transactions</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Billed"
          value={formatCurrency(Number(summary._sum.amount ?? 0))}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(Number(summary._sum.paid ?? 0))}
          icon={<CheckCircle size={18} />}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(Number(summary._sum.due ?? 0))}
          icon={<AlertCircle size={18} />}
        />
        <StatCard
          label="Overdue"
          value={String(countMap['overdue'] ?? 0)}
          icon={<Clock size={18} />}
        />
      </div>

      <div className="bg-[var(--color-bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden">
        <Table
          columns={columns}
          data={fees}
          keyExtractor={(f) => f.id}
          emptyMessage="No fee records found."
        />
      </div>
    </div>
  );
}
