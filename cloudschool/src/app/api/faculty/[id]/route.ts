import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  name:        z.string().min(2).optional(),
  email:       z.email().optional(),
  phone:       z.string().optional(),
  department:  z.string().min(1).optional(),
  designation: z.string().min(1).optional(),
  salary:      z.coerce.number().positive().optional(),
  status:      z.enum(['active', 'inactive']).optional(),
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

  const faculty = await prisma.faculty.findFirst({ where: { id, institutionId } });
  if (!faculty) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.faculty.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const institutionId = await getInstitutionId();
  if (!institutionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const faculty = await prisma.faculty.findFirst({ where: { id, institutionId } });
  if (!faculty) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.faculty.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
