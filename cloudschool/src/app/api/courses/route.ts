import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  courseCode:  z.string().min(1),
  name:        z.string().min(2),
  department:  z.string().min(1),
  credits:     z.coerce.number().int().min(1).max(6),
  semester:    z.string().min(1),
  facultyId:   z.string().optional(),
  capacity:    z.coerce.number().int().min(1).default(30),
  schedule:    z.string().optional(),
  status:      z.enum(['active', 'inactive']).default('active'),
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
  const q        = searchParams.get('q') ?? '';
  const dept     = searchParams.get('dept') ?? '';

  const where = {
    institutionId,
    ...(q && {
      OR: [
        { name:       { contains: q, mode: 'insensitive' as const } },
        { courseCode: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
    ...(dept && { department: dept }),
  };

  const [data, total] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { faculty: { select: { name: true } } },
    }),
    prisma.course.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const institutionId = await getInstitutionId();
  if (!institutionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const course = await prisma.course.create({
    data: { institutionId, ...parsed.data },
  });

  return NextResponse.json(course, { status: 201 });
}
