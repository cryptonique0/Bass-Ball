import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import type { Address } from 'viem';

export interface WalletConnectSession {
  sessionId: string;
  address: Address;
  chainId: number;
  connector: string;
  connectedAt: number;
}

export interface WalletConnectConfig {
  projectId: string; // WalletConnect v2 project ID
  appName: string;
  appDescription: string;
  appIcon?: string;
  enablePersistence?: boolean;
  autoReconnect?: boolean;
}

const STORAGE_KEY = 'walletconnect:session';
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * WalletConnect session manager
 */
class WalletConnectSessionManager {
  private config: WalletConnectConfig;
  private session: WalletConnectSession | null = null;
  private listeners: Set<(session: WalletConnectSession | null) => void> = new Set();

  constructor(config: WalletConnectConfig) {
    this.config = config;
    if (config.enablePersistence) {
      this.loadSession();
    }
  }

  /**
   * Create a new session
   */
  createSession(
    address: Address,
    chainId: number,
    connector: string
  ): WalletConnectSession {
    this.session = {
      sessionId: `session-${Date.now()}`,
      address,
      chainId,
      connector,
      connectedAt: Date.now(),
    };

    if (this.config.enablePersistence) {
      this.saveSession();
    }

    this.notifyListeners();
    return this.session;
  }

  /**
   * Get current session
   */
  getSession(): WalletConnectSession | null {
    return this.session;
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    if (!this.session) return false;
    const elapsed = Date.now() - this.session.connectedAt;
    return elapsed < SESSION_TIMEOUT;
  }

  /**
   * Update session on chain change
   */
  updateChain(chainId: number): void {
    if (this.session) {
      this.session.chainId = chainId;
      if (this.config.enablePersistence) {
        this.saveSession();
      }
      this.notifyListeners();
    }
  }

  /**
   * Clear session
   */
  clearSession(): void {
    this.session = null;
    if (this.config.enablePersistence) {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.notifyListeners();
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    try {
      if (this.session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
      }
    } catch (err) {
      console.warn('Failed to save WalletConnect session:', err);
    }
  }

  /**
   * Load session from localStorage
   */
  private loadSession(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.session = JSON.parse(stored);
        // Validate session hasn't expired
        if (!this.isSessionValid()) {
          this.clearSession();
        }
      }
    } catch (err) {
      console.warn('Failed to load WalletConnect session:', err);
      this.clearSession();
    }
  }

  /**
   * Subscribe to session changes
   */
  subscribe(callback: (session: WalletConnectSession | null) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of session change
   */
  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.session));
  }
}

/**
 * Hook for WalletConnect integration
 */
export const useWalletConnect = (config: WalletConnectConfig) => {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const managerRef = useRef<WalletConnectSessionManager | null>(null);
  const [session, setSession] = useState<WalletConnectSession | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);

  // Initialize manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new WalletConnectSessionManager(config);
      setSession(managerRef.current.getSession());
      setIsSessionValid(managerRef.current.isSessionValid());

      const unsubscribe = managerRef.current.subscribe((newSession) => {
        setSession(newSession);
        setIsSessionValid(managerRef.current?.isSessionValid() ?? false);
      });

      return () => unsubscribe();
    }
  }, [config]);

  // Create session on connect
  useEffect(() => {
    if (isConnected && address && chainId && managerRef.current) {
      const connector = connectors[0]?.name || 'unknown';
      managerRef.current.createSession(address, chainId, connector);
    }
  }, [isConnected, address, chainId, connectors]);

  // Update chain on change
  useEffect(() => {
    if (chainId && managerRef.current) {
      managerRef.current.updateChain(chainId);
    }
  }, [chainId]);

  // Auto-reconnect if enabled
  useEffect(() => {
    if (config.autoReconnect && !isConnected && session && managerRef.current?.isSessionValid()) {
      const wc = connectors.find(c => c.name === 'WalletConnect');
      if (wc) {
        connect({ connector: wc });
      }
    }
  }, [config.autoReconnect, isConnected, session, connectors, connect]);

  const connectWallet = useCallback((connectorName?: string) => {
    const target = connectorName
      ? connectors.find(c => c.name === connectorName)
      : connectors[0];

    if (target) {
      connect({ connector: target });
    }
  }, [connectors, connect]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    if (managerRef.current) {
      managerRef.current.clearSession();
    }
  }, [disconnect]);

  const getAvailableConnectors = useCallback(() => {
    return connectors.map(c => ({
      name: c.name,
      id: c.id,
      ready: c.ready ?? false,
    }));
  }, [connectors]);

  return {
    session,
    isSessionValid,
    isConnected,
    address,
    chainId,
    isPending,
    connectWallet,
    disconnectWallet,
    getAvailableConnectors,
  };
};

/**
 * Hook for persistent wallet connection
 */
export const usePersistentWallet = (config: Partial<WalletConnectConfig> = {}) => {
  const defaultConfig: WalletConnectConfig = {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    appName: 'Bass Ball',
    appDescription: 'Web3 Football Manager',
    enablePersistence: true,
    autoReconnect: true,
    ...config,
  };

  return useWalletConnect(defaultConfig);
};

/**
 * Hook for multi-wallet support with fallback
 */
export const useMultiWalletFallback = () => {
  const { connectors } = useConnect();
  const [preferredConnector, setPreferredConnector] = useState<string | null>(null);

  // Order of preference
  const connectorPriority = ['MetaMask', 'WalletConnect', 'Coinbase Wallet', 'Rainbow'];

  const getPreferredConnector = useCallback(() => {
    if (preferredConnector) {
      const connector = connectors.find(c => c.name === preferredConnector);
      if (connector?.ready) return connector;
    }

    // Find first ready connector in priority order
    for (const name of connectorPriority) {
      const connector = connectors.find(c => c.name === name && c.ready);
      if (connector) return connector;
    }

    return connectors[0];
  }, [connectors, preferredConnector]);

  return {
    getPreferredConnector,
    setPreferredConnector,
    availableConnectors: connectors,
  };
};
