'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AuditProgress } from '@/components/AuditProgress';
import { ResultsTable } from '@/components/ResultsTable';
import { MessagePreview } from '@/components/MessagePreview';
import type { Finding } from '@/lib/types';

interface AuditResult {
  jobId: string;
  auditId: string;
  storeUrl: string;
  storeName: string;
  status: string;
  findings: Finding[];
  primaryFinding: Finding | null;
  summary: { total: number; critical: number; high: number };
}

export default function AuditResultsPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [result, setResult] = useState<AuditResult | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');

  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch(`/api/results/${jobId}`);
      if (!response.ok) throw new Error('Failed to fetch results');
      const data = await response.json();
      setResult(data);
      if (data.status === 'complete') {
        setIsComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    }
  }, [jobId]);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <main className="flex-1 px-4 py-8 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <a href="/" className="text-sm text-blue-600 hover:text-blue-800">
          &larr; New Audit
        </a>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Audit Results</h1>

      {result?.storeName && (
        <p className="text-gray-600 mb-6">
          Store: <span className="font-medium">{result.storeName}</span>
          {result.storeUrl && (
            <span className="text-gray-400 ml-2">({result.storeUrl})</span>
          )}
        </p>
      )}

      {!isComplete && (
        <div className="mb-8">
          <AuditProgress jobId={jobId} onComplete={handleComplete} />
        </div>
      )}

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {isComplete && result && (
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">
                {result.summary.total}
              </p>
              <p className="text-sm text-gray-500">Total Findings</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">
                {result.summary.critical}
              </p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">
                {result.summary.high}
              </p>
              <p className="text-sm text-gray-500">High</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Findings</h2>
            </div>
            <ResultsTable findings={result.findings} />
          </div>

          {result.primaryFinding && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <MessagePreview
                primaryFinding={result.primaryFinding}
                storeUrl={result.storeUrl}
              />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
