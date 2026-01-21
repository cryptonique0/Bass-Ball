'use client';

import React, { useState, useEffect } from 'react';
import { useWalletEvents, WALLET_PROVIDERS, detectInstalledWallets } from '../lib/walletProviders';
import { useWallet } from '../hooks/useWallet';
import { formatEther } from 'viem';

interface ProviderSelectorProps {
  onConnect?: () => void;
  className?: string;
}

export const ProviderSelector = ({ onConnect, className = '' }: ProviderSelectorProps) => {
  const { connect, connectors, state } = useWallet();
  const [installedWallets, setInstalledWallets] = useState<string[]>([]);

  useEffect(() => {
    setInstalledWallets(detectInstalledWallets());
  }, []);

  // Track connection events
  useWalletEvents({
    onConnect: () => {
      onConnect?.();
    },
  });

  const sortedConnectors = [...connectors].sort((a, b) => {
    const providerA = Object.values(WALLET_PROVIDERS).find(p => p.id === a.id);
    const providerB = Object.values(WALLET_PROVIDERS).find(p => p.id === b.id);
    return (providerA?.priority || 999) - (providerB?.priority || 999);
  });

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Installed wallets first */}
      {sortedConnectors
        .filter(c => installedWallets.includes(c.id))
        .map((connector) => {
          const provider = Object.values(WALLET_PROVIDERS).find(p => p.id === connector.id);
          return (
            <button
              key={connector.id}
              onClick={() => connect(connector.id)}
              disabled={!connector.ready || state === 'connecting'}
              className={`
                w-full p-4 rounded-lg border-2 transition-all text-left
                flex items-center justify-between
                ${state === 'connecting'
                  ? 'bg-blue-500/10 border-blue-500 cursor-wait'
                  : 'bg-slate-800 border-slate-700 hover:border-cyan-500 hover:bg-slate-700'
                }
              `}
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{provider?.icon}</span>
                <span className="font-semibold text-white">{connector.name}</span>
              </span>
              {!connector.ready && (
                <span className="text-xs text-yellow-400">Not Installed</span>
              )}
            </button>
          );
        })}

      {/* Other wallets */}
      {sortedConnectors
        .filter(c => !installedWallets.includes(c.id))
        .map((connector) => {
          const provider = Object.values(WALLET_PROVIDERS).find(p => p.id === connector.id);
          return (
            <button
              key={connector.id}
              onClick={() => connect(connector.id)}
              disabled={!connector.ready}
              className={`
                w-full p-4 rounded-lg border-2 transition-all text-left
                flex items-center justify-between opacity-60
                ${!connector.ready
                  ? 'bg-slate-800 border-slate-700 cursor-not-allowed'
                  : 'bg-slate-800 border-slate-700 hover:border-cyan-500 hover:bg-slate-700 hover:opacity-100'
                }
              `}
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{provider?.icon}</span>
                <span className="font-semibold text-white">{connector.name}</span>
              </span>
              <span className="text-xs text-gray-400">Install</span>
            </button>
          );
        })}
    </div>
  );
};

interface WalletInfoCardProps {
  showChainInfo?: boolean;
  className?: string;
}

export const WalletInfoCard = ({ showChainInfo = true, className = '' }: WalletInfoCardProps) => {
  const { state, address, chainName, isCorrectNetwork } = useWallet();

  if (state !== 'connected' || !address) return null;

  return (
    <div className={`bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-4 ${className}`}>
      <div className="space-y-3">
        {/* Address */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Address</span>
          <span className="font-mono text-sm text-cyan-400">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>

        {/* Network */}
        {showChainInfo && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Network</span>
            <span className={`flex items-center gap-2 text-sm font-semibold ${
              isCorrectNetwork ? 'text-green-400' : 'text-yellow-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isCorrectNetwork ? 'bg-green-400' : 'bg-yellow-400'
              }`} />
              {chainName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

interface ConnectorStatusProps {
  className?: string;
}

export const ConnectorStatus = ({ className = '' }: ConnectorStatusProps) => {
  const { state, address, connector, error } = useWallet();
  const [displayError, setDisplayError] = React.useState<string>('');

  React.useEffect(() => {
    if (error) {
      setDisplayError(error);
      const timer = setTimeout(() => setDisplayError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className={className}>
      {state === 'connecting' && (
        <div className="flex items-center gap-2 text-blue-400 text-sm">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span>Connecting {connector?.name}...</span>
        </div>
      )}

      {state === 'reconnecting' && (
        <div className="flex items-center gap-2 text-cyan-400 text-sm">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span>Reconnecting...</span>
        </div>
      )}

      {state === 'connected' && (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Connected</span>
        </div>
      )}

      {displayError && (
        <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};
