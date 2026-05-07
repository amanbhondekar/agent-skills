import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StudentsClient } from './StudentsClient';

export const metadata: Metadata = { title: 'Students' };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; dept?: string; status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const institutionId = (session?.user as { institutionId?: string })?.institutionId ?? '';
  const params = await searchParams;

  const page     = Math.max(1, parseInt(params.page ?? '1'));
  const pageSize = 10;
  const query    = params.q ?? '';
  const dept     = params.dept ?? '';
  const status   = params.status ?? '';

  const where = {
    institutionId,
    ...(query && {
      OR: [
        { name:      { contains: query, mode: 'insensitive' as const } },
        { email:     { contains: query, mode: 'insensitive' as const } },
        { studentId: { contains: query, mode: 'insensitive' as const } },
      ],
    }),
    ...(dept   && { department: dept }),
    ...(status && { status: status as 'active' | 'inactive' }),
  };

  const [students, total, departments] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * pageSize,
      take:  pageSize,
    }),
    prisma.student.count({ where }),
    prisma.student.findMany({
      where: { institutionId },
      select: { department: true },
      distinct: ['department'],
      orderBy: { department: 'asc' },
    }),
  ]);

  return (
    <StudentsClient
      students={students.map((s) => ({
        id:         s.id,
        studentId:  s.studentId,
        name:       s.name,
        email:      s.email,
        department: s.department,
        year:       s.year,
        gpa:        Number(s.gpa),
        status:     s.status as 'active' | 'inactive',
        createdAt:  s.createdAt.toISOString(),
      }))}
      total={total}
      page={page}
      pageSize={pageSize}
      departments={departments.map((d) => d.department)}
    />
  );
}
