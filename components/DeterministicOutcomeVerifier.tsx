/**
 * DeterministicOutcomeVerifier Component
 * Displays cryptographic verification of match outcomes
 * Shows hash, seal status, and tampering detection
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { VerifiedMatchRecord, OutcomeVerification, OutcomeProof } from '@/lib/outcomeVerification';
import { MatchRecord } from '@/lib/guestMode';

interface DeterministicOutcomeVerifierProps {
  match: VerifiedMatchRecord | MatchRecord;
  playerId: string;
  compact?: boolean;
  showReport?: boolean;
  onVerificationChange?: (isValid: boolean) => void;
}

/**
 * Hash Badge Component
 * Displays cryptographic hash with status indicator
 */
function HashBadge({
  hash,
  isValid,
  algorithm = 'SHA-256',
}: {
  hash?: string;
  isValid: boolean;
  algorithm?: string;
}) {
  if (!hash) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium border border-yellow-200">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        Hash Pending
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
        isValid
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
      {isValid ? '✓' : '✗'} {algorithm}
      <code className="ml-1 text-xs opacity-75">{hash.substring(0, 12)}...</code>
    </div>
  );
}

/**
 * Seal Status Component
 * Displays tamper-evident seal verification
 */
function SealStatus({
  seal,
  isVerified,
}: {
  seal?: string;
  isVerified: boolean;
}) {
  if (!seal) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
        isVerified
          ? 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-blue-500' : 'bg-red-500'}`} />
      {isVerified ? '🔒' : '⚠️'} Seal {isVerified ? 'Valid' : 'Compromised'}
    </div>
  );
}

/**
 * Proof String Component
 * Displays shareable proof of outcome
 */
function ProofString({
  proof,
  shareableProof,
  onCopy,
}: {
  proof?: string;
  shareableProof?: string;
  onCopy?: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(text);
  };

  if (!proof) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Outcome Proof</div>
      <div className="space-y-1.5">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 font-mono text-xs">
          <div className="break-all text-gray-700">{proof}</div>
        </div>
        {shareableProof && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 font-mono text-xs">
            <div className="text-blue-600 break-all">{shareableProof}</div>
          </div>
        )}
        <button
          onClick={() => handleCopy(shareableProof || proof)}
          className="w-full py-1.5 px-2 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy Proof'}
        </button>
      </div>
    </div>
  );
}

/**
 * Verification Details Component
 * Shows detailed verification information
 */
