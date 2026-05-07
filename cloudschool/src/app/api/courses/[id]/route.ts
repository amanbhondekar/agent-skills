import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  name:       z.string().min(2).optional(),
  department: z.string().min(1).optional(),
  credits:    z.coerce.number().int().min(1).max(6).optional(),
  semester:   z.string().min(1).optional(),
  facultyId:  z.string().nullable().optional(),
  capacity:   z.coerce.number().int().min(1).optional(),
  schedule:   z.string().optional(),
  status:     z.enum(['active', 'inactive']).optional(),
});

async function getInstitutionId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { institutionId?: string })?.institutionId ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const institutionId = await getInstitutionId();
  if (!institutionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const course = await prisma.course.findFirst({ where: { id, institutionId } });
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.course.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const institutionId = await getInstitutionId();
  if (!institutionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const course = await prisma.course.findFirst({ where: { id, institutionId } });
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.course.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
