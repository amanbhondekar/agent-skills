'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Plus, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, Pagination } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { StudentForm } from './StudentForm';
import { useToast } from '@/components/ui/Toast';

interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  gpa: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Props {
  students: Student[];
  total: number;
  page: number;
  pageSize: number;
  departments: string[];
}

export function StudentsClient({ students, total, page, pageSize, departments }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

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
      render: (s: Student) => (
        <span className={s.gpa >= 3.5 ? 'text-[var(--color-success)]' : s.gpa >= 2.0 ? '' : 'text-[var(--color-danger)]'}>
          {s.gpa.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: Student) => (
        <Badge variant={s.status === 'active' ? 'success' : 'danger'} dot>
          {s.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      srOnly: true,
      render: (s: Student) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditTarget(s)}>
            Edit
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
          <Plus size={15} />
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="search"
            placeholder="Search students…"
            defaultValue={searchParams.get('q') ?? ''}
            onChange={(e) => updateParam('q', e.target.value)}
            aria-label="Search students"
            className="w-full h-[38px] pl-9 pr-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-focus)]"
          />
        </div>

        {/* Department filter */}
        <select
          defaultValue={searchParams.get('dept') ?? ''}
          onChange={(e) => updateParam('dept', e.target.value)}
          aria-label="Filter by department"
          className="h-[38px] px-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Status filter */}
        <select
          defaultValue={searchParams.get('status') ?? ''}
          onChange={(e) => updateParam('status', e.target.value)}
          aria-label="Filter by status"
          className="h-[38px] px-3 bg-[var(--color-bg-elevated)] border border-[var(--border-standard)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Summary badges */}
        <div className="flex items-center gap-1.5 ml-auto">
          <UserCheck size={14} className="text-[var(--color-success)]" />
          <span className="text-xs text-[var(--text-tertiary)]">
            {students.filter((s) => s.status === 'active').length} active
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden">
        <Table
          columns={columns}
          data={students}
          keyExtractor={(s) => s.id}
          emptyMessage="No students found. Try adjusting your filters."
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)]">
            <p className="text-xs text-[var(--text-tertiary)]">
              Page {page} of {totalPages} · {total} results
            </p>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => updateParam('page', String(p))}
            />
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add Student"
        description="Fill in the student details below."
        size="md"
      >
        <StudentForm
          onSuccess={() => {
            setShowCreate(false);
            toast('success', 'Student added successfully.');
            router.refresh();
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Student"
        size="md"
      >
        {editTarget && (
          <StudentForm
            student={{ ...editTarget, year: String(editTarget.year) }}
            onSuccess={() => {
              setEditTarget(null);
              toast('success', 'Student updated successfully.');
              router.refresh();
            }}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>
    </div>
  );
}
