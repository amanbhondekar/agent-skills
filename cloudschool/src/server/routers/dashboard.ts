import { router, protectedProc } from '../trpc';

export const dashboardRouter = router({
  stats: protectedProc.query(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;

    const [students, faculty, courses, feeAgg, gradeAgg] = await Promise.all([
      prisma.student.count({ where: { institutionId, status: 'active' } }),
      prisma.faculty.count({ where: { institutionId, status: 'active' } }),
      prisma.course.count({ where: { institutionId, status: 'active' } }),
      prisma.feeTransaction.aggregate({ where: { institutionId }, _sum: { paid: true, due: true } }),
      prisma.grade.aggregate({ where: { institutionId, total: { not: null } }, _avg: { total: true } }),
    ]);

    // Month-over-month deltas (compare this month vs last)
    const now       = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [studentsThisMonth, studentsLastMonth] = await Promise.all([
      prisma.student.count({ where: { institutionId, createdAt: { gte: thisMonth } } }),
      prisma.student.count({ where: { institutionId, createdAt: { gte: lastMonth, lt: thisMonth } } }),
    ]);

    const studentDelta = studentsLastMonth > 0
      ? parseFloat(((studentsThisMonth - studentsLastMonth) / studentsLastMonth * 100).toFixed(1))
      : 0;

    return {
      students,
      faculty,
      courses,
      revenue:       Number(feeAgg._sum.paid   ?? 0),
      outstanding:   Number(feeAgg._sum.due    ?? 0),
      avgGpa:        Number(gradeAgg._avg.total ?? 0) / 25, // 0–100 → 0–4
      studentDelta,
    };
  }),

  recentStudents: protectedProc.query(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;
    return prisma.student.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, department: true, year: true, status: true, createdAt: true },
    });
  }),

  recentFees: protectedProc.query(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;
    return prisma.feeTransaction.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { student: { select: { name: true, studentId: true } } },
    });
  }),

  enrollmentByDept: protectedProc.query(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;
    const rows = await prisma.student.groupBy({
      by: ['department'],
      where: { institutionId, status: 'active' },
      _count: true,
      orderBy: { _count: { department: 'desc' } },
    });
    return rows.map((r) => ({ department: r.department, count: r._count }));
  }),

  feeCollectionTrend: protectedProc.query(async ({ ctx }) => {
    const { institutionId, prisma } = ctx;
    const rows = await prisma.feeTransaction.groupBy({
      by: ['semester'],
      where: { institutionId },
      _sum: { amount: true, paid: true },
      orderBy: { semester: 'asc' },
    });
    return rows.map((r) => ({
      semester:  r.semester,
      billed:    Number(r._sum.amount ?? 0),
      collected: Number(r._sum.paid   ?? 0),
    }));
  }),
});
