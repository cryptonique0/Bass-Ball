'use client';

import React, { ReactNode } from 'react';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider, chains } from '@/lib/wagmiConfig';
import { wagmiConfig } from '@/lib/wagmiConfig';

interface Web3ProviderProps {
  children: ReactNode;
}

/**
 * Web3Provider wraps the app with Wagmi + RainbowKit
 * Provides wallet connection and blockchain access
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
