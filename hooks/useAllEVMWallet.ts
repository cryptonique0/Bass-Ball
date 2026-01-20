/**
 * All-EVM Wallet Management Hooks
 * Utilities for managing wallets across all EVM chains
 */

'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAccount, useNetwork, useBalance, useSwitchNetwork } from 'wagmi';
import { getChainMetadata, isChainSupported, getSupportedChainIds } from '@/lib/wagmiAllEVMConfig';

/**
 * Main hook for all-EVM wallet management
 */
export function useAllEVMWallet() {
  const { address, isConnected, connector } = useAccount();
  const { chain } = useNetwork();
  const { data: balance } = useBalance({ address });
  const { switchNetwork } = useSwitchNetwork();

  // Get all available chain IDs
  const availableChainIds = useMemo(() => getSupportedChainIds(), []);

  // Format address for display
  const formattedAddress = useMemo(() => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  // Get current chain metadata
  const currentChainMetadata = useMemo(() => {
    if (!chain) return null;
    return getChainMetadata(chain.id);
  }, [chain]);

  // Check if current chain is supported
  const isCurrentChainSupported = useMemo(() => {
    if (!chain) return false;
    return isChainSupported(chain.id);
  }, [chain]);

  // Get user's balance on current chain
  const userBalance = useMemo(() => {
    if (!balance) return '0';
    return parseFloat(balance.formatted).toFixed(4);
  }, [balance]);

  // Switch to specific chain
  const switchToChain = useCallback(
    (chainId: number) => {
      if (!isChainSupported(chainId)) {
        console.error(`Chain ${chainId} is not supported`);
        return;
      }
      switchNetwork?.(chainId);
    },
    [switchNetwork]
  );

  // Disconnect wallet
  const disconnect = useCallback(() => {
    // Wagmi will handle disconnect through the UI
    window.location.reload();
  }, []);

  return {
    // Wallet info
    address,
    formattedAddress,
    isConnected,
    connector: connector?.name,

    // Chain info
    chainId: chain?.id,
    chainName: currentChainMetadata?.name || 'Unknown',
    chainCategory: currentChainMetadata?.category,
    isCurrentChainSupported,
    chainExplorer: currentChainMetadata?.explorer,

    // Available chains
    availableChainIds,

    // Balance
    balance: userBalance,
    balanceSymbol: balance?.symbol || 'ETH',

    // Actions
    switchToChain,
    disconnect,
  };
}

/**
 * Hook for multi-chain balance checking
 */
export function useMultiChainBalance() {
  const { address } = useAccount();
  const availableChainIds = getSupportedChainIds();

  // In a real app, you'd fetch balance for each chain
  // For now, return the structure
  const getBalanceForChain = useCallback(
    async (chainId: number) => {
      // Would fetch balance from that specific chain
      return {
        chainId,
        balance: '0',
        symbol: 'ETH',
      };
    },
    []
  );

  return { address, availableChainIds, getBalanceForChain };
}

/**
 * Hook for cross-chain wallet detection
 */
export function useCrossChainWallet() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [detectedChains, setDetectedChains] = useState<number[]>([]);

  useEffect(() => {
    if (!isConnected || !address) {
      setDetectedChains([]);
      return;
    }

    // On connection, we know the current chain
    if (chain) {
      setDetectedChains([chain.id]);
    }
  }, [isConnected, address, chain]);

  return {
    address,
    detectedChains,
    currentChainId: chain?.id,
    isMultiChainReady: isConnected && address !== undefined,
  };
}

/**
 * Hook for wallet connectivity status across chains
 */
export function useWalletConnectivity() {
  const { isConnected, connector } = useAccount();
  const { chain } = useNetwork();
  const supportedChainIds = getSupportedChainIds();

  const connectivity = useMemo(() => {
    return {
      isConnected,
      connectorName: connector?.name,
      currentChain: {
        id: chain?.id,
        name: chain?.name,
      },
      supportedChains: supportedChainIds,
      isChainSupported: chain ? supportedChainIds.includes(chain.id) : false,
      connectionStatus: isConnected ? 'connected' : 'disconnected',
    };
  }, [isConnected, connector, chain, supportedChainIds]);

  return connectivity;
}

/**
 * Hook to get all available EVM chains for UI
 */
export function useAvailableEVMChains() {
  const supportedChainIds = useMemo(() => getSupportedChainIds(), []);

  const chainsMetadata = useMemo(() => {
    return supportedChainIds.map(chainId => {
      const metadata = getChainMetadata(chainId);
      return {
        id: chainId,
        ...metadata,
      };
    });
  }, [supportedChainIds]);

  const chainsByCategory = useMemo(() => {
    const grouped: Record<string, typeof chainsMetadata> = {};
    chainsMetadata.forEach(chain => {
      if (!grouped[chain.category]) {
        grouped[chain.category] = [];
      }
      grouped[chain.category].push(chain);
    });
    return grouped;
  }, [chainsMetadata]);

  return {
    allChains: chainsMetadata,
    chainsByCategory,
    totalSupported: supportedChainIds.length,
  };
}

/**
 * Hook for chain switching with confirmation
 */
export function useChainSwitcher() {
  const { switchToChain } = useAllEVMWallet();
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchChainSafely = useCallback(
    async (chainId: number) => {
      setIsSwitching(true);
      setError(null);

      try {
        if (!isChainSupported(chainId)) {
          throw new Error(`Chain ${chainId} is not supported`);
        }
        switchToChain(chainId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to switch chain';
        setError(errorMessage);
      } finally {
        setIsSwitching(false);
      }
    },
    [switchToChain]
  );

  return {
    switchChainSafely,
    isSwitching,
    error,
  };
}

/**
 * Hook for wallet requirement checking
 */
export function useWalletRequired(requiredChainId?: number) {
  const { isConnected, chain } = useAccount();
  const isChainCorrect = !requiredChainId || chain?.id === requiredChainId;

  const readyChecks = useMemo(() => {
    return {
      walletConnected: isConnected,
      correctChain: isChainCorrect,
      allChecks: isConnected && isChainCorrect,
    };
  }, [isConnected, isChainCorrect]);

  return {
    isReady: readyChecks.allChecks,
    readyChecks,
  };
}

export default {
  useAllEVMWallet,
  useMultiChainBalance,
  useCrossChainWallet,
  useWalletConnectivity,
  useAvailableEVMChains,
  useChainSwitcher,
  useWalletRequired,
};
