'use client';

import { Badge } from '@/components/ui/Badge';
import type { Finding } from '@/lib/types';

export function ResultsTable({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No findings to display.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
              Severity
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
              Rule
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
              Finding
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
              Impact
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
              Recommendation
            </th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding) => (
            <tr
              key={finding.id}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="py-3 px-4">
                <Badge severity={finding.severity} />
              </td>
              <td className="py-3 px-4 text-sm font-mono text-gray-600">
                {finding.rule_id}
              </td>
              <td className="py-3 px-4 text-sm text-gray-900 max-w-xs">
                {finding.finding}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                {finding.impact}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                {finding.recommendation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
