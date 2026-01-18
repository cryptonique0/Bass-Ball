/**
 * On-Chain Match Status Component
 * Displays blockchain verification status and on-chain record information
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { MatchLog } from '../lib/matchLogger';
import OnChainMatchStorage, { type OnChainMatchSummary, type OnChainTransaction } from '../lib/onChainMatchStorage';

interface OnChainMatchStatusProps {
  match: MatchLog;
  compact?: boolean;
  showDetails?: boolean;
}

/**
 * OnChainMatchStatus Component
 * Shows verification status and on-chain details
 */
export function OnChainMatchStatus({ match, compact = false, showDetails = true }: OnChainMatchStatusProps) {
  const [summary, setSummary] = useState<OnChainMatchSummary | null>(null);
  const [transaction, setTransaction] = useState<OnChainTransaction | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const storage = OnChainMatchStorage.getInstance();
      const storedSummary = storage.getSummary(match.id);
      const storedTx = storage.getTransaction(match.id);

      setSummary(storedSummary || null);
      setTransaction(storedTx || null);

      if (storedSummary) {
        const isVerified = await storage.verifyMatchResult(match);
        setVerified(isVerified);
      }

      setLoading(false);
    };

    checkStatus();
  }, [match]);

  const handleStoreOnChain = async () => {
    setLoading(true);
    try {
      const storage = OnChainMatchStorage.getInstance();
      const tx = await storage.storeMatchResult(match);
      setTransaction(tx);

      const storedSummary = storage.getSummary(match.id);
      setSummary(storedSummary || null);

      const isVerified = await storage.verifyMatchResult(match);
      setVerified(isVerified);
    } catch (error) {
      console.error('Failed to store on-chain:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const storage = OnChainMatchStorage.getInstance();
      const isVerified = await storage.verifyMatchResult(match);
      setVerified(isVerified);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        {transaction ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-blockchain">
                {verified ? '✓' : '?'} On-Chain
              </span>
              {verified && <span className="text-xs text-success">Verified</span>}
              {verified === false && <span className="text-xs text-warning">Mismatch</span>}
            </div>
          </div>
        ) : (
          <button
            onClick={handleStoreOnChain}
            disabled={loading}
            className="px-2 py-1 text-xs font-semibold rounded bg-blockchain text-white hover:bg-blockchain/90 disabled:opacity-50"
          >
            {loading ? 'Storing...' : 'Store On-Chain'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-slate-50 to-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">On-Chain Status</h3>
        {transaction && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              verified
                ? 'bg-success/20 text-success'
                : verified === false
                  ? 'bg-warning/20 text-warning'
                  : 'bg-info/20 text-info'
            }`}
          >
            {verified ? '✓ Verified' : verified === false ? '⚠ Mismatch' : '◐ Pending'}
          </span>
        )}
      </div>

      {/* Status Message */}
      {!transaction ? (
        <div className="mb-4 text-sm text-gray-600">
          <p className="mb-3">This match has not been stored on-chain yet.</p>
          <button
            onClick={handleStoreOnChain}
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-blockchain text-white font-semibold hover:bg-blockchain/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Storing to Blockchain...' : 'Store Match On-Chain'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          {summary && showDetails && (
            <div className="rounded-lg bg-white p-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Match Result:</span>
                <span className="font-bold text-gray-900">
                  {summary.homeTeam} {summary.homeScore} - {summary.awayScore} {summary.awayTeam}
                </span>
              </div>

              {summary.topScorer && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Top Scorer:</span>
                  <span className="font-semibold text-gray-900">
                    {summary.topScorer} ({summary.topScorerGoals} goals)
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Recorded:</span>
                <span className="text-gray-900">{new Date(summary.timestamp * 1000).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Transaction Details */}
          <div className="rounded-lg bg-white p-3 space-y-2 text-sm">
            <div className="flex justify-between items-center font-mono text-xs">
              <span className="text-gray-600">TX Hash:</span>
              <span className="text-gray-900 truncate flex-1 ml-2 text-right">{transaction.txHash}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Block:</span>
              <span className="font-semibold text-gray-900">{transaction.blockNumber}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status:</span>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  transaction.status === 'confirmed'
                    ? 'bg-success/20 text-success'
                    : transaction.status === 'pending'
                      ? 'bg-warning/20 text-warning'
                      : 'bg-error/20 text-error'
                }`}
              >
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Hashes */}
          {summary && showDetails && (
            <details className="rounded-lg bg-white p-3 text-sm">
              <summary className="cursor-pointer font-semibold text-gray-900 hover:text-blockchain">
                Verification Hashes
              </summary>
              <div className="mt-2 space-y-2 font-mono text-xs">
                <div>
                  <div className="text-gray-600 mb-1">Result Hash:</div>
                  <div className="text-gray-900 break-all bg-gray-100 p-2 rounded">{summary.resultHash}</div>
                </div>
                {summary.matchDataHash && (
                  <div>
                    <div className="text-gray-600 mb-1">Full Data Hash:</div>
                    <div className="text-gray-900 break-all bg-gray-100 p-2 rounded">{summary.matchDataHash}</div>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleVerify}
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg bg-info/20 text-info font-semibold hover:bg-info/30 disabled:opacity-50 transition-colors text-sm"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              onClick={() => {
                const report = OnChainMatchStorage.getInstance().generateSummaryReport(summary!);
                const blob = new Blob([report], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `on-chain-${match.id}.txt`;
                a.click();
              }}
              className="flex-1 px-3 py-2 rounded-lg bg-success/20 text-success font-semibold hover:bg-success/30 transition-colors text-sm"
            >
              Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * OnChainStoragePanel
 * Admin panel showing all on-chain stored matches
 */
export function OnChainStoragePanel() {
  const [matches, setMatches] = useState<
    Array<{ matchId: string; summary: OnChainMatchSummary; tx: OnChainTransaction }>
  >([]);

  useEffect(() => {
    const storage = OnChainMatchStorage.getInstance();
    const stored = storage.getAllStoredMatches();
    setMatches(stored);
  }, []);

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
        No matches stored on-chain yet
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-bold text-gray-900">On-Chain Matches ({matches.length})</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {matches.map((item) => (
          <div key={item.matchId} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900">
                {item.summary.homeTeam} {item.summary.homeScore} - {item.summary.awayScore}{' '}
                {item.summary.awayTeam}
              </div>
              <span className="text-xs font-mono text-gray-500">{item.matchId.slice(0, 8)}...</span>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <div>TX: {item.tx.txHash.slice(0, 16)}... | Block: {item.tx.blockNumber}</div>
              <div>Stored: {new Date(item.summary.timestamp * 1000).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OnChainMatchStatus;
