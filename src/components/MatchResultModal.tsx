'use client';

import React, { useEffect, useState } from 'react';
import { useMatchStore } from '@/store/useMatchStore';
import { verifyMatchReplay, generateVerificationReport } from '@/lib/replay';
import { VerificationResult } from '@/types/match';

export const MatchResultModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { matchResult, verificationStatus, setVerificationStatus } = useMatchStore();
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isOpen || !matchResult) return;

    // Auto-verify when modal opens
    const verifyMatch = async () => {
      setIsVerifying(true);
      try {
        const result = await verifyMatchReplay(matchResult.matchId);
        setVerification(result);
        setVerificationStatus(result.valid ? 'verified' : 'failed');
      } catch (error) {
        console.error('Verification failed:', error);
        setVerificationStatus('failed');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyMatch();
  }, [isOpen, matchResult, setVerificationStatus]);

  const handleMintNFT = async () => {
    if (!matchResult) return;

    setIsMinting(true);
    setMintStatus('pending');

    try {
      // In production, call smart contract to mint first-win NFT
      // For now, simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate successful mint
      setMintStatus('success');
      setTimeout(() => {
        setMintStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('NFT mint failed:', error);
      setMintStatus('error');
    } finally {
      setIsMinting(false);
    }
  };

  const handleViewOnBase = () => {
    if (!matchResult) return;

    const explorerUrl = `https://basescan.org/tx/${matchResult.resultHash}`;
    window.open(explorerUrl, '_blank');
  };

  if (!isOpen || !matchResult) return null;

  const homeWon = matchResult.result.home > matchResult.result.away;
  const isHomePlayer = matchResult.homeTeam.formation === 1; // Simplified check

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {homeWon ? '🏆' : '⚽'} Match Complete
              </h2>
              <p className="text-blue-100">Match ID: {matchResult.matchId.slice(0, 12)}...</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Final Score */}
        <div className="border-b p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Final Score</h3>
          <div className="flex justify-around items-center">
            <div className="text-center">
              <p className="text-6xl font-bold text-blue-600">{matchResult.result.home}</p>
              <p className="text-gray-600 mt-2">Home Team</p>
            </div>
            <div className="text-2xl font-bold text-gray-400">vs</div>
            <div className="text-center">
              <p className="text-6xl font-bold text-red-600">{matchResult.result.away}</p>
              <p className="text-gray-600 mt-2">Away Team</p>
            </div>
          </div>
        </div>

        {/* Player Stats */}
        <div className="border-b p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Match Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded p-4">
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-lg font-semibold text-gray-800">
                {Math.floor(matchResult.duration / 60000)} min
              </p>
            </div>
            <div className="bg-blue-50 rounded p-4">
              <p className="text-sm text-gray-600">Total Actions</p>
              <p className="text-lg font-semibold text-gray-800">{matchResult.inputs.length}</p>
            </div>
            <div className="bg-green-50 rounded p-4">
              <p className="text-sm text-gray-600">Home Possession</p>
              <p className="text-lg font-semibold text-gray-800">~50%</p>
            </div>
            <div className="bg-red-50 rounded p-4">
              <p className="text-sm text-gray-600">Away Possession</p>
              <p className="text-lg font-semibold text-gray-800">~50%</p>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">On-Chain Verification</h3>
            {isVerifying && <div className="animate-spin text-blue-600">⟳</div>}
          </div>

          {verification && (
            <div
              className={`rounded-lg p-4 ${
                verification.valid
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <p className={`font-semibold mb-2 ${verification.valid ? 'text-green-800' : 'text-red-800'}`}>
                {verification.valid ? '✅ Match Verified' : '❌ Verification Failed'}
              </p>
              <p className="text-sm text-gray-700 mb-3">{verification.details.message}</p>

              {verification.valid && (
                <div className="bg-white rounded p-3 font-mono text-xs text-gray-600 break-all">
                  Hash: {verification.computed.slice(0, 20)}...
                </div>
              )}
            </div>
          )}

          {!verification && !isVerifying && (
            <div className="bg-gray-50 rounded p-4 text-center text-gray-600">
              Verification pending...
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 flex gap-3">
          {verification?.valid && (
            <>
              {matchResult.result.home > matchResult.result.away && isHomePlayer && (
                <button
                  onClick={handleMintNFT}
                  disabled={isMinting || mintStatus === 'success'}
                  className={`flex-1 py-3 rounded font-semibold transition-colors ${
                    mintStatus === 'success'
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400'
                  }`}
                >
                  {mintStatus === 'pending' && 'Minting NFT...'}
                  {mintStatus === 'success' && '✅ NFT Minted!'}
                  {mintStatus === 'idle' && '🎁 Mint Victory NFT (Gasless)'}
                  {mintStatus === 'error' && '❌ Mint Failed'}
                </button>
              )}

              <button
                onClick={handleViewOnBase}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors"
              >
                View on BaseScan →
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchResultModal;
