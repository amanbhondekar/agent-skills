import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProc, adminProc } from '../trpc';

export const payrollRouter = router({
  list: protectedProc
    .input(z.object({
      page:     z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      month:    z.string().regex(/^\d{4}-\d{2}$/).optional(),
      status:   z.enum(['paid', 'pending', 'processing']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const { page, pageSize, month, status } = input;

      const where = {
        institutionId,
        ...(month  && { month }),
        ...(status && { status }),
      };

      const [data, total] = await Promise.all([
        prisma.payrollEntry.findMany({
          where,
          orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: { faculty: { select: { name: true, department: true, designation: true } } },
        }),
        prisma.payrollEntry.count({ where }),
      ]);

      return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  summary: protectedProc.query(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;

    const [total, paid, byMonth] = await Promise.all([
      prisma.payrollEntry.aggregate({ where: { institutionId }, _sum: { netSalary: true }, _count: true }),
      prisma.payrollEntry.aggregate({ where: { institutionId, status: 'paid' }, _sum: { netSalary: true } }),
      prisma.payrollEntry.groupBy({
        by: ['month'],
        where: { institutionId },
        _sum: { netSalary: true },
        _count: true,
        orderBy: { month: 'desc' },
        take: 6,
      }),
    ]);

    return {
      totalPayroll: Number(total._sum.netSalary ?? 0),
      disbursed:    Number(paid._sum.netSalary ?? 0),
      pending:      Number(total._sum.netSalary ?? 0) - Number(paid._sum.netSalary ?? 0),
      count:        total._count,
      byMonth:      byMonth.map((r) => ({
        month:  r.month,
        amount: Number(r._sum.netSalary ?? 0),
        count:  r._count,
      })),
    };
  }),

  runPayroll: adminProc
    .input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }))
    .mutation(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;

      const faculty = await prisma.faculty.findMany({
        where: { institutionId, status: 'active' },
      });

      let created = 0;
      let skipped = 0;

      for (const f of faculty) {
        const existing = await prisma.payrollEntry.findUnique({
          where: { facultyId_month: { facultyId: f.id, month: input.month } },
        });
        if (existing) { skipped++; continue; }

        const base       = Number(f.salary);
        const allowances = Math.round(base * 0.1);  // 10% HRA
        const deductions = Math.round(base * 0.08); // 8% PF
        const net        = base + allowances - deductions;

        await prisma.payrollEntry.create({
          data: {
            institutionId,
            facultyId:   f.id,
            month:       input.month,
            baseSalary:  base,
            allowances,
            deductions,
            netSalary:   net,
            status:      'pending',
          },
        });
        created++;
      }

      return { created, skipped, total: faculty.length };
    }),

  markPaid: adminProc
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const entry = await prisma.payrollEntry.findFirst({ where: { id: input.id, institutionId } });
      if (!entry) throw new TRPCError({ code: 'NOT_FOUND' });

      return prisma.payrollEntry.update({
        where: { id: input.id },
        data:  { status: 'paid', paidDate: new Date() },
      });
    }),

  markAllPaid: adminProc
    .input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }))
    .mutation(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const { count } = await prisma.payrollEntry.updateMany({
        where: { institutionId, month: input.month, status: { not: 'paid' } },
        data:  { status: 'paid', paidDate: new Date() },
      });
      return { updated: count };
    }),

  months: protectedProc.query(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;
    const rows = await prisma.payrollEntry.findMany({
      where: { institutionId },
      select: { month: true },
      distinct: ['month'],
      orderBy: { month: 'desc' },
    });
    return rows.map((r) => r.month);
  }),
});
