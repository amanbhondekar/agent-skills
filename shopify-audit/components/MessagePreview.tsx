'use client';

import { useState } from 'react';
import type { OutreachMessage, Finding } from '@/lib/types';

export function MessagePreview({
  primaryFinding,
  storeUrl,
}: {
  primaryFinding: Finding;
  storeUrl: string;
}) {
  const [prospectLinkedIn, setProspectLinkedIn] = useState('');
  const [message, setMessage] = useState<OutreachMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'linkedin' | 'email'>('linkedin');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryFinding: {
            finding: primaryFinding.finding,
            impact: primaryFinding.impact,
            recommendation: primaryFinding.recommendation,
          },
          prospectLinkedIn,
          storeUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate message');

      const data = await response.json();
      setMessage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Generate Outreach Message
      </h3>

      <div>
        <label
          htmlFor="prospect"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Prospect LinkedIn Profile (paste text)
        </label>
        <textarea
          id="prospect"
          rows={3}
          value={prospectLinkedIn}
          onChange={(e) => setProspectLinkedIn(e.target.value)}
          placeholder="Paste the prospect's LinkedIn profile summary here..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 text-sm"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        {isLoading ? 'Generating...' : 'Generate Message'}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {message && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('linkedin')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'linkedin'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              LinkedIn DM ({message.linkedin.wordCount} words)
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'email'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Email ({message.email.wordCount} words)
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'linkedin' ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {message.linkedin.content}
                </p>
                <button
                  onClick={() => handleCopy(message.linkedin.content)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {copied ? 'Copied!' : 'Copy to clipboard'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Subject
                </p>
                <p className="text-sm text-gray-900 font-medium">
                  {message.email.subject}
                </p>
                <p className="text-xs font-semibold text-gray-500 uppercase mt-3">
                  Body
                </p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {message.email.body}
                </p>
                <button
                  onClick={() =>
                    handleCopy(
                      `Subject: ${message.email.subject}\n\n${message.email.body}`
                    )
                  }
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {copied ? 'Copied!' : 'Copy to clipboard'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
