-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'FACULTY', 'STUDENT');

-- CreateEnum
CREATE TYPE "ActiveStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('enrolled', 'completed', 'dropped');

-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('passed', 'failed', 'pending');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('paid', 'unpaid', 'partial', 'overdue');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('paid', 'pending', 'processing');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'excused');

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "gpa" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "status" "ActiveStatus" NOT NULL DEFAULT 'active',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "salary" DECIMAL(10,2) NOT NULL,
    "status" "ActiveStatus" NOT NULL DEFAULT 'active',
    "avatarUrl" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "semester" TEXT NOT NULL,
    "facultyId" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "enrolled" INTEGER NOT NULL DEFAULT 0,
    "status" "ActiveStatus" NOT NULL DEFAULT 'active',
    "schedule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'enrolled',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "midterm" DECIMAL(5,2),
    "final" DECIMAL(5,2),
    "assignments" DECIMAL(5,2),
    "total" DECIMAL(5,2),
    "letterGrade" TEXT,
    "status" "GradeStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_transactions" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeType" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "due" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" "FeeStatus" NOT NULL DEFAULT 'unpaid',
    "semester" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_entries" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "baseSalary" DECIMAL(10,2) NOT NULL,
    "allowances" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(10,2) NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'pending',
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'present',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "institutions_slug_key" ON "institutions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_institutionId_email_key" ON "users"("institutionId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE INDEX "students_institutionId_department_idx" ON "students"("institutionId", "department");

-- CreateIndex
CREATE INDEX "students_institutionId_status_idx" ON "students"("institutionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "students_institutionId_studentId_key" ON "students"("institutionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_userId_key" ON "faculty"("userId");

-- CreateIndex
CREATE INDEX "faculty_institutionId_department_idx" ON "faculty"("institutionId", "department");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_institutionId_facultyId_key" ON "faculty"("institutionId", "facultyId");

-- CreateIndex
CREATE INDEX "courses_institutionId_department_idx" ON "courses"("institutionId", "department");

-- CreateIndex
CREATE UNIQUE INDEX "courses_institutionId_courseCode_semester_key" ON "courses"("institutionId", "courseCode", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentId_courseId_semester_key" ON "enrollments"("studentId", "courseId", "semester");

-- CreateIndex
CREATE INDEX "grades_institutionId_semester_idx" ON "grades"("institutionId", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "grades_enrollmentId_key" ON "grades"("enrollmentId");

-- CreateIndex
CREATE INDEX "fee_transactions_institutionId_status_idx" ON "fee_transactions"("institutionId", "status");

-- CreateIndex
CREATE INDEX "fee_transactions_institutionId_studentId_idx" ON "fee_transactions"("institutionId", "studentId");

-- CreateIndex
CREATE INDEX "payroll_entries_institutionId_month_idx" ON "payroll_entries"("institutionId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_entries_facultyId_month_key" ON "payroll_entries"("facultyId", "month");

-- CreateIndex
CREATE INDEX "attendance_institutionId_courseId_date_idx" ON "attendance"("institutionId", "courseId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_studentId_courseId_date_key" ON "attendance"("studentId", "courseId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_transactions" ADD CONSTRAINT "fee_transactions_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_transactions" ADD CONSTRAINT "fee_transactions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
