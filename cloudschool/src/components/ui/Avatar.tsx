import Image from 'next/image';
import { cn, avatarColor, initials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
};

const colorStyles: Record<string, string> = {
  'av-blue':   'bg-[rgba(61,82,229,0.2)] text-[#3D52E5]',
  'av-green':  'bg-[rgba(34,197,94,0.2)] text-[#22c55e]',
  'av-purple': 'bg-[rgba(168,85,247,0.2)] text-[#a855f7]',
  'av-orange': 'bg-[rgba(249,115,22,0.2)] text-[#f97316]',
  'av-pink':   'bg-[rgba(236,72,153,0.2)] text-[#ec4899]',
  'av-teal':   'bg-[rgba(20,184,166,0.2)] text-[#14b8a6]',
  'av-yellow': 'bg-[rgba(234,179,8,0.2)] text-[#eab308]',
  'av-red':    'bg-[rgba(239,68,68,0.2)] text-[#ef4444]',
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const color = avatarColor(name);
  const sizeClass = sizeStyles[size];

  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden shrink-0', sizeClass, className)}>
        <Image src={src} alt={name} fill className="object-cover" sizes="48px" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold shrink-0',
        sizeClass,
        colorStyles[color],
        className,
      )}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
