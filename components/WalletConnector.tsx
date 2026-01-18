'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * WalletConnector Component
 * Displays wallet connection status and controls
 * Supports: MetaMask, Coinbase Wallet, WalletConnect, Rainbow, Brave, Opera, etc.
 */
export function WalletConnector() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm text-gray-400">Connected Wallet</div>
          <div className="text-white font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isPending || !connector.ready}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            isPending || !connector.ready
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {connector.name}
        </button>
      ))}
    </div>
  );
}

/**
 * RainbowKit ConnectButton - Drop-in replacement
 * Provides a beautiful, feature-rich wallet connection button
 */
export function RainbowConnectButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <ConnectButton />;
}
