'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  FileText, CreditCard, DollarSign, Settings, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Students',   href: '/students',   icon: Users },
  { label: 'Faculty',    href: '/faculty',    icon: GraduationCap },
  { label: 'Courses',    href: '/courses',    icon: BookOpen },
  { label: 'Grades',     href: '/grades',     icon: FileText },
  { label: 'Fees',       href: '/fees',       icon: CreditCard },
  { label: 'Payroll',    href: '/payroll',    icon: DollarSign },
  { label: 'Settings',   href: '/settings',   icon: Settings },
];

interface SidebarProps {
  user: { name: string; email: string; role: string; avatarUrl?: string | null };
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ user, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="sidebar"
        className={cn(
          'fixed top-0 left-0 h-full w-[var(--sidebar-w)] z-40 flex flex-col',
          'bg-[var(--color-bg-base)] border-r border-[var(--border-subtle)]',
          'transition-transform duration-[var(--dur-std)]',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-[var(--topbar-h)] px-4 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[var(--radius-md)] bg-[var(--color-brand)] flex items-center justify-center">
              <GraduationCap size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[var(--text-primary)]">CloudSchool</span>
          </div>
          <button
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="md:hidden w-7 h-7 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Primary">
          <ul role="list" className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={onMobileClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                      active
                        ? 'bg-[var(--color-brand-alpha-10)] text-[var(--text-brand)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--text-primary)]',
                    )}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-2 px-2 py-2 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-elevated)] transition-colors">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">{user.name}</p>
              <p className="text-xs text-[var(--text-tertiary)] truncate capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