function VerificationDetails({
  match,
  playerId,
  onClose,
}: {
  match: VerifiedMatchRecord;
  playerId: string;
  onClose?: () => void;
}) {
  const [report, setReport] = useState<string>('');
  const [reVerifying, setReVerifying] = useState(false);
  const [reVerifyResult, setReVerifyResult] = useState<any>(null);

  useEffect(() => {
    async function generateReport() {
      const reportText = await OutcomeVerification.generateVerificationReport(match, playerId);
      setReport(reportText);
    }
    generateReport();
  }, [match, playerId]);

  const handleReVerify = async () => {
    setReVerifying(true);
    const result = await OutcomeVerification.reverifyMatch(match, playerId);
    setReVerifyResult(result);
    setReVerifying(false);
  };

  return (
    <div className="space-y-4">
      {/* Re-verify Button */}
      <button
        onClick={handleReVerify}
        disabled={reVerifying}
        className="w-full py-2 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
      >
        {reVerifying ? 'Re-verifying...' : 'Re-verify Match (Check for Tampering)'}
      </button>

      {/* Re-verify Results */}
      {reVerifyResult && (
        <div
          className={`rounded-lg p-4 ${
            reVerifyResult.stillValid
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="font-semibold mb-2">
            {reVerifyResult.stillValid ? '✓ Match Verified' : '✗ Match Compromised'}
          </div>
          <div className="text-xs space-y-1">
            {reVerifyResult.details.map((detail: string, i: number) => (
              <div key={i}>{detail}</div>
            ))}
          </div>
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-words">
            {report}
          </pre>
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-2 px-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm transition-colors"
        >
          Close
        </button>
      )}
    </div>
  );
}

/**
 * Tampering Alert Component
 */
function TamperingAlert({ details }: { details: string[] }) {
  return (
    <div className="rounded-lg p-4 bg-red-50 border-2 border-red-300">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <div className="font-bold text-red-900 mb-2">Tampering Detected</div>
          <div className="text-sm text-red-800 space-y-1">
            {details.map((detail, i) => (
              <div key={i}>• {detail}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Component: DeterministicOutcomeVerifier
 */
export const DeterministicOutcomeVerifier = React.forwardRef<
  HTMLDivElement,
  DeterministicOutcomeVerifierProps
>(
  (
    {
      match,
      playerId,
      compact = false,
      showReport = false,
      onVerificationChange,
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = useState(showReport);
    const [verifyingMatch, setVerifyingMatch] = useState(false);
    const [verifiedMatch, setVerifiedMatch] = useState<VerifiedMatchRecord | null>(null);
    const [shareableProof, setShareableProof] = useState<string>('');

    // Verify the match on mount if not already verified
    useEffect(() => {
      async function verify() {
        setVerifyingMatch(true);
        try {
          const verified = await OutcomeVerification.applyVerification(match, playerId);
          setVerifiedMatch(verified);
          
          if (verified.proof) {
            const proof = OutcomeProof.generateShareableProof(verified, playerId);
            setShareableProof(proof);
          }

          onVerificationChange?.(verified.integrityVerified ?? false);
        } catch (error) {
          console.error('Verification failed:', error);
          onVerificationChange?.(false);
        } finally {
          setVerifyingMatch(false);
        }
      }

      // Only verify if not already verified
      if (!('resultHash' in match)) {
        verify();
      } else {
        setVerifiedMatch(match as VerifiedMatchRecord);
        if ('proof' in match && match.proof) {
          const proof = OutcomeProof.generateShareableProof(match as VerifiedMatchRecord, playerId);
          setShareableProof(proof);
        }
      }
    }, [match, playerId, onVerificationChange]);

    const isValid = verifiedMatch?.integrityVerified ?? false;
    const hash = verifiedMatch?.resultHash?.hash;
    const seal = verifiedMatch?.seal;
    const proof = verifiedMatch?.proof;

    if (compact && !verifyingMatch) {
      return (
        <div ref={ref} className="flex items-center gap-2">
          <HashBadge
            hash={hash}
            isValid={isValid}
            algorithm={verifiedMatch?.resultHash?.algorithm}
          />
          <SealStatus seal={seal} isVerified={isValid} />
        </div>
      );
    }

    return (
      <div ref={ref} className="space-y-4">
        {/* Status Bar */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900 mb-2">Outcome Verification</div>
              <div className="flex flex-wrap gap-2">
                <HashBadge
                  hash={hash}
                  isValid={isValid}
                  algorithm={verifiedMatch?.resultHash?.algorithm}
                />
                <SealStatus seal={seal} isVerified={isValid} />
              </div>
            </div>
            {!compact && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-xs transition-colors"
              >
                {isExpanded ? 'Hide' : 'Show'} Details
              </button>
            )}
          </div>
        </div>

        {/* Tampering Alert */}
        {!isValid && verifiedMatch && (
          <TamperingAlert
            details={[
              'This match outcome has been modified or corrupted.',
              'The cryptographic hash does not match the current data.',
              'This match should not count toward statistics.',
            ]}
          />
        )}

        {/* Expanded Details */}
        {isExpanded && verifiedMatch && (
          <VerificationDetails
            match={verifiedMatch}
            playerId={playerId}
            onClose={() => setIsExpanded(false)}
          />
        )}

        {/* Proof String */}
        {proof && (
          <ProofString
            proof={proof}
            shareableProof={shareableProof}
            onCopy={(text) => {
              console.log('Proof copied:', text);
            }}
          />
        )}

        {/* Loading State */}
        {verifyingMatch && (
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 flex items-center gap-2">
            <div className="animate-spin">⟳</div>
            <span className="text-sm text-yellow-700">Verifying match outcome...</span>
          </div>
        )}
      </div>
    );
  }
);

DeterministicOutcomeVerifier.displayName = 'DeterministicOutcomeVerifier';

/**
 * Hook for using verification in components
 */
export function useDeterministicVerification(
  match: VerifiedMatchRecord | MatchRecord,
  playerId: string
) {
  const [verified, setVerified] = useState<VerifiedMatchRecord | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [proof, setProof] = useState<string>('');
  const [shareableProof, setShareableProof] = useState<string>('');

  useEffect(() => {
    async function verify() {
      setIsLoading(true);
      try {
        const result = await OutcomeVerification.applyVerification(match, playerId);
        setVerified(result);
        setIsValid(result.integrityVerified ?? false);

        if (result.proof) {
          setProof(result.proof);
          setShareableProof(OutcomeProof.generateShareableProof(result, playerId));
        }
      } catch (error) {
        console.error('Verification error:', error);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    }

    verify();
  }, [match, playerId]);

  return {
    verified,
    isValid,
    isLoading,
    proof,
    shareableProof,
    reVerify: async () => {
      if (!verified) return null;
      return OutcomeVerification.reverifyMatch(verified, playerId);
    },
  };
}

export default DeterministicOutcomeVerifier;
