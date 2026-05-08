/**
 * CloudSchool seed — creates a demo institution with realistic data:
 *   1 admin, 8 faculty, 20 students, 10 courses, enrollments, grades, fees, payroll
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://cloudschool:cloudschool@localhost:5432/cloudschool',
});
const prisma = new PrismaClient({ adapter });

/* ── Helpers ──────────────────────────────────────────────── */

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number, decimals = 0) {
  const v = Math.random() * (max - min) + min;
  return decimals ? parseFloat(v.toFixed(decimals)) : Math.floor(v);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

/* ── Data ─────────────────────────────────────────────────── */

const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Business Administration',
  'Mathematics',
];

const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];

const COURSE_DATA = [
  { code: 'CS101', name: 'Introduction to Programming',   dept: 'Computer Science',        credits: 3 },
  { code: 'CS201', name: 'Data Structures & Algorithms',  dept: 'Computer Science',        credits: 4 },
  { code: 'CS301', name: 'Database Management Systems',   dept: 'Computer Science',        credits: 3 },
  { code: 'CS401', name: 'Machine Learning Fundamentals', dept: 'Computer Science',        credits: 4 },
  { code: 'EE101', name: 'Circuit Theory',                dept: 'Electrical Engineering',  credits: 3 },
  { code: 'EE201', name: 'Digital Electronics',           dept: 'Electrical Engineering',  credits: 3 },
  { code: 'ME101', name: 'Engineering Mechanics',         dept: 'Mechanical Engineering',  credits: 3 },
  { code: 'BA101', name: 'Principles of Management',      dept: 'Business Administration', credits: 3 },
  { code: 'MA101', name: 'Calculus I',                    dept: 'Mathematics',             credits: 4 },
  { code: 'MA201', name: 'Linear Algebra',                dept: 'Mathematics',             credits: 3 },
];

const STUDENT_NAMES = [
  'Aisha Patel',      'Marcus Johnson',   'Sofia Rodriguez',  'Liam Chen',
  'Priya Sharma',     'Daniel Kim',       'Zara Ahmed',       'Noah Williams',
  'Mei Lin',          'Ethan Davis',      'Fatima Hassan',    'Oliver Smith',
  'Ananya Gupta',     'James Wilson',     'Yuki Tanaka',      'Isabella Brown',
  'Arjun Mehta',      'Charlotte Taylor', 'Samuel Okafor',    'Emma Martinez',
];

const FACULTY_NAMES = [
  'Dr. Robert Chang',    'Dr. Sarah Mitchell',  'Dr. Kwame Asante',
  'Dr. Elena Volkova',   'Dr. Raj Krishnamurthy','Dr. Lisa Park',
  'Dr. Ahmed Ibrahim',   'Dr. Grace Thompson',
];

const FEE_TYPES = ['Tuition', 'Library', 'Laboratory', 'Sports', 'Hostel'];
const SEMESTERS = ['Fall 2024', 'Spring 2025', 'Fall 2025'];

function letterGrade(total: number): string {
  if (total >= 90) return 'A+';
  if (total >= 85) return 'A';
  if (total >= 80) return 'A-';
  if (total >= 75) return 'B+';
  if (total >= 70) return 'B';
  if (total >= 65) return 'B-';
  if (total >= 60) return 'C+';
  if (total >= 55) return 'C';
  if (total >= 50) return 'D';
  return 'F';
}

