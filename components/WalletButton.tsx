'use client';

import React from 'react';
import { useWallet } from '../hooks/useWallet';

interface WalletButtonProps {
  showBalance?: boolean;
  showNetwork?: boolean;
  className?: string;
}

/**
 * Enhanced wallet button with connection states and visual feedback
 */
export function WalletButton({ 
  showBalance = false, 
  showNetwork = true,
  className = '' 
}: WalletButtonProps) {
  const {
    state,
    address,
    connect,
    disconnect,
    connectors,
    formatAddress,
    chainName,
    isCorrectNetwork,
  } = useWallet();

  // Disconnected state
  if (state === 'disconnected') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {connectors.slice(0, 3).map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect(connector.id)}
            disabled={!connector.ready}
            className={`
              px-5 py-2.5 rounded-xl font-semibold transition-all duration-300
              ${connector.ready 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 text-white' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {connector.name}
          </button>
        ))}
      </div>
    );
  }

  // Connecting state
  if (state === 'connecting') {
    return (
      <button disabled className={`px-6 py-3 rounded-xl bg-blue-600/50 text-white font-semibold cursor-wait ${className}`}>
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Connecting...
        </span>
      </button>
    );
  }

  // Reconnecting state
  if (state === 'reconnecting') {
    return (
      <button disabled className={`px-6 py-3 rounded-xl bg-cyan-600/50 text-white font-semibold cursor-wait ${className}`}>
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Reconnecting...
        </span>
      </button>
    );
  }

  // Wrong network state
  if (state === 'wrong_network') {
    return (
      <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl bg-red-500/10 border-2 border-red-500 ${className}`}>
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-red-400">Wrong Network</div>
          <div className="text-xs text-red-300">{chainName}</div>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <button 
        onClick={() => connect()}
        className={`px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all ${className}`}
      >
        Connection Failed - Retry
      </button>
    );
  }

  // Connected state
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Wallet info */}
      <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600">
        {/* Connection indicator */}
        <div className={`w-3 h-3 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
        
        {/* Address */}
        <div className="flex flex-col">
          <div className="text-sm font-mono text-white">
            {formatAddress(address)}
          </div>
          
          {/* Network (optional) */}
          {showNetwork && (
            <div className={`text-xs ${isCorrectNetwork ? 'text-green-400' : 'text-yellow-400'}`}>
              {chainName}
            </div>
          )}
        </div>

        {/* Copy address button */}
        <button
          onClick={() => {
            if (address) {
              navigator.clipboard.writeText(address);
            }
          }}
          className="p-1.5 hover:bg-slate-600 rounded transition-colors"
          title="Copy address"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Disconnect button */}
      <button
        onClick={disconnect}
        className="px-4 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/50 text-red-400 font-semibold transition-all"
      >
        Disconnect
      </button>
    </div>
  );
}
