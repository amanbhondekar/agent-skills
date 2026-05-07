import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  paid:     z.coerce.number().min(0).optional(),
  status:   z.enum(['paid', 'unpaid', 'partial', 'overdue']).optional(),
  paidDate: z.string().datetime().optional(),
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

  const fee = await prisma.feeTransaction.findFirst({ where: { id, institutionId } });
  if (!fee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.paid !== undefined) {
    const paid = parsed.data.paid;
    const amount = Number(fee.amount);
    updateData.due    = Math.max(0, amount - paid);
    updateData.status = paid >= amount ? 'paid' : paid > 0 ? 'partial' : fee.status;
    if (paid >= amount) updateData.paidDate = new Date();
  }

  const updated = await prisma.feeTransaction.update({ where: { id }, data: updateData });
  return NextResponse.json(updated);
}
