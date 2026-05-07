import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  studentId: z.string().min(1),
  feeType:   z.string().min(1),
  amount:    z.coerce.number().positive(),
  dueDate:   z.string().datetime(),
  semester:  z.string().min(1),
  status:    z.enum(['paid', 'unpaid', 'partial', 'overdue']).default('unpaid'),
});

async function getInstitutionId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { institutionId?: string })?.institutionId ?? null;
}

export async function GET(req: NextRequest) {
  const institutionId = await getInstitutionId();
  if (!institutionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = parseInt(searchParams.get('pageSize') ?? '10');
  const status   = searchParams.get('status') ?? '';
  const q        = searchParams.get('q') ?? '';

  const where = {
    institutionId,
    ...(status && { status: status as 'paid' | 'unpaid' | 'partial' | 'overdue' }),
    ...(q && {
      student: {
        OR: [
          { name:      { contains: q, mode: 'insensitive' as const } },
          { studentId: { contains: q, mode: 'insensitive' as const } },
        ],
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.feeTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { student: { select: { name: true, studentId: true } } },
    }),
    prisma.feeTransaction.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const institutionId = await getInstitutionId();
  if (!institutionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { studentId, feeType, amount, dueDate, semester, status } = parsed.data;

  const student = await prisma.student.findFirst({ where: { id: studentId, institutionId } });
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const fee = await prisma.feeTransaction.create({
    data: {
      institutionId, studentId, feeType, amount, paid: 0, due: amount,
      dueDate: new Date(dueDate), semester, status,
    },
  });

  return NextResponse.json(fee, { status: 201 });
}
