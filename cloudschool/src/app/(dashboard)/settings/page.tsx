import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Card, CardHeader } from '@/components/ui/Card';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { name?: string; email?: string; role?: string; institutionId?: string };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Settings</h2>
        <p className="text-sm text-[var(--text-tertiary)]">Manage your account and institution settings</p>
      </div>

      <Card padding="md">
        <CardHeader title="Account" subtitle="Your profile information" />
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--text-secondary)]">Name</dt>
            <dd className="text-[var(--text-primary)] font-medium">{user?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--text-secondary)]">Email</dt>
            <dd className="text-[var(--text-primary)]">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--text-secondary)]">Role</dt>
            <dd className="text-[var(--text-primary)] capitalize">{user?.role?.toLowerCase()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--text-secondary)]">Institution ID</dt>
            <dd className="text-[var(--text-tertiary)] font-mono text-xs">{user?.institutionId}</dd>
          </div>
        </dl>
      </Card>

      <Card padding="md">
        <CardHeader title="Appearance" subtitle="Theme and display preferences" />
        <p className="text-sm text-[var(--text-tertiary)]">
          Use the theme toggle in the top bar to switch between dark and light mode.
          Your preference is saved locally.
        </p>
      </Card>
    </div>
  );
}
