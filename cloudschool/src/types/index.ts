export type Role = 'ADMIN' | 'FACULTY' | 'STUDENT';

export type ActiveStatus = 'active' | 'inactive';
export type EnrollmentStatus = 'enrolled' | 'completed' | 'dropped';
export type GradeStatus = 'passed' | 'failed' | 'pending';
export type FeeStatus = 'paid' | 'unpaid' | 'partial' | 'overdue';
export type PayrollStatus = 'paid' | 'pending' | 'processing';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

/* ── Institution ─────────────────────────────────────────── */
export interface Institution {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  createdAt: Date;
}

/* ── User ────────────────────────────────────────────────── */
export interface User {
  id: string;
  institutionId: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  createdAt: Date;
}

/* ── Student ─────────────────────────────────────────────── */
export interface Student {
  id: string;
  institutionId: string;
  userId: string;
  studentId: string;        // e.g. "CS-2024-001"
  name: string;
  email: string;
  phone?: string;
  department: string;
  year: number;             // 1–4
  gpa: number;
  status: ActiveStatus;
  avatarUrl?: string;
  createdAt: Date;
  user?: User;
  enrollments?: Enrollment[];
}

/* ── Faculty ─────────────────────────────────────────────── */
export interface Faculty {
  id: string;
  institutionId: string;
  userId: string;
  facultyId: string;        // e.g. "FAC-001"
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  salary: number;
  status: ActiveStatus;
  avatarUrl?: string;
  joinDate: Date;
  createdAt: Date;
  user?: User;
  courses?: Course[];
}

/* ── Course ──────────────────────────────────────────────── */
export interface Course {
  id: string;
  institutionId: string;
  courseCode: string;       // e.g. "CS301"
  name: string;
  department: string;
  credits: number;
  semester: string;         // e.g. "Fall 2025"
  facultyId?: string;
  capacity: number;
  enrolled: number;
  status: ActiveStatus;
  schedule?: string;
  createdAt: Date;
  faculty?: Faculty;
  enrollments?: Enrollment[];
}

/* ── Enrollment ──────────────────────────────────────────── */
export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  semester: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  student?: Student;
  course?: Course;
  grades?: Grade[];
}

/* ── Grade ───────────────────────────────────────────────── */
export interface Grade {
  id: string;
  enrollmentId: string;
  studentId: string;
  courseId: string;
  institutionId: string;
  semester: string;
  midterm?: number;
  final?: number;
  assignments?: number;
  total?: number;
  letterGrade?: string;     // A, B+, C, etc.
  status: GradeStatus;
  createdAt: Date;
  student?: Student;
  course?: Course;
}

/* ── Fee Transaction ─────────────────────────────────────── */
export interface FeeTransaction {
  id: string;
  institutionId: string;
  studentId: string;
  feeType: string;          // tuition, library, lab, etc.
  amount: number;
  paid: number;
  due: number;
  dueDate: Date;
  paidDate?: Date;
  status: FeeStatus;
  semester: string;
  createdAt: Date;
  student?: Student;
}

/* ── Payroll Entry ───────────────────────────────────────── */
export interface PayrollEntry {
  id: string;
  institutionId: string;
  facultyId: string;
  month: string;            // e.g. "2025-04"
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  paidDate?: Date;
  createdAt: Date;
  faculty?: Faculty;
}

/* ── Attendance ──────────────────────────────────────────── */
export interface Attendance {
  id: string;
  institutionId: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: AttendanceStatus;
  student?: Student;
  course?: Course;
}

/* ── Dashboard Stats ─────────────────────────────────────── */
export interface DashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  totalRevenue: number;
  studentDelta: number;
  facultyDelta: number;
  courseDelta: number;
  revenueDelta: number;
}

/* ── Pagination ──────────────────────────────────────────── */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ── API Response ────────────────────────────────────────── */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/* ── Notification ────────────────────────────────────────── */
export interface Notification {
  id: string;
  type: 'fee' | 'attendance' | 'grade' | 'enrollment' | 'payroll' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
