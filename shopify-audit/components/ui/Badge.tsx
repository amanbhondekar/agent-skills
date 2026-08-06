'use client';

const severityStyles: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

export function Badge({
  severity,
  label,
}: {
  severity: string;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${severityStyles[severity] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
    >
      {label || severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}
