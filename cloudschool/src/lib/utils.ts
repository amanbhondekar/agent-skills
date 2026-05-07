import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AVATAR_COLORS = [
  'av-blue', 'av-green', 'av-purple', 'av-orange',
  'av-pink', 'av-teal', 'av-yellow', 'av-red',
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

export function avatarColor(seed: string): AvatarColor {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function statusBadge(status: string): string {
  const map: Record<string, string> = {
    active:    'badge-success',
    inactive:  'badge-danger',
    pending:   'badge-warning',
    paid:      'badge-success',
    unpaid:    'badge-danger',
    partial:   'badge-warning',
    overdue:   'badge-danger',
    passed:    'badge-success',
    failed:    'badge-danger',
    enrolled:  'badge-info',
    completed: 'badge-success',
    dropped:   'badge-neutral',
  };
  return map[status.toLowerCase()] ?? 'badge-neutral';
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
