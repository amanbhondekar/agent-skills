'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Table';
import { BookOpen, Users, Clock } from 'lucide-react';

export function CoursesClient() {
  const [page, setPage] = useState(1);
  const [dept, setDept] = useState('');
  const [semester, setSemester] = useState('');

  const { data: result, isLoading } = trpc.course.list.useQuery({
    page, pageSize: 12,
    dept: dept || undefined,
    semester: semester || undefined,
  });

  const { data: semesters = [] } = trpc.course.semesters.useQuery();

  const courses = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Courses</h2>
          <p className="text-sm text-[var(--text-tertiary)]">{total} courses</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={semester}
            onChange={(e) => { setSemester(e.target.value); setPage(1); }}
            aria-label="Filter by semester"
            className="h-[38px] px-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
          >
            <option value="">All Semesters</option>
            {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-[var(--text-tertiary)]">No courses found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => {
              const fillPct = c.capacity > 0 ? (c.enrolled / c.capacity) * 100 : 0;
              const isNearFull = fillPct >= 85;
              return (
                <Card key={c.id} padding="md" className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-brand-alpha-10)] flex items-center justify-center shrink-0">
                      <BookOpen size={16} className="text-[var(--text-brand)]" />
                    </div>
                    <Badge variant={c.status === 'active' ? 'success' : 'neutral'}>{c.status}</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-[var(--text-tertiary)]">{c.courseCode}</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{c.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{c.department}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--text-tertiary)]">Enrollment</span>
                      <span className={`text-xs font-medium ${isNearFull ? 'text-[var(--color-warning)]' : 'text-[var(--text-secondary)]'}`}>
                        {c.enrolled}/{c.capacity}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isNearFull ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-brand)]'}`}
                        style={{ width: `${Math.min(fillPct, 100)}%` }}
                        role="progressbar"
                        aria-valuenow={c.enrolled}
                        aria-valuemin={0}
                        aria-valuemax={c.capacity}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {c.faculty?.name ?? 'Unassigned'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {c.credits} cr · {c.semester}
                    </span>
                  </div>
                </Card>
              );
            })}
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
