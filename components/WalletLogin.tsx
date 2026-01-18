'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { RainbowConnectButton } from './WalletConnector';
import { useUserIdentity, useGameReady } from '@/hooks/useUserIdentity';

interface WalletLoginProps {
  onLoginSuccess?: (address: string) => void;
  onLoginFailed?: (error: string) => void;
  requiredChain?: 'base' | 'sepolia';
}

/**
 * WalletLogin Component
 * Beautiful login screen for Web3 wallet authentication
 * Supports multiple wallet providers
 */
export function WalletLogin({
  onLoginSuccess,
  onLoginFailed,
  requiredChain = 'base',
}: WalletLoginProps) {
  const { address, isConnected } = useAccount();
  const { isOnBase, switchToBase, formattedAddress, balance } = useUserIdentity();
  const { isGameReady, readyChecks } = useGameReady();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isConnected && address && isOnBase) {
      onLoginSuccess?.(address);
    }
  }, [isConnected, address, isOnBase, onLoginSuccess]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
            ⚽ Bass Ball
          </h1>
          <p className="text-gray-300 text-lg">Football on Base Chain</p>
          <p className="text-gray-400 text-sm mt-2">Connect your Web3 wallet to play</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800 rounded-2xl border border-blue-500/30 p-8 shadow-2xl">
          {!isConnected ? (
            <>
              {/* Not Connected State */}
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-blue-900/30 rounded-full mb-4">
                  <svg
                    className="w-12 h-12 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
                <p className="text-gray-400 text-sm">
                  Choose a wallet to connect to Bass Ball
                </p>
              </div>

              {/* Supported Wallets Info */}
              <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-sm text-gray-300 font-semibold mb-3">Supported Wallets:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">•</span> MetaMask
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">•</span> Coinbase Wallet
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">•</span> WalletConnect
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">•</span> Rainbow Wallet
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">•</span> Brave Wallet
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">•</span> More...
                  </div>
                </div>
              </div>

              {/* RainbowKit Connect Button */}
              <div className="flex justify-center mb-6">
                <RainbowConnectButton />
              </div>

              {/* Network Info */}
              <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <p className="text-xs text-cyan-300 text-center">
                  🌐 This game requires the Base network (EVM compatible)
                </p>
              </div>
            </>
          ) : !isOnBase ? (
            <>
              {/* Wrong Network State */}
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-yellow-900/30 rounded-full mb-4">
                  <svg
                    className="w-12 h-12 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4v2m0 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Wrong Network</h2>
                <p className="text-gray-400 text-sm">Please switch to the Base network</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Connected Wallet:</p>
                  <p className="text-white font-mono text-sm">{formattedAddress}</p>
                </div>

                <button
                  onClick={switchToBase}
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  Switch to Base Network
                </button>
              </div>

              <p className="text-xs text-center text-gray-400">
                Need to add Base? Your wallet will prompt you automatically when you click the button above.
              </p>
            </>
          ) : (
            <>
              {/* Connected & Ready State */}
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-green-900/30 rounded-full mb-4 animate-pulse">
                  <svg
                    className="w-12 h-12 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Wallet Connected!</h2>
                <p className="text-gray-400 text-sm">Ready to play Bass Ball</p>
              </div>

              <div className="space-y-3 mb-6">
                {/* Address Display */}
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Wallet Address:</p>
                  <p className="text-white font-mono text-sm">{formattedAddress}</p>
                </div>

                {/* Balance Display */}
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">ETH Balance:</p>
                  <p className="text-white font-mono text-sm">{balance} ETH</p>
                </div>

                {/* Network Display */}
                <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-300 mb-1">Network:</p>
                  <p className="text-white font-semibold">🌐 Base Chain</p>
                </div>
              </div>

              <button
                onClick={() => onLoginSuccess?.(address!)}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                ⚽ Enter Bass Ball
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-400">
          <p>🔐 Your private keys stay secure with your wallet provider</p>
          <p className="mt-2">Powered by wagmi • RainbowKit • Base Chain</p>
        </div>
      </div>
    </div>
  );
}
