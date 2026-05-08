import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProc, adminProc } from '../trpc';

export const feeRouter = router({
  list: protectedProc
    .input(z.object({
      page:     z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      q:        z.string().optional(),
      status:   z.enum(['paid', 'unpaid', 'partial', 'overdue']).optional(),
      semester: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const { page, pageSize, q, status, semester } = input;

      const where = {
        institutionId,
        ...(status   && { status }),
        ...(semester && { semester }),
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

      return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  summary: protectedProc.query(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;

    const [totals, bySemester, overdue] = await Promise.all([
      prisma.feeTransaction.aggregate({
        where: { institutionId },
        _sum: { amount: true, paid: true, due: true },
        _count: true,
      }),
      prisma.feeTransaction.groupBy({
        by: ['semester'],
        where: { institutionId },
        _sum: { amount: true, paid: true },
        orderBy: { semester: 'desc' },
      }),
      prisma.feeTransaction.count({ where: { institutionId, status: 'overdue' } }),
    ]);

    return {
      totalBilled:    Number(totals._sum.amount ?? 0),
      totalCollected: Number(totals._sum.paid   ?? 0),
      totalDue:       Number(totals._sum.due    ?? 0),
      count:          totals._count,
      overdueCount:   overdue,
      bySemester:     bySemester.map((r) => ({
        semester: r.semester,
        amount:   Number(r._sum.amount ?? 0),
        paid:     Number(r._sum.paid   ?? 0),
      })),
    };
  }),

  create: adminProc
    .input(z.object({
      studentId: z.string(),
      feeType:   z.string().min(1),
      amount:    z.number().positive(),
      dueDate:   z.string().datetime(),
      semester:  z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const student = await prisma.student.findFirst({ where: { id: input.studentId, institutionId } });
      if (!student) throw new TRPCError({ code: 'NOT_FOUND', message: 'Student not found' });

      return prisma.feeTransaction.create({
        data: {
          institutionId,
          studentId: input.studentId,
          feeType:   input.feeType,
          amount:    input.amount,
          paid:      0,
          due:       input.amount,
          dueDate:   new Date(input.dueDate),
          semester:  input.semester,
          status:    'unpaid',
        },
      });
    }),

  recordPayment: adminProc
    .input(z.object({
      id:     z.string(),
      amount: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const fee = await prisma.feeTransaction.findFirst({ where: { id: input.id, institutionId } });
      if (!fee) throw new TRPCError({ code: 'NOT_FOUND' });

      const newPaid = Math.min(Number(fee.amount), Number(fee.paid) + input.amount);
      const newDue  = Number(fee.amount) - newPaid;
      const status  = newDue <= 0 ? 'paid' : newPaid > 0 ? 'partial' : fee.status;

      return prisma.feeTransaction.update({
        where: { id: input.id },
        data: {
          paid:     newPaid,
          due:      newDue,
          status,
          paidDate: newDue <= 0 ? new Date() : null,
        },
      });
    }),

  markOverdue: adminProc.mutation(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;
    const { count } = await prisma.feeTransaction.updateMany({
      where: {
        institutionId,
        status:  { in: ['unpaid', 'partial'] },
        dueDate: { lt: new Date() },
      },
      data: { status: 'overdue' },
    });
    return { updated: count };
  }),
});
