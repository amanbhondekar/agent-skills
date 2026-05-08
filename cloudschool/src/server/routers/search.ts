import { z } from 'zod';
import { router, protectedProc } from '../trpc';

export const searchRouter = router({
  global: protectedProc
    .input(z.object({ q: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const { institutionId, prisma } = ctx;
      const q = input.q.trim();

      const [students, faculty, courses] = await Promise.all([
        prisma.student.findMany({
          where: {
            institutionId,
            OR: [
              { name:      { contains: q, mode: 'insensitive' } },
              { studentId: { contains: q, mode: 'insensitive' } },
              { email:     { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 5,
          select: { id: true, name: true, studentId: true, department: true },
        }),
        prisma.faculty.findMany({
          where: {
            institutionId,
            OR: [
              { name:      { contains: q, mode: 'insensitive' } },
              { facultyId: { contains: q, mode: 'insensitive' } },
              { email:     { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 5,
          select: { id: true, name: true, facultyId: true, department: true, designation: true },
        }),
        prisma.course.findMany({
          where: {
            institutionId,
            OR: [
              { name:       { contains: q, mode: 'insensitive' } },
              { courseCode: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 5,
          select: { id: true, name: true, courseCode: true, department: true, semester: true },
        }),
      ]);

      return {
        students: students.map((s) => ({ ...s, type: 'student' as const, href: `/students/${s.id}` })),
        faculty:  faculty.map((f) => ({ ...f, type: 'faculty' as const, href: `/faculty/${f.id}` })),
        courses:  courses.map((c) => ({ ...c, type: 'course' as const, href: `/courses/${c.id}` })),
        total:    students.length + faculty.length + courses.length,
      };
    }),
});
