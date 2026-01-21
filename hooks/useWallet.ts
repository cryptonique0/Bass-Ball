import { useEffect, useState, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

export type WalletConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'wrong_network' 
  | 'error';

export interface WalletState {
  state: WalletConnectionState;
  address?: string;
  chainId?: number;
  error?: string;
  isCorrectNetwork: boolean;
  requiresNetworkSwitch: boolean;
}

/**
 * Enhanced wallet hook with persistent reconnection and network validation
 */
export function useWallet() {
  const { address, isConnected, isConnecting, isReconnecting, connector } = useAccount();
  const { chain } = useNetwork();
  const { connect, connectors, error: connectError, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchNetwork, isLoading: isSwitching } = useSwitchNetwork();
  
  const [walletState, setWalletState] = useState<WalletState>({
    state: 'disconnected',
    isCorrectNetwork: false,
    requiresNetworkSwitch: false,
  });

  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);

  // Determine correct network (Base or Base Sepolia)
  const isCorrectNetwork = useCallback(() => {
    if (!chain) return false;
    return chain.id === base.id || chain.id === baseSepolia.id;
  }, [chain]);

  // Update wallet state based on connection status
  useEffect(() => {
    let state: WalletConnectionState = 'disconnected';
    
    if (isReconnecting) {
      state = 'reconnecting';
    } else if (isConnecting || isPending) {
      state = 'connecting';
    } else if (isConnected && address) {
      if (!isCorrectNetwork()) {
        state = 'wrong_network';
      } else {
        state = 'connected';
      }
    } else if (connectError) {
      state = 'error';
    }

    setWalletState({
      state,
      address,
      chainId: chain?.id,
      error: connectError?.message,
      isCorrectNetwork: isCorrectNetwork(),
      requiresNetworkSwitch: isConnected && !isCorrectNetwork(),
    });
  }, [isConnected, isConnecting, isReconnecting, isPending, address, chain, connectError, isCorrectNetwork]);

  // Persistent reconnect on mount
  useEffect(() => {
    if (!hasAttemptedReconnect && !isConnected && typeof window !== 'undefined') {
      const lastConnector = localStorage.getItem('wagmi.lastConnector');
      if (lastConnector && connectors.length > 0) {
        const connector = connectors.find(c => c.id === lastConnector);
        if (connector && connector.ready) {
          setHasAttemptedReconnect(true);
          // Auto-reconnect silently
          connect({ connector });
        }
      }
    }
  }, [hasAttemptedReconnect, isConnected, connectors, connect]);

  // Save last connector on connection
  useEffect(() => {
    if (isConnected && connector) {
      localStorage.setItem('wagmi.lastConnector', connector.id);
    }
  }, [isConnected, connector]);

  // Switch to correct network
  const switchToCorrectNetwork = useCallback(async () => {
    if (!switchNetwork) return false;
    
    try {
      // Prefer Base mainnet
      await switchNetwork(base.id);
      return true;
    } catch (error) {
      console.error('Failed to switch network:', error);
      return false;
    }
  }, [switchNetwork]);

  // Connect wallet
  const connectWallet = useCallback(async (connectorId?: string) => {
    const targetConnector = connectorId 
      ? connectors.find(c => c.id === connectorId)
      : connectors[0];
    
    if (!targetConnector) return false;

    try {
      await connect({ connector: targetConnector });
      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return false;
    }
  }, [connectors, connect]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    disconnect();
    localStorage.removeItem('wagmi.lastConnector');
  }, [disconnect]);

  return {
    // State
    ...walletState,
    isSwitching,
    
    // Wallet info
    address,
    chainId: chain?.id,
    chainName: chain?.name,
    connector,
    
    // Available connectors
    connectors,
    
    // Actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    switchToCorrectNetwork,
    
    // Utilities
    formatAddress: (addr?: string) => {
      const a = addr || address;
      return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';
    },
    
    getNetworkName: () => {
      if (!chain) return 'Unknown';
      return chain.name;
    },
    
    getSupportedNetworks: () => [base, baseSepolia],
  };
}
