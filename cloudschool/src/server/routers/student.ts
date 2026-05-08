import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { router, protectedProc, adminProc } from '../trpc';

const createSchema = z.object({
  name:       z.string().min(2),
  email:      z.email(),
  phone:      z.string().optional(),
  studentId:  z.string().min(1),
  department: z.string().min(1),
  year:       z.number().int().min(1).max(4),
  status:     z.enum(['active', 'inactive']).default('active'),
});

const updateSchema = createSchema.partial().omit({ studentId: true });

const listSchema = z.object({
  page:     z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  q:        z.string().optional(),
  dept:     z.string().optional(),
  status:   z.enum(['active', 'inactive']).optional(),
  year:     z.number().int().min(1).max(4).optional(),
});

export const studentRouter = router({
  list: protectedProc.input(listSchema).query(async ({ ctx, input }) => {
    const { institutionId, prisma } = ctx;
    const { page, pageSize, q, dept, status, year } = input;

    const where = {
      institutionId,
      ...(q && {
        OR: [
          { name:      { contains: q, mode: 'insensitive' as const } },
          { email:     { contains: q, mode: 'insensitive' as const } },
          { studentId: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
      ...(dept   && { department: dept }),
      ...(status && { status }),
      ...(year   && { year }),
    };

    const [data, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.student.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }),

  byId: protectedProc.input(z.string()).query(async ({ ctx, input }) => {
    const { institutionId, prisma } = ctx;
    const student = await prisma.student.findFirst({
      where: { id: input, institutionId },
      include: {
        enrollments: { include: { course: { select: { name: true, courseCode: true } } } },
        grades:      { include: { course: { select: { name: true, courseCode: true } } } },
        fees:        { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!student) throw new TRPCError({ code: 'NOT_FOUND' });
    return student;
  }),

  create: adminProc.input(createSchema).mutation(async ({ ctx, input }) => {
    const { institutionId, prisma } = ctx;

    const existing = await prisma.student.findUnique({
      where: { institutionId_studentId: { institutionId, studentId: input.studentId } },
    });
    if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Student ID already exists' });

    const passwordHash = await bcrypt.hash('changeme123', 10);
    const user = await prisma.user.create({
      data: { institutionId, email: input.email, name: input.name, role: 'STUDENT', passwordHash },
    });

    return prisma.student.create({
      data: { institutionId, userId: user.id, ...input },
    });
  }),

  update: adminProc
    .input(z.object({ id: z.string(), data: updateSchema }))
    .mutation(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const student = await prisma.student.findFirst({ where: { id: input.id, institutionId } });
      if (!student) throw new TRPCError({ code: 'NOT_FOUND' });
      return prisma.student.update({ where: { id: input.id }, data: input.data });
    }),

  delete: adminProc.input(z.string()).mutation(async ({ ctx, input }) => {
    const { institutionId, prisma } = ctx;
    const student = await prisma.student.findFirst({ where: { id: input, institutionId } });
    if (!student) throw new TRPCError({ code: 'NOT_FOUND' });
    await prisma.student.delete({ where: { id: input } });
    return { success: true };
  }),

  departments: protectedProc.query(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;
    const rows = await prisma.student.findMany({
      where: { institutionId },
      select: { department: true },
      distinct: ['department'],
      orderBy: { department: 'asc' },
    });
    return rows.map((r) => r.department);
  }),
});
