'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, Pagination } from '@/components/ui/Table';

export function GradesClient() {
  const [page, setPage] = useState(1);
  const [semester, setSemester] = useState('');

  const { data: result, isLoading } = trpc.grade.list.useQuery({
    page, pageSize: 20,
    semester: semester || undefined,
  });

  const { data: semesters = [] } = trpc.grade.semesters.useQuery();

  const grades = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  type Grade = (typeof grades)[number];

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (g: Grade) => (
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
      render: (g: Grade) => (
        <div>
          <p className="text-sm text-[var(--text-primary)]">{g.course?.name}</p>
          <p className="text-xs font-mono text-[var(--text-tertiary)]">{g.course?.courseCode}</p>
        </div>
      ),
    },
    {
      key: 'midterm',
      header: 'Midterm',
      render: (g: Grade) => <span>{g.midterm != null ? Number(g.midterm).toFixed(1) : '—'}</span>,
    },
    {
      key: 'final',
      header: 'Final',
      render: (g: Grade) => <span>{g.final != null ? Number(g.final).toFixed(1) : '—'}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      render: (g: Grade) => (
        <span className="font-semibold">{g.total != null ? Number(g.total).toFixed(1) : '—'}</span>
      ),
    },
    {
      key: 'letterGrade',
      header: 'Grade',
      render: (g: Grade) => (
        <span className="font-bold text-[var(--text-primary)]">{g.letterGrade ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (g: Grade) => (
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
          <p className="text-sm text-[var(--text-tertiary)]">{total} records</p>
        </div>
        <select
          value={semester}
          onChange={(e) => { setSemester(e.target.value); setPage(1); }}
          className="h-[38px] px-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
          aria-label="Filter by semester"
        >
          <option value="">All Semesters</option>
          {semesters.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
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
              data={grades}
              keyExtractor={(g) => g.id}
              emptyMessage="No grade records found."
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
