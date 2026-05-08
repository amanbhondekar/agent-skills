'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  name:       z.string().min(2, 'Name must be at least 2 characters'),
  email:      z.email('Enter a valid email'),
  phone:      z.string().optional(),
  studentId:  z.string().min(1, 'Student ID is required'),
  department: z.string().min(1, 'Department is required'),
  year:       z.string().refine((v) => ['1','2','3','4'].includes(v), 'Invalid year'),
  status:     z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  student?: Partial<FormData> & { id?: string };
  onSuccess: () => void;
  onCancel: () => void;
}

const DEPARTMENTS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Business Administration', 'Mathematics',
  'Physics', 'Chemistry', 'Biology', 'Economics',
];

export function StudentForm({ student, onSuccess, onCancel }: Props) {
  const isEdit = !!student?.id;

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:       student?.name       ?? '',
      email:      student?.email      ?? '',
      phone:      student?.phone      ?? '',
      studentId:  student?.studentId  ?? '',
      department: student?.department ?? '',
      year:       student?.year       ?? '1',
      status:     student?.status     ?? 'active',
    },
  });

  const createMutation = trpc.student.create.useMutation();
  const updateMutation = trpc.student.update.useMutation();

  async function onSubmit(data: FormData) {
    try {
      const payload = { ...data, year: parseInt(data.year, 10) };
      if (isEdit) {
        await updateMutation.mutateAsync({ id: student!.id!, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError('root', { message: msg });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input id="name"      label="Full Name"   required error={errors.name?.message}      {...register('name')} />
        <Input id="studentId" label="Student ID"  required error={errors.studentId?.message} {...register('studentId')} />
      </div>
      <Input id="email" type="email" label="Email" required error={errors.email?.message} {...register('email')} />
      <Input id="phone" type="tel"   label="Phone"           error={errors.phone?.message} {...register('phone')} />
      <div className="grid grid-cols-2 gap-3">
        <Select
          id="department" label="Department" required
          error={errors.department?.message}
          options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
          placeholder="Select department"
          {...register('department')}
        />
        <Select
          id="year" label="Year" required
          error={errors.year?.message}
          options={[1,2,3,4].map((y) => ({ value: String(y), label: `Year ${y}` }))}
          {...register('year')}
        />
      </div>
      <Select
        id="status" label="Status" required
        error={errors.status?.message}
        options={[
          { value: 'active',   label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
        {...register('status')}
      />

      {errors.root && (
        <p role="alert" className="text-xs text-[var(--color-danger)]">{errors.root.message}</p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Save Changes' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
}
