import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProc, adminProc } from '../trpc';

const createSchema = z.object({
  courseCode:  z.string().min(1),
  name:        z.string().min(2),
  department:  z.string().min(1),
  credits:     z.number().int().min(1).max(6),
  semester:    z.string().min(1),
  facultyId:   z.string().optional(),
  capacity:    z.number().int().min(1).default(30),
  schedule:    z.string().optional(),
  status:      z.enum(['active', 'inactive']).default('active'),
});

const updateSchema = createSchema.partial().omit({ courseCode: true });

export const courseRouter = router({
  list: protectedProc
    .input(z.object({
      page:     z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      q:        z.string().optional(),
      dept:     z.string().optional(),
      semester: z.string().optional(),
      status:   z.enum(['active', 'inactive']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const { page, pageSize, q, dept, semester, status } = input;

      const where = {
        institutionId,
        ...(q && {
          OR: [
            { name:       { contains: q, mode: 'insensitive' as const } },
            { courseCode: { contains: q, mode: 'insensitive' as const } },
          ],
        }),
        ...(dept     && { department: dept }),
        ...(semester && { semester }),
        ...(status   && { status }),
      };

      const [data, total] = await Promise.all([
        prisma.course.findMany({
          where,
          orderBy: { courseCode: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: { faculty: { select: { name: true, designation: true } } },
        }),
        prisma.course.count({ where }),
      ]);

      return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  byId: protectedProc.input(z.string()).query(async ({ ctx, input }) => {
    const { institutionId, prisma } = ctx;
    const course = await prisma.course.findFirst({
      where: { id: input, institutionId },
      include: {
        faculty: { select: { id: true, name: true, designation: true } },
        enrollments: {
          include: { student: { select: { id: true, name: true, studentId: true } } },
          take: 50,
        },
      },
    });
    if (!course) throw new TRPCError({ code: 'NOT_FOUND' });
    return course;
  }),

  create: adminProc.input(createSchema).mutation(async ({ ctx, input }) => {
    const { institutionId, prisma } = ctx;
    const existing = await prisma.course.findUnique({
      where: { institutionId_courseCode_semester: { institutionId, courseCode: input.courseCode, semester: input.semester } },
    });
    if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Course code already exists for this semester' });
    return prisma.course.create({ data: { institutionId, ...input } });
  }),

  update: adminProc
    .input(z.object({ id: z.string(), data: updateSchema }))
    .mutation(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const course = await prisma.course.findFirst({ where: { id: input.id, institutionId } });
      if (!course) throw new TRPCError({ code: 'NOT_FOUND' });
      return prisma.course.update({ where: { id: input.id }, data: input.data });
    }),

  delete: adminProc.input(z.string()).mutation(async ({ ctx, input }) => {
    const { institutionId, prisma } = ctx;
    const course = await prisma.course.findFirst({ where: { id: input, institutionId } });
    if (!course) throw new TRPCError({ code: 'NOT_FOUND' });
    await prisma.course.delete({ where: { id: input } });
    return { success: true };
  }),

  enroll: protectedProc
    .input(z.object({ courseId: z.string(), studentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const course = await prisma.course.findFirst({ where: { id: input.courseId, institutionId } });
      if (!course) throw new TRPCError({ code: 'NOT_FOUND' });
      if (course.enrolled >= course.capacity) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Course is at capacity' });

      const enrollment = await prisma.enrollment.create({
        data: { studentId: input.studentId, courseId: input.courseId, semester: course.semester, status: 'enrolled' },
      });
      await prisma.course.update({ where: { id: input.courseId }, data: { enrolled: { increment: 1 } } });
      return enrollment;
    }),

  semesters: protectedProc.query(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;
    const rows = await prisma.course.findMany({
      where: { institutionId },
      select: { semester: true },
      distinct: ['semester'],
      orderBy: { semester: 'desc' },
    });
    return rows.map((r) => r.semester);
  }),
});
