/**
 * All-EVM Wallet UI Components
 * Production-ready components for wallet management across all EVM chains
 */

'use client';

import React, { useMemo } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAllEVMWallet, useAvailableEVMChains, useChainSwitcher } from '@/hooks/useAllEVMWallet';
import { getChainMetadata } from '@/lib/wagmiAllEVMConfig';

/**
 * Enhanced Connect Button with Chain Selector
 */
export function AllEVMConnectButton() {
  return (
    <div className="flex items-center gap-2">
      <ConnectButton />
    </div>
  );
}

/**
 * Chain Switcher Dropdown Component
 */
export function ChainSwitcher() {
  const { chainId, isConnected } = useAllEVMWallet();
  const { allChains, chainsByCategory } = useAvailableEVMChains();
  const { switchChainSafely, isSwitching } = useChainSwitcher();

  if (!isConnected) {
    return null;
  }

  const currentChainMetadata = chainId ? getChainMetadata(chainId) : null;

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded-lg">
        <span className="text-xs text-gray-400">Chain:</span>
        <span className="font-semibold text-blue-300">{currentChainMetadata?.name || 'Unknown'}</span>
        <span className="text-lg">🔗</span>
      </div>

      <div className="absolute top-full mt-2 left-0 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
        {Object.entries(chainsByCategory).map(([category, chainsList]) => (
          <div key={category}>
            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase border-b border-gray-700">
              {category}
            </div>
            {chainsList.map(chain => (
              <button
                key={chain.id}
                onClick={() => switchChainSafely(chain.id)}
                disabled={isSwitching || chain.id === chainId}
                className={`w-full text-left px-4 py-3 text-sm transition-all ${
                  chain.id === chainId
                    ? 'bg-blue-900/50 border-l-2 border-blue-500 text-blue-300 font-semibold'
                    : 'text-gray-300 hover:bg-gray-800'
                } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span>{chain.name}</span>
                  {chain.id === chainId && <span>✓</span>}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Wallet Status Badge Component
 */
export function WalletStatusBadge() {
  const {
    isConnected,
    formattedAddress,
    chainName,
    balance,
    balanceSymbol,
    isCurrentChainSupported,
  } = useAllEVMWallet();

  if (!isConnected) {
    return (
      <div className="px-3 py-2 bg-red-900/30 border border-red-500/30 rounded-full text-sm text-red-300">
        ❌ Not Connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-500/30 rounded-full text-sm">
      <span className="text-green-300">✓</span>
      <span className="font-mono text-green-300">{formattedAddress}</span>
      <span className="text-xs text-gray-400">•</span>
      <span className={isCurrentChainSupported ? 'text-green-300' : 'text-red-300'}>
        {chainName}
      </span>
      <span className="text-xs text-gray-400">•</span>
      <span className="text-green-300">
        {balance} {balanceSymbol}
      </span>
    </div>
  );
}

/**
 * Chain Grid Component - Display all supported chains
 */
export function AvailableChainsGrid() {
  const { allChains, chainsByCategory } = useAvailableEVMChains();
  const { chainId } = useAllEVMWallet();
  const { switchChainSafely, isSwitching } = useChainSwitcher();

  return (
    <div className="space-y-6">
      {Object.entries(chainsByCategory).map(([category, chainsList]) => (
        <div key={category}>
          <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase">{category}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {chainsList.map(chain => (
              <button
                key={chain.id}
                onClick={() => switchChainSafely(chain.id)}
                disabled={isSwitching}
                className={`p-3 rounded-lg border transition-all ${
                  chain.id === chainId
                    ? 'bg-blue-900/50 border-blue-500 text-blue-300'
                    : 'bg-gray-800/30 border-gray-700 text-gray-300 hover:border-blue-500 hover:text-blue-300'
                } ${isSwitching ? 'opacity-50' : ''}`}
              >
                <p className="text-xs font-semibold">{chain.name}</p>
                <p className="text-xs text-gray-400 mt-1">{chain.category}</p>
                {chain.id === chainId && <p className="text-xs text-blue-300 mt-1">✓ Active</p>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Multi-Chain Wallet Display Component
 */
export function MultiChainWalletDisplay() {
  const {
    isConnected,
    formattedAddress,
    chainName,
    balance,
    balanceSymbol,
    availableChainIds,
  } = useAllEVMWallet();

  if (!isConnected) {
    return (
      <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
        <p className="text-gray-400">Please connect your wallet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Info */}
      <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Wallet Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Address:</span>
            <span className="font-mono text-blue-300">{formattedAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Current Chain:</span>
            <span className="text-blue-300">{chainName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Balance:</span>
            <span className="text-green-300">
              {balance} {balanceSymbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Supported Chains:</span>
            <span className="text-blue-300">{availableChainIds.length}</span>
          </div>
        </div>
      </div>

      {/* Chain Selector */}
      <div>
        <h3 className="text-sm font-bold text-gray-300 mb-3">Switch Chain</h3>
        <ChainSwitcher />
      </div>
    </div>
  );
}

/**
 * Chain Info Card Component
 */
export function ChainInfoCard({ chainId }: { chainId: number }) {
  const metadata = getChainMetadata(chainId);

  if (!metadata) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
      <h4 className="font-semibold text-white mb-2">{metadata.name}</h4>
      <div className="space-y-1 text-sm text-gray-400">
        <p>Category: {metadata.category}</p>
        <p>Network: {metadata.isMainnet ? 'Mainnet' : 'Testnet'}</p>
        <a
          href={`${metadata.explorer}/address/${chainId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300"
        >
          View on Explorer →
        </a>
      </div>
    </div>
  );
}

/**
 * Wallet Connection Status Component
 */
export function WalletConnectionStatus() {
  const { isConnected, connector, address, chainName } = useAllEVMWallet();

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
        isConnected
          ? 'bg-green-900/30 border border-green-500/30 text-green-300'
          : 'bg-red-900/30 border border-red-500/30 text-red-300'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
      {isConnected ? (
        <>
          <span>✓ Connected</span>
          {connector && <span className="text-xs text-gray-400">• {connector}</span>}
        </>
      ) : (
        <span>❌ Not Connected</span>
      )}
    </div>
  );
}

export default {
  AllEVMConnectButton,
  ChainSwitcher,
  WalletStatusBadge,
  AvailableChainsGrid,
  MultiChainWalletDisplay,
  ChainInfoCard,
  WalletConnectionStatus,
};
