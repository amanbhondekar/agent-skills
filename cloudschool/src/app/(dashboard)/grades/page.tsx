import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table } from '@/components/ui/Table';

export const metadata: Metadata = { title: 'Grades' };

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const institutionId = (session?.user as { institutionId?: string })?.institutionId ?? '';
  const params = await searchParams;
  const semester = params.semester ?? '';

  const grades = await prisma.grade.findMany({
    where: {
      institutionId,
      ...(semester && { semester }),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      student: { select: { name: true, studentId: true } },
      course:  { select: { name: true, courseCode: true } },
    },
  });

  const semesters = await prisma.grade.findMany({
    where: { institutionId },
    select: { semester: true },
    distinct: ['semester'],
    orderBy: { semester: 'desc' },
  });

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (g: (typeof grades)[0]) => (
        <div className="flex items-center gap-3">
          <Avatar name={g.student?.name ?? ''} size="sm" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{g.student?.name}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{g.student?.studentId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course',
      render: (g: (typeof grades)[0]) => (
        <div>
          <p className="text-sm text-[var(--text-primary)]">{g.course?.name}</p>
          <p className="text-xs font-mono text-[var(--text-tertiary)]">{g.course?.courseCode}</p>
        </div>
      ),
    },
    {
      key: 'midterm',
      header: 'Midterm',
      render: (g: (typeof grades)[0]) => <span>{g.midterm != null ? Number(g.midterm).toFixed(1) : '—'}</span>,
    },
    {
      key: 'final',
      header: 'Final',
      render: (g: (typeof grades)[0]) => <span>{g.final != null ? Number(g.final).toFixed(1) : '—'}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      render: (g: (typeof grades)[0]) => (
        <span className="font-semibold">{g.total != null ? Number(g.total).toFixed(1) : '—'}</span>
      ),
    },
    {
      key: 'letterGrade',
      header: 'Grade',
      render: (g: (typeof grades)[0]) => (
        <span className="font-bold text-[var(--text-primary)]">{g.letterGrade ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (g: (typeof grades)[0]) => (
        <Badge
          variant={g.status === 'passed' ? 'success' : g.status === 'failed' ? 'danger' : 'neutral'}
          dot
        >
          {g.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Grades</h2>
          <p className="text-sm text-[var(--text-tertiary)]">{grades.length} records</p>
        </div>
        <select
          defaultValue={semester}
          className="h-[38px] px-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)]"
          aria-label="Filter by semester"
        >
          <option value="">All Semesters</option>
          {semesters.map((s: { semester: string }) => (
            <option key={s.semester} value={s.semester}>{s.semester}</option>
          ))}
        </select>
      </div>

      <div className="bg-[var(--color-bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden">
        <Table
          columns={columns}
          data={grades}
          keyExtractor={(g) => g.id}
          emptyMessage="No grade records found."
        />
      </div>
    </div>
  );
}
