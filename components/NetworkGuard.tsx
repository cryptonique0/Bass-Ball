'use client';

import React, { useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';

interface NetworkGuardProps {
  children: React.ReactNode;
  autoSwitch?: boolean; // Automatically switch network without prompt
  onNetworkSwitched?: () => void;
}

/**
 * NetworkGuard component - Ensures user is on correct network
 * Shows prompt to switch to Base or Base Sepolia if on wrong network
 */
export function NetworkGuard({ 
  children, 
  autoSwitch = false,
  onNetworkSwitched 
}: NetworkGuardProps) {
  const { 
    state, 
    requiresNetworkSwitch, 
    switchToCorrectNetwork, 
    isSwitching,
    chainName,
    getSupportedNetworks
  } = useWallet();

  // Auto-switch if enabled
  useEffect(() => {
    if (autoSwitch && requiresNetworkSwitch && !isSwitching) {
      switchToCorrectNetwork().then((success) => {
        if (success && onNetworkSwitched) {
          onNetworkSwitched();
        }
      });
    }
  }, [autoSwitch, requiresNetworkSwitch, isSwitching, switchToCorrectNetwork, onNetworkSwitched]);

  // Show network switch prompt
  if (state === 'wrong_network' && !autoSwitch) {
    const supportedNetworks = getSupportedNetworks();
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-red-500/30 p-8 max-w-md w-full shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-3">
            Wrong Network
          </h2>

          {/* Message */}
          <p className="text-gray-300 text-center mb-6">
            You're currently on <span className="font-semibold text-red-400">{chainName}</span>.
            <br />
            Please switch to Base or Base Sepolia to continue.
          </p>

          {/* Supported networks */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-400 mb-2">Supported Networks:</div>
            <div className="space-y-2">
              {supportedNetworks.map((network) => (
                <div 
                  key={network.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-white">{network.name}</span>
                  <span className="text-gray-500 ml-auto">Chain ID: {network.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Switch button */}
          <button
            onClick={() => switchToCorrectNetwork()}
            disabled={isSwitching}
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
              ${isSwitching
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
              }
              text-white
            `}
          >
            {isSwitching ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Switching Network...
              </span>
            ) : (
              'Switch to Base'
            )}
          </button>

          {/* Help text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Your wallet will prompt you to approve the network switch
          </p>
        </div>
      </div>
    );
  }

  // Show loading during auto-switch
  if (autoSwitch && requiresNetworkSwitch && isSwitching) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-slate-900 rounded-2xl p-8 max-w-sm w-full text-center">
          <svg className="animate-spin h-12 w-12 text-cyan-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">Switching Network</h3>
          <p className="text-gray-400">Please confirm in your wallet...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
