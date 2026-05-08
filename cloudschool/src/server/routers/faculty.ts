import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { router, protectedProc, adminProc } from '../trpc';

const createSchema = z.object({
  name:        z.string().min(2),
  email:       z.email(),
  phone:       z.string().optional(),
  facultyId:   z.string().min(1),
  department:  z.string().min(1),
  designation: z.string().min(1),
  salary:      z.number().positive(),
  joinDate:    z.string().datetime(),
  status:      z.enum(['active', 'inactive']).default('active'),
});

const updateSchema = createSchema.partial().omit({ facultyId: true });

export const facultyRouter = router({
  list: protectedProc
    .input(z.object({
      page:     z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      q:        z.string().optional(),
      dept:     z.string().optional(),
      status:   z.enum(['active', 'inactive']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const { page, pageSize, q, dept, status } = input;

      const where = {
        institutionId,
        ...(q && {
          OR: [
            { name:      { contains: q, mode: 'insensitive' as const } },
            { email:     { contains: q, mode: 'insensitive' as const } },
            { facultyId: { contains: q, mode: 'insensitive' as const } },
          ],
        }),
        ...(dept   && { department: dept }),
        ...(status && { status }),
      };

      const [data, total] = await Promise.all([
        prisma.faculty.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
        prisma.faculty.count({ where }),
      ]);

      return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  byId: protectedProc.input(z.string()).query(async ({ ctx, input }) => {
    const { institutionId, prisma } = ctx;
    const faculty = await prisma.faculty.findFirst({
      where: { id: input, institutionId },
      include: {
        courses: { select: { id: true, name: true, courseCode: true, semester: true, enrolled: true } },
        payroll: { orderBy: { month: 'desc' }, take: 6 },
      },
    });
    if (!faculty) throw new TRPCError({ code: 'NOT_FOUND' });
    return faculty;
  }),

  create: adminProc.input(createSchema).mutation(async ({ ctx, input }) => {
    const { institutionId, prisma } = ctx;

    const existing = await prisma.faculty.findUnique({
      where: { institutionId_facultyId: { institutionId, facultyId: input.facultyId } },
    });
    if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Faculty ID already exists' });

    const passwordHash = await bcrypt.hash('changeme123', 10);
    const user = await prisma.user.create({
      data: { institutionId, email: input.email, name: input.name, role: 'FACULTY', passwordHash },
    });

    return prisma.faculty.create({
      data: {
        institutionId, userId: user.id, ...input,
        joinDate: new Date(input.joinDate),
      },
    });
  }),

  update: adminProc
    .input(z.object({ id: z.string(), data: updateSchema }))
    .mutation(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const faculty = await prisma.faculty.findFirst({ where: { id: input.id, institutionId } });
      if (!faculty) throw new TRPCError({ code: 'NOT_FOUND' });
      return prisma.faculty.update({ where: { id: input.id }, data: input.data });
    }),

  delete: adminProc.input(z.string()).mutation(async ({ ctx, input }) => {
    const { institutionId, prisma } = ctx;
    const faculty = await prisma.faculty.findFirst({ where: { id: input, institutionId } });
    if (!faculty) throw new TRPCError({ code: 'NOT_FOUND' });
    await prisma.faculty.delete({ where: { id: input } });
    return { success: true };
  }),

  departments: protectedProc.query(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;
    const rows = await prisma.faculty.findMany({
      where: { institutionId },
      select: { department: true },
      distinct: ['department'],
      orderBy: { department: 'asc' },
    });
    return rows.map((r) => r.department);
  }),
});
