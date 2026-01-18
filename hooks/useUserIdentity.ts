import { useAccount, useNetwork, useBalance } from 'wagmi';
import { useCallback, useMemo } from 'react';

/**
 * Hook to manage user Web3 identity
 * Provides wallet address, network info, balance, and utility functions
 */
export function useUserIdentity() {
  const { address, isConnected, connector } = useAccount();
  const { chain } = useNetwork();
  const { data: balanceData } = useBalance({ address });

  // Format address for display
  const formattedAddress = useMemo(() => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  // Check if connected to Base chain
  const isOnBase = useMemo(() => {
    return chain?.id === 8453 || chain?.id === 84532; // Base mainnet or sepolia
  }, [chain?.id]);

  // Get user's ETH/Base balance
  const balance = useMemo(() => {
    if (!balanceData) return '0';
    return parseFloat(balanceData.formatted).toFixed(4);
  }, [balanceData]);

  // Switch to Base chain
  const switchToBase = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      // Try to add/switch to Base
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x2105', // 8453 in hex
            chainName: 'Base',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org'],
          },
        ],
      });
    } catch (error) {
      console.error('Failed to switch to Base:', error);
    }
  }, []);

  return {
    address,
    formattedAddress,
    isConnected,
    connector: connector?.name,
    chain: chain?.name,
    chainId: chain?.id,
    isOnBase,
    balance,
    balanceSymbol: balanceData?.symbol || 'ETH',
    switchToBase,
  };
}

/**
 * Hook to check if user is properly set up for Bass Ball
 * - Connected to wallet
 * - On Base chain
 * - Has minimum balance (optional)
 */
export function useGameReady(minBalance?: number) {
  const { isConnected, isOnBase, balance } = useUserIdentity();

  const isGameReady = useMemo(() => {
    if (!isConnected || !isOnBase) return false;
    if (minBalance && parseFloat(balance) < minBalance) return false;
    return true;
  }, [isConnected, isOnBase, balance, minBalance]);

  const readyChecks = useMemo(
    () => ({
      walletConnected: isConnected,
      onCorrectChain: isOnBase,
      sufficientBalance: minBalance ? parseFloat(balance) >= minBalance : true,
    }),
    [isConnected, isOnBase, balance, minBalance]
  );

  return { isGameReady, readyChecks };
}
