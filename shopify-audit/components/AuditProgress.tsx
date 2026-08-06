'use client';

import { useEffect, useState } from 'react';

interface ProgressData {
  status: string;
  findings: number;
  critical: number;
  high: number;
}

export function AuditProgress({
  jobId,
  onComplete,
}: {
  jobId: string;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState<ProgressData>({
    status: 'connecting',
    findings: 0,
    critical: 0,
    high: 0,
  });
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource(`/api/stream/${jobId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === 'connected') {
        setProgress((p) => ({ ...p, status: 'running' }));
      }

      if (data.event === 'status-update') {
        setProgress({
          status: data.status,
          findings: data.findings || 0,
          critical: data.critical || 0,
          high: data.high || 0,
        });

        if (data.status === 'complete' || data.status === 'failed') {
          eventSource.close();
          if (data.status === 'complete') {
            onComplete();
          }
        }
      }

      if (data.event === 'timeout') {
        eventSource.close();
        setProgress((p) => ({ ...p, status: 'timeout' }));
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [jobId, onComplete]);

  const statusLabel =
    progress.status === 'running'
      ? 'Auditing store'
      : progress.status === 'complete'
        ? 'Audit complete'
        : progress.status === 'failed'
          ? 'Audit failed'
          : progress.status === 'timeout'
            ? 'Audit timed out'
            : 'Connecting';

  const isActive = progress.status === 'running' || progress.status === 'connecting';

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        {isActive && (
          <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        <span className="text-lg font-medium text-gray-900">
          {statusLabel}{isActive ? dots : ''}
        </span>
      </div>

      {isActive && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 animate-pulse"
            style={{ width: '60%' }}
          />
        </div>
      )}

      <div className="flex gap-6 text-sm text-gray-500">
        <span>Findings: {progress.findings}</span>
        {progress.critical > 0 && (
          <span className="text-red-600">Critical: {progress.critical}</span>
        )}
        {progress.high > 0 && (
          <span className="text-orange-600">High: {progress.high}</span>
        )}
      </div>

      {isActive && (
        <p className="text-sm text-gray-400">
          This usually takes 25–30 seconds
        </p>
      )}
    </div>
  );
}
