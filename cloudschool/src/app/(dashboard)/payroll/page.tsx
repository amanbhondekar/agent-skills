import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { StatCard } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';

export const metadata: Metadata = { title: 'Payroll' };

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const institutionId = (session?.user as { institutionId?: string })?.institutionId ?? '';
  const params = await searchParams;
  const monthFilter  = params.month ?? '';
  const statusFilter = params.status ?? '';

  const [entries, summary] = await Promise.all([
    prisma.payrollEntry.findMany({
      where: {
        institutionId,
        ...(monthFilter  && { month: monthFilter }),
        ...(statusFilter && { status: statusFilter as 'paid' | 'pending' | 'processing' }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        faculty: { select: { name: true, department: true, designation: true } },
      },
    }),
    prisma.payrollEntry.aggregate({
      where: { institutionId },
      _sum: { netSalary: true },
      _count: true,
    }),
  ]);

  const paidTotal = await prisma.payrollEntry.aggregate({
    where: { institutionId, status: 'paid' },
    _sum: { netSalary: true },
  });

  const columns = [
    {
      key: 'faculty',
      header: 'Faculty',
      render: (e: (typeof entries)[0]) => (
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{e.faculty?.name}</p>
          <p className="text-xs text-[var(--text-tertiary)]">{e.faculty?.designation}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (e: (typeof entries)[0]) => e.faculty?.department ?? '—',
    },
    { key: 'month', header: 'Month' },
    {
      key: 'baseSalary',
      header: 'Base',
      render: (e: (typeof entries)[0]) => formatCurrency(Number(e.baseSalary)),
    },
    {
      key: 'allowances',
      header: 'Allowances',
      render: (e: (typeof entries)[0]) => (
        <span className="text-[var(--color-success)]">+{formatCurrency(Number(e.allowances))}</span>
      ),
    },
    {
      key: 'deductions',
      header: 'Deductions',
      render: (e: (typeof entries)[0]) => (
        <span className="text-[var(--color-danger)]">-{formatCurrency(Number(e.deductions))}</span>
      ),
    },
    {
      key: 'netSalary',
      header: 'Net',
      render: (e: (typeof entries)[0]) => (
        <span className="font-semibold">{formatCurrency(Number(e.netSalary))}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e: (typeof entries)[0]) => (
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
      render: (e: (typeof entries)[0]) => e.paidDate ? formatDate(e.paidDate) : '—',
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Payroll</h2>
        <p className="text-sm text-[var(--text-tertiary)]">{summary._count} entries</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Payroll"
          value={formatCurrency(Number(summary._sum.netSalary ?? 0))}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Disbursed"
          value={formatCurrency(Number(paidTotal._sum.netSalary ?? 0))}
          icon={<CheckCircle size={18} />}
        />
        <StatCard
          label="Pending"
          value={formatCurrency(Number(summary._sum.netSalary ?? 0) - Number(paidTotal._sum.netSalary ?? 0))}
          icon={<Clock size={18} />}
        />
      </div>

      <div className="bg-[var(--color-bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden">
        <Table
          columns={columns}
          data={entries}
          keyExtractor={(e) => e.id}
          emptyMessage="No payroll entries found."
        />
      </div>
    </div>
  );
}
