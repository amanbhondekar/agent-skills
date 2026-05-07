import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as {
    name: string;
    email: string;
    role: string;
    image?: string;
  };

  return (
    <AppShell
      user={{
        name:      user.name ?? 'User',
        email:     user.email ?? '',
        role:      user.role ?? 'ADMIN',
        avatarUrl: user.image,
      }}
    >
      {children}
    </AppShell>
  );
}
