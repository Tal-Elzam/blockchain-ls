'use client';

import { useEffect, useState } from 'react';

import { BlockchainService } from '@/lib/services/blockchain-service';

import type { ApiLogEntry } from '@/lib/types/blockchain';

export default function ApiLogWindow() {
  const [isOpen, setIsOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<ApiLogEntry[]>([]);
  const [logCount, setLogCount] = useState(0);

  // Update log count always (even when closed) - for the badge
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLog = BlockchainService.getApiLog();
      setLogCount(currentLog.length);

      // Also update full entries if window is open
      if (isOpen) {
        setLogEntries(currentLog);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Update once when opening
  useEffect(() => {
    if (isOpen) {
      const currentLog = BlockchainService.getApiLog();

      setLogEntries(currentLog);
      setLogCount(currentLog.length);
    }
  }, [isOpen]);

  const clearLog = () => {
    BlockchainService.clearApiLog();
    setLogEntries([]);
    setLogCount(0);
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-500';
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-500';
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 px-4 py-2 text-white shadow-lg hover:bg-blue-700"
      >
        API Log ({logCount})
      </button>

      {isOpen && (
        <div className="fixed bottom-4 right-4 z-40 w-96 rounded-lg border border-gray-300 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 p-3">
            <h3 className="font-semibold">API Call Log</h3>
            <div className="flex gap-2">
              <button onClick={clearLog} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
                Clear
              </button>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {logEntries.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No API calls yet</div>
            ) : (
              <div className="space-y-2">
                {logEntries.map((entry) => (
                  <div key={entry.id} className="rounded border border-gray-200 p-2 text-xs">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold">{entry.method}</span>
                      <div className="flex items-center gap-2">
                        {entry.status && <span className={getStatusColor(entry.status)}>{entry.status}</span>}
                        <span className="text-gray-500">{formatDuration(entry.duration)}</span>
                      </div>
                    </div>
                    <div className="truncate text-gray-600">{entry.url}</div>
                    {entry.error && <div className="mt-1 text-red-600">{entry.error}</div>}
                    {entry.statusText && <div className="mt-1 text-gray-500">{entry.statusText}</div>}
                    <div className="mt-1 text-xs text-gray-400">{new Date(entry.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {logEntries.some((entry) => !entry.status && !entry.error) && (
            <div className="border-t border-gray-200 p-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600"></div>
                <span>Request in progress...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
