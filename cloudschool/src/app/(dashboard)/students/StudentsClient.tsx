'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, Pagination } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { StudentForm } from './StudentForm';
import { useToast } from '@/components/ui/Toast';

type Student = {
  id: string; studentId: string; name: string; email: string;
  department: string; year: number; gpa: unknown; status: string;
  createdAt: Date;
};

export function StudentsClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [page,       setPage]       = useState(1);
  const [q,          setQ]          = useState('');
  const [dept,       setDept]       = useState('');
  const [status,     setStatus]     = useState<'active'|'inactive'|''>('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);

  const debouncedQ = useDebounce(q, 250);

  const { data, isLoading } = trpc.student.list.useQuery({
    page,
    pageSize: 10,
    q: debouncedQ || undefined,
    dept: dept || undefined,
    status: status || undefined,
  });

  const { data: departments = [] } = trpc.student.departments.useQuery();

  const utils = trpc.useUtils();

  const deleteMutation = trpc.student.delete.useMutation({
    onSuccess: () => {
      utils.student.list.invalidate();
      toast('success', 'Student removed.');
    },
    onError: (e) => toast('error', e.message),
  });

  const students = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const columns = [
    {
      key: 'name',
      header: 'Student',
      render: (s: Student) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size="md" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{s.name}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{s.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'studentId',
      header: 'ID',
      render: (s: Student) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">{s.studentId}</span>
      ),
    },
    { key: 'department', header: 'Department' },
    {
      key: 'year',
      header: 'Year',
      render: (s: Student) => <span>Year {s.year}</span>,
    },
    {
      key: 'gpa',
      header: 'GPA',
      render: (s: Student) => {
        const gpa = Number(s.gpa);
        return (
          <span className={gpa >= 3.5 ? 'text-[var(--color-success)]' : gpa < 2 ? 'text-[var(--color-danger)]' : ''}>
            {gpa.toFixed(2)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: Student) => (
        <Badge variant={s.status === 'active' ? 'success' : 'danger'} dot>{s.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      srOnly: true,
      render: (s: Student) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditTarget(s)}>Edit</Button>
          <Button
            variant="ghost" size="sm"
            onClick={() => { if (confirm('Delete this student?')) deleteMutation.mutate(s.id); }}
            className="text-[var(--color-danger)]"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Students</h2>
          <p className="text-sm text-[var(--text-tertiary)]">{total} total</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="search"
            placeholder="Search students…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            aria-label="Search students"
            className="w-full h-[38px] pl-9 pr-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-focus)]"
          />
        </div>
        <select
          value={dept}
          onChange={(e) => { setDept(e.target.value); setPage(1); }}
          aria-label="Filter by department"
          className="h-[38px] px-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as 'active'|'inactive'|''); setPage(1); }}
          aria-label="Filter by status"
          className="h-[38px] px-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={students}
              keyExtractor={(s) => s.id}
              emptyMessage="No students found."
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-tertiary)]">
                  Page {page} of {totalPages} · {total} results
                </p>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Student" size="md">
        <StudentForm
          onSuccess={() => {
            setShowCreate(false);
            toast('success', 'Student added.');
            utils.student.list.invalidate();
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Student" size="md">
        {editTarget && (
          <StudentForm
            student={{ ...editTarget, year: String(editTarget.year), status: editTarget.status as 'active' | 'inactive' }}
            onSuccess={() => {
              setEditTarget(null);
              toast('success', 'Student updated.');
              utils.student.list.invalidate();
            }}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useState(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  });
  return debounced;
}
