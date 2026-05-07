import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  name:       z.string().min(2),
  email:      z.email(),
  phone:      z.string().optional(),
  studentId:  z.string().min(1),
  department: z.string().min(1),
  year:       z.coerce.number().int().min(1).max(4),
  status:     z.enum(['active', 'inactive']).default('active'),
});

async function getInstitutionId(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { institutionId?: string })?.institutionId ?? null;
}

export async function GET(req: NextRequest) {
  const institutionId = await getInstitutionId(req);
  if (!institutionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = parseInt(searchParams.get('pageSize') ?? '10');
  const q        = searchParams.get('q') ?? '';

  const where = {
    institutionId,
    ...(q && {
      OR: [
        { name:      { contains: q, mode: 'insensitive' as const } },
        { email:     { contains: q, mode: 'insensitive' as const } },
        { studentId: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.student.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.student.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const institutionId = await getInstitutionId(req);
  if (!institutionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, email, phone, studentId, department, year, status } = parsed.data;

  const existing = await prisma.student.findUnique({
    where: { institutionId_studentId: { institutionId, studentId } },
  });
  if (existing) return NextResponse.json({ error: 'Student ID already exists' }, { status: 409 });

  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash('changeme123', 10);

  const user = await prisma.user.create({
    data: { institutionId, email, name, role: 'STUDENT', passwordHash },
  });

  const student = await prisma.student.create({
    data: { institutionId, userId: user.id, studentId, name, email, phone, department, year, status },
  });

  return NextResponse.json(student, { status: 201 });
}
