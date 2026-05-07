'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '@/lib/utils';

interface AppShellProps {
  user: { name: string; email: string; role: string; avatarUrl?: string | null };
  title?: string;
  notifCount?: number;
  children: React.ReactNode;
}

export function AppShell({ user, title, notifCount = 0, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Sidebar
        user={user}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="md:ml-[var(--sidebar-w)] flex flex-col min-h-screen">
        <Topbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
          notifCount={notifCount}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 mt-[var(--topbar-h)] p-5 md:p-6',
            'focus:outline-none',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
