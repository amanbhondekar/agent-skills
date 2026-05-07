import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  facultyId:   z.string().min(1),
  month:       z.string().regex(/^\d{4}-\d{2}$/),
  baseSalary:  z.coerce.number().positive(),
  allowances:  z.coerce.number().min(0).default(0),
  deductions:  z.coerce.number().min(0).default(0),
  status:      z.enum(['paid', 'pending', 'processing']).default('pending'),
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
  const month    = searchParams.get('month') ?? '';
  const status   = searchParams.get('status') ?? '';

  const where = {
    institutionId,
    ...(month  && { month }),
    ...(status && { status: status as 'paid' | 'pending' | 'processing' }),
  };

  const [data, total] = await Promise.all([
    prisma.payrollEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { faculty: { select: { name: true, department: true, designation: true } } },
    }),
    prisma.payrollEntry.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const institutionId = await getInstitutionId();
  if (!institutionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { facultyId, month, baseSalary, allowances, deductions, status } = parsed.data;
  const netSalary = baseSalary + allowances - deductions;

  const faculty = await prisma.faculty.findFirst({ where: { id: facultyId, institutionId } });
  if (!faculty) return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });

  const existing = await prisma.payrollEntry.findUnique({
    where: { facultyId_month: { facultyId, month } },
  });
  if (existing) return NextResponse.json({ error: 'Payroll already exists for this month' }, { status: 409 });

  const entry = await prisma.payrollEntry.create({
    data: { institutionId, facultyId, month, baseSalary, allowances, deductions, netSalary, status },
  });

  return NextResponse.json(entry, { status: 201 });
}
