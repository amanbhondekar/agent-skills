'use client';

import { useState } from 'react';
import { Menu, Search, Bell, Sun, Moon, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/themeStore';

interface TopbarProps {
  title?: string;
  onMenuClick: () => void;
  notifCount?: number;
  onSearchClick?: () => void;
  onNotifClick?: () => void;
}

export function Topbar({ title, onMenuClick, notifCount = 0, onSearchClick, onNotifClick }: TopbarProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header
      className={cn(
        'fixed top-0 left-0 md:left-[var(--sidebar-w)] right-0 z-20',
        'h-[var(--topbar-h)] flex items-center justify-between gap-4 px-4',
        'bg-[var(--color-bg-canvas)] border-b border-[var(--border-subtle)]',
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          aria-controls="sidebar"
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Menu size={18} />
        </button>
        {title && (
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h1>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <button
          onClick={onSearchClick}
          aria-label="Open search (Ctrl+K)"
          aria-keyshortcuts="Control+k Meta+k"
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Search size={16} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <button
          onClick={onNotifClick}
          aria-label={notifCount > 0 ? `${notifCount} unread notifications` : 'Notifications'}
          className="relative w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Bell size={16} />
          {notifCount > 0 && (
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-danger)]"
              aria-hidden="true"
            />
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          aria-label="Sign out"
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
