import type { Metadata } from 'next';
import type { Faculty } from '@/generated/prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Faculty' };

export default async function FacultyPage() {
  const session = await getServerSession(authOptions);
  const institutionId = (session?.user as { institutionId?: string })?.institutionId ?? '';

  const faculty = await prisma.faculty.findMany({
    where: { institutionId },
    orderBy: { name: 'asc' },
  });

  const byDept = faculty.reduce<Record<string, Faculty[]>>((acc, f) => {
    (acc[f.department] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Faculty</h2>
          <p className="text-sm text-[var(--text-tertiary)]">{faculty.length} members</p>
        </div>
      </div>

      {faculty.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-[var(--text-tertiary)]">No faculty members yet.</p>
        </div>
      ) : (
        Object.entries(byDept).map(([dept, members]: [string, Faculty[]]) => (
          <section key={dept}>
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
              {dept} · {members.length}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((f) => (
                <Card key={f.id} padding="md" className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={f.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{f.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{f.designation}</p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">{f.email}</p>
                    </div>
                    <Badge variant={f.status === 'active' ? 'success' : 'danger'} dot>
                      {f.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)]">Salary</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {formatCurrency(Number(f.salary))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-tertiary)]">Joined</p>
                      <p className="text-xs text-[var(--text-secondary)]">{formatDate(f.joinDate)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