async function main() {
  console.log('🌱 Seeding CloudSchool...\n');

  /* ── Institution ─────────────────────────────────────── */
  const institution = await prisma.institution.upsert({
    where:  { slug: 'demo-university' },
    update: {},
    create: {
      name:  'Demo University',
      slug:  'demo-university',
      primaryColor: '#3D52E5',
    },
  });
  const iid = institution.id;
  console.log(`✅ Institution: ${institution.name}`);

  /* ── Admin user ──────────────────────────────────────── */
  const adminPwHash = await hash('admin123');
  const adminUser = await prisma.user.upsert({
    where:  { institutionId_email: { institutionId: iid, email: 'admin@demo.edu' } },
    update: {},
    create: {
      institutionId: iid,
      email:         'admin@demo.edu',
      passwordHash:  adminPwHash,
      name:          'Admin User',
      role:          'ADMIN',
    },
  });
  console.log(`✅ Admin: admin@demo.edu / admin123`);

  /* ── Faculty ─────────────────────────────────────────── */
  const facultyRecords = [];
  for (let i = 0; i < FACULTY_NAMES.length; i++) {
    const name    = FACULTY_NAMES[i];
    const email   = `faculty${i + 1}@demo.edu`;
    const dept    = pick(DEPARTMENTS);
    const pwHash  = await hash('faculty123');

    const user = await prisma.user.upsert({
      where:  { institutionId_email: { institutionId: iid, email } },
      update: {},
      create: { institutionId: iid, email, passwordHash: pwHash, name, role: 'FACULTY' },
    });

    const faculty = await prisma.faculty.upsert({
      where:  { institutionId_facultyId: { institutionId: iid, facultyId: `FAC-${String(i + 1).padStart(3, '0')}` } },
      update: {},
      create: {
        institutionId: iid,
        userId:        user.id,
        facultyId:     `FAC-${String(i + 1).padStart(3, '0')}`,
        name,
        email,
        department:    dept,
        designation:   pick(DESIGNATIONS),
        salary:        rand(60000, 120000),
        joinDate:      daysAgo(rand(365, 3000)),
        status:        'active',
      },
    });
    facultyRecords.push(faculty);
  }
  console.log(`✅ Faculty: ${facultyRecords.length} members`);

  /* ── Courses ─────────────────────────────────────────── */
  const courseRecords = [];
  for (let i = 0; i < COURSE_DATA.length; i++) {
    const cd      = COURSE_DATA[i];
    const faculty = facultyRecords.find((f) => f.department === cd.dept) ?? pick(facultyRecords);
    const sem     = pick(SEMESTERS);

    const course = await prisma.course.upsert({
      where:  { institutionId_courseCode_semester: { institutionId: iid, courseCode: cd.code, semester: sem } },
      update: {},
      create: {
        institutionId: iid,
        courseCode:    cd.code,
        name:          cd.name,
        department:    cd.dept,
        credits:       cd.credits,
        semester:      sem,
        facultyId:     faculty.id,
        capacity:      40,
        enrolled:      0,
        schedule:      `${pick(['Mon', 'Tue', 'Wed'])}/Wed ${pick(['9:00', '11:00', '14:00', '16:00'])} AM`,
        status:        'active',
      },
    });
    courseRecords.push(course);
  }
  console.log(`✅ Courses: ${courseRecords.length}`);

  /* ── Students ─────────────────────────────────────────── */
  const studentRecords = [];
  const pwHash = await hash('student123');

  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const name  = STUDENT_NAMES[i];
    const email = `student${i + 1}@demo.edu`;
    const dept  = pick(DEPARTMENTS);
    const year  = rand(1, 4);

    const user = await prisma.user.upsert({
      where:  { institutionId_email: { institutionId: iid, email } },
      update: {},
      create: { institutionId: iid, email, passwordHash: pwHash, name, role: 'STUDENT' },
    });

    const student = await prisma.student.upsert({
      where:  { institutionId_studentId: { institutionId: iid, studentId: `ST-${String(i + 1).padStart(4, '0')}` } },
      update: {},
      create: {
        institutionId: iid,
        userId:        user.id,
        studentId:     `ST-${String(i + 1).padStart(4, '0')}`,
        name,
        email,
        phone:         `+1 555-${String(rand(1000, 9999))}`,
        department:    dept,
        year,
        gpa:           rand(2.0, 4.0, 2),
        status:        Math.random() > 0.1 ? 'active' : 'inactive',
      },
    });
    studentRecords.push(student);
  }
  console.log(`✅ Students: ${studentRecords.length}`);

  /* ── Enrollments + Grades ───────────────────────────── */
  let enrollCount = 0;
  let gradeCount  = 0;

  for (const student of studentRecords) {
    // Each student enrolls in 3–5 courses
    const numCourses = rand(3, 5);
    const shuffled   = [...courseRecords].sort(() => Math.random() - 0.5);
    const myCourses  = shuffled.slice(0, numCourses);

    for (const course of myCourses) {
      const existing = await prisma.enrollment.findUnique({
        where: { studentId_courseId_semester: { studentId: student.id, courseId: course.id, semester: course.semester } },
      });
      if (existing) continue;

      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          courseId:  course.id,
          semester:  course.semester,
          status:    'enrolled',
        },
      });
      enrollCount++;

      // Update course enrolled count
      await prisma.course.update({
        where: { id: course.id },
        data:  { enrolled: { increment: 1 } },
      });

      // Create grade
      const midterm     = rand(50, 100, 1);
      const final       = rand(50, 100, 1);
      const assignments = rand(60, 100, 1);
      const total       = parseFloat(((midterm * 0.3) + (final * 0.4) + (assignments * 0.3)).toFixed(2));
      const letter      = letterGrade(total);

      await prisma.grade.create({
        data: {
          enrollmentId:  enrollment.id,
          studentId:     student.id,
          courseId:      course.id,
          institutionId: iid,
          semester:      course.semester,
          midterm,
          final,
          assignments,
          total,
          letterGrade:   letter,
          status:        total >= 50 ? 'passed' : 'failed',
        },
      });
      gradeCount++;
    }
  }
  console.log(`✅ Enrollments: ${enrollCount} | Grades: ${gradeCount}`);

  /* ── Fee Transactions ───────────────────────────────── */
  let feeCount = 0;
  const feeStatuses = ['paid', 'paid', 'paid', 'partial', 'unpaid', 'overdue'] as const;

  for (const student of studentRecords) {
    for (let f = 0; f < rand(2, 4); f++) {
      const amount  = rand(500, 5000);
      const status  = pick(feeStatuses);
      const paid    = status === 'paid'    ? amount
                    : status === 'partial' ? rand(100, amount - 1)
                    : 0;

      await prisma.feeTransaction.create({
        data: {
          institutionId: iid,
          studentId:     student.id,
          feeType:       pick(FEE_TYPES),
          amount,
          paid,
          due:           amount - paid,
          dueDate:       daysAgo(rand(-30, 180)),
          paidDate:      status === 'paid' ? daysAgo(rand(1, 60)) : null,
          status,
          semester:      pick(SEMESTERS),
        },
      });
      feeCount++;
    }
  }
  console.log(`✅ Fee transactions: ${feeCount}`);

  /* ── Payroll ─────────────────────────────────────────── */
  let payrollCount = 0;
  const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05'];
  const payStatuses = ['paid', 'paid', 'paid', 'paid', 'pending'] as const;

  for (const faculty of facultyRecords) {
    for (const month of months) {
      const base        = Number(faculty.salary);
      const allowances  = rand(500, 2000);
      const deductions  = rand(200, 1000);
      const netSalary   = base + allowances - deductions;
      const status      = pick(payStatuses);

      try {
        await prisma.payrollEntry.create({
          data: {
            institutionId: iid,
            facultyId:     faculty.id,
            month,
            baseSalary:    base,
            allowances,
            deductions,
            netSalary,
            status,
            paidDate: status === 'paid' ? new Date(`${month}-28`) : null,
          },
        });
        payrollCount++;
      } catch {
        // skip duplicate
      }
    }
  }
  console.log(`✅ Payroll entries: ${payrollCount}`);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CloudSchool seed complete 🎓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Login credentials:
  Admin:   admin@demo.edu / admin123
  Faculty: faculty1@demo.edu / faculty123
  Student: student1@demo.edu / student123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
