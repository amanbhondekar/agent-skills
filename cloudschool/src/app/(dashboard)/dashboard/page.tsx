import type { Metadata } from 'next';
import type { Student, FeeTransaction } from '@/generated/prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Users, GraduationCap, BookOpen, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate, statusBadge } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard' };

async function getDashboardData(institutionId: string) {
  const [students, faculty, courses, fees, recentStudents, recentFees] = await Promise.all([
    prisma.student.count({ where: { institutionId } }),
    prisma.faculty.count({ where: { institutionId } }),
    prisma.course.count({ where: { institutionId } }),
    prisma.feeTransaction.aggregate({
      where: { institutionId },
      _sum: { paid: true },
    }),
    prisma.student.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, department: true, year: true, status: true, createdAt: true },
    }),
    prisma.feeTransaction.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { student: { select: { name: true } } },
    }),
  ]);

  return {
    stats: {
      students,
      faculty,
      courses,
      revenue: Number(fees._sum.paid ?? 0),
    },
    recentStudents,
    recentFees,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const institutionId = (session?.user as { institutionId?: string })?.institutionId ?? '';

  const { stats, recentStudents, recentFees } = await getDashboardData(institutionId);

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
          value={stats.students.toLocaleString()}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Faculty Members"
          value={stats.faculty.toLocaleString()}
          icon={<GraduationCap size={18} />}
        />
        <StatCard
          label="Active Courses"
          value={stats.courses.toLocaleString()}
          icon={<BookOpen size={18} />}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.revenue)}
          icon={<DollarSign size={18} />}
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent enrollments */}
        <div className="bg-[var(--color-bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recent Students</h3>
          {recentStudents.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-6">No students yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recentStudents.map((s: Pick<Student, 'id'|'name'|'department'|'year'|'status'|'createdAt'>) => (
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

        {/* Recent fees */}
        <div className="bg-[var(--color-bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recent Transactions</h3>
          {recentFees.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-6">No transactions yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recentFees.map((f: FeeTransaction & { student: { name: string } | null }) => {
                const statusClass = statusBadge(f.status);
                const variant = statusClass.replace('badge-', '') as 'success' | 'danger' | 'warning' | 'neutral';
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
