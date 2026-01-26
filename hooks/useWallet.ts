import { useEffect, useState, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

/** Wallet connection states */
export type WalletConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'wrong_network' 
  | 'error';

/** Complete wallet state */
export interface WalletState {
  /** Current connection state */
  state: WalletConnectionState;
  /** Connected wallet address */
  address?: string;
  /** Current chain ID */
  chainId?: number;
  /** Error message if state is 'error' */
  error?: string;
  /** Whether wallet is on a supported network */
  isCorrectNetwork: boolean;
  /** Whether user needs to manually switch networks */
  requiresNetworkSwitch: boolean;
}

/**
 * Enhanced wallet hook with persistent reconnection and network validation
 * 
 * Features:
 * - Automatic reconnection on page load
 * - Network validation (Base/Base Sepolia)
 * - Persistent connector storage
 * - Type-safe wallet operations
 * 
 * @returns Wallet state and control methods
 * 
 * @example
 * ```tsx
 * const { address, isCorrectNetwork, connect, disconnect } = useWallet();
 * 
 * if (!address) {
 *   return <button onClick={() => connect()}>Connect Wallet</button>;
 * }
 * ```
 */
export const useWallet = (): WalletState & {
  isSwitching: boolean;
  address?: string;
  chainId?: number;
  chainName?: string;
  connector?: any;
  connectors: any[];
  connect: (connectorId?: string) => Promise<boolean>;
  disconnect: () => void;
  switchToCorrectNetwork: () => Promise<boolean>;
  formatAddress: (addr?: string) => string;
  getNetworkName: () => string;
  getSupportedNetworks: () => typeof base[];
} => {
  const { address, isConnected, isConnecting, isReconnecting, connector } = useAccount();
  const { chain } = useNetwork();
  const { connect, connectors, error: connectError, isLoading: isConnecting2 } = useConnect();
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
    } else if (isConnecting || isConnecting2) {
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
  }, [isConnected, isConnecting, isReconnecting, isConnecting2, address, chain, connectError, isCorrectNetwork]);

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
    
    getSupportedNetworks: () => [base, baseSepolia] as any[],
  };
};
