'use client';

import React from 'react';

interface ConnectWalletProps {
  isConnected: boolean;
  address?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectWallet({
  isConnected,
  address,
  onConnect,
  onDisconnect,
}: ConnectWalletProps) {
  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-300 font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          <button
            onClick={onDisconnect}
            className="btn btn-secondary text-xs"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={onConnect}
          className="btn btn-primary"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
