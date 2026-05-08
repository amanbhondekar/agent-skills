import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProc, adminProc } from '../trpc';

function computeGrade(midterm?: number, final?: number, assignments?: number) {
  if (midterm == null || final == null || assignments == null) return null;
  const total = midterm * 0.3 + final * 0.4 + assignments * 0.3;

  let letter: string;
  if (total >= 90) letter = 'A+';
  else if (total >= 85) letter = 'A';
  else if (total >= 80) letter = 'A-';
  else if (total >= 75) letter = 'B+';
  else if (total >= 70) letter = 'B';
  else if (total >= 65) letter = 'B-';
  else if (total >= 60) letter = 'C+';
  else if (total >= 55) letter = 'C';
  else if (total >= 50) letter = 'D';
  else letter = 'F';

  return { total: parseFloat(total.toFixed(2)), letter, status: total >= 50 ? 'passed' as const : 'failed' as const };
}

export const gradeRouter = router({
  list: protectedProc
    .input(z.object({
      page:     z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      semester: z.string().optional(),
      courseId: z.string().optional(),
      status:   z.enum(['passed', 'failed', 'pending']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const { page, pageSize, semester, courseId, status } = input;

      const where = {
        institutionId,
        ...(semester && { semester }),
        ...(courseId && { courseId }),
        ...(status   && { status }),
      };

      const [data, total] = await Promise.all([
        prisma.grade.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            student: { select: { name: true, studentId: true } },
            course:  { select: { name: true, courseCode: true } },
          },
        }),
        prisma.grade.count({ where }),
      ]);

      return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  enter: adminProc
    .input(z.object({
      enrollmentId: z.string(),
      midterm:      z.number().min(0).max(100).optional(),
      final:        z.number().min(0).max(100).optional(),
      assignments:  z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;

      const enrollment = await prisma.enrollment.findFirst({
        where: { id: input.enrollmentId },
        include: { student: true, course: true },
      });
      if (!enrollment || enrollment.student.institutionId !== institutionId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const computed = computeGrade(input.midterm, input.final, input.assignments);

      const grade = await prisma.grade.upsert({
        where: { enrollmentId: input.enrollmentId },
        create: {
          enrollmentId:  input.enrollmentId,
          studentId:     enrollment.studentId,
          courseId:      enrollment.courseId,
          institutionId,
          semester:      enrollment.semester,
          midterm:       input.midterm,
          final:         input.final,
          assignments:   input.assignments,
          total:         computed?.total,
          letterGrade:   computed?.letter,
          status:        computed?.status ?? 'pending',
        },
        update: {
          midterm:     input.midterm,
          final:       input.final,
          assignments: input.assignments,
          total:       computed?.total,
          letterGrade: computed?.letter,
          status:      computed?.status ?? 'pending',
        },
      });

      // Keep student GPA denormalised
      if (computed) {
        const allGrades = await prisma.grade.findMany({
          where: { studentId: enrollment.studentId, total: { not: null } },
          select: { total: true },
        });
        const avg = allGrades.reduce((s, g) => s + Number(g.total), 0) / allGrades.length;
        await prisma.student.update({
          where: { id: enrollment.studentId },
          data: { gpa: parseFloat((avg / 25).toFixed(2)) }, // 0–100 → 0–4 scale
        });
      }

      return grade;
    }),

  semesters: protectedProc.query(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;
    const rows = await prisma.grade.findMany({
      where: { institutionId },
      select: { semester: true },
      distinct: ['semester'],
      orderBy: { semester: 'desc' },
    });
    return rows.map((r) => r.semester);
  }),
});
