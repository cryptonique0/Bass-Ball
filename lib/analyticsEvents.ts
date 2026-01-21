import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';

/**
 * Event types for wallet and transaction lifecycle
 */
export enum EventType {
  // Wallet events
  WALLET_CONNECTED = 'wallet.connected',
  WALLET_DISCONNECTED = 'wallet.disconnected',
  WALLET_CHAIN_CHANGED = 'wallet.chain_changed',
  WALLET_ACCOUNT_CHANGED = 'wallet.account_changed',

  // Transaction events
  TX_INITIATED = 'tx.initiated',
  TX_PENDING = 'tx.pending',
  TX_CONFIRMED = 'tx.confirmed',
  TX_FAILED = 'tx.failed',
  TX_REVERTED = 'tx.reverted',

  // Game events
  GAME_STARTED = 'game.started',
  GAME_COMPLETED = 'game.completed',
  GAME_QUIT = 'game.quit',
  GOAL_SCORED = 'game.goal',

  // Marketplace events
  ITEM_LISTED = 'marketplace.item_listed',
  ITEM_PURCHASED = 'marketplace.item_purchased',
  ITEM_DELISTED = 'marketplace.item_delisted',

  // Tournament events
  TOURNAMENT_JOINED = 'tournament.joined',
  TOURNAMENT_RESULT = 'tournament.result',

  // NFT events
  NFT_MINTED = 'nft.minted',
  NFT_TRANSFERRED = 'nft.transferred',
  NFT_BURNED = 'nft.burned',
}

/**
 * Base event structure
 */
export interface BaseEvent {
  type: EventType;
  timestamp: number;
  sessionId: string;
  userAgent: string;
  pageUrl: string;
  chainId: number;
  chainName: string;
}

/**
 * Wallet event
 */
export interface WalletEvent extends BaseEvent {
  address?: Address;
  previousAddress?: Address;
}

/**
 * Transaction event
 */
export interface TransactionEvent extends BaseEvent {
  txHash: string;
  from: Address;
  to?: Address;
  value?: string;
  gasUsed?: string;
  gasPrice?: string;
  status?: 'success' | 'failed' | 'reverted';
  contractInteraction?: {
    contractAddress: Address;
    functionName: string;
  };
}

/**
 * Game event
 */
export interface GameEvent extends BaseEvent {
  gameId: string;
  player: Address;
  duration?: number;
  score?: number;
  result?: 'win' | 'loss' | 'draw';
}

/**
 * Marketplace event
 */
export interface MarketplaceEvent extends BaseEvent {
  user: Address;
  itemId: string;
  itemType: string;
  price?: string;
  txHash?: string;
}

/**
 * Analytics event manager
 */
class AnalyticsManager {
  private sessionId: string;
  private queue: any[] = [];
  private isOnline = true;
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private endpoint: string;
  private flushTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(event: any) => void> = new Set();

  constructor(endpoint: string = '/api/analytics') {
    this.sessionId = this.generateSessionId();
    this.endpoint = endpoint;
    this.setupNetworkListener();
    this.startAutoFlush();
  }

  /**
   * Track an event
   */
  trackEvent(event: Omit<BaseEvent, 'sessionId' | 'timestamp' | 'userAgent' | 'pageUrl'>): void {
    const enrichedEvent = {
      ...event,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    };

    this.queue.push(enrichedEvent);
    this.notifyListeners(enrichedEvent);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush queued events to endpoint
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.isOnline) return;

    const batch = this.queue.splice(0, this.batchSize);

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      });
    } catch (err) {
      // Re-queue failed events
      this.queue.unshift(...batch);
      console.warn('Analytics flush failed:', err);
    }
  }

  /**
   * Setup network listener for online/offline
   */
  private setupNetworkListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flush();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Start automatic flushing
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  /**
   * Stop automatic flushing
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(callback: (event: any) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  private notifyListeners(event: any): void {
    this.listeners.forEach(cb => cb(event));
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

let globalManager: AnalyticsManager | null = null;

/**
 * Get or create global analytics manager
 */
function getAnalyticsManager(): AnalyticsManager {
  if (!globalManager) {
    globalManager = new AnalyticsManager();
  }
  return globalManager;
}

/**
 * Hook for analytics tracking
 */
export const useAnalytics = () => {
  const manager = useRef(getAnalyticsManager()).current;
  const { address, chainId } = useAccount();
  const [chainName, setChainName] = useState('unknown');

  // Map chain ID to name
  useEffect(() => {
    const names: Record<number, string> = {
      1: 'ethereum',
      8453: 'base',
      84532: 'base-sepolia',
      137: 'polygon',
      42161: 'arbitrum',
    };
    setChainName(names[chainId || 1] || 'unknown');
  }, [chainId]);

  const trackWalletEvent = useCallback(
    (type: EventType, previousAddress?: Address) => {
      manager.trackEvent({
        type,
        address,
        previousAddress,
        chainId: chainId || 1,
        chainName,
      } as WalletEvent);
    },
    [manager, address, chainId, chainName]
  );

  const trackTransactionEvent = useCallback(
    (type: EventType, txData: Partial<TransactionEvent>) => {
      manager.trackEvent({
        type,
        chainId: chainId || 1,
        chainName,
        ...txData,
      } as TransactionEvent);
    },
    [manager, chainId, chainName]
  );

  const trackGameEvent = useCallback(
    (type: EventType, gameData: Partial<GameEvent>) => {
      manager.trackEvent({
        type,
        chainId: chainId || 1,
        chainName,
        ...gameData,
      } as GameEvent);
    },
    [manager, chainId, chainName]
  );

  const trackMarketplaceEvent = useCallback(
    (type: EventType, marketplaceData: Partial<MarketplaceEvent>) => {
      manager.trackEvent({
        type,
        chainId: chainId || 1,
        chainName,
        ...marketplaceData,
      } as MarketplaceEvent);
    },
    [manager, chainId, chainName]
  );

  const flush = useCallback(() => {
    return manager.flush();
  }, [manager]);

  const subscribe = useCallback(
    (callback: (event: any) => void) => manager.subscribe(callback),
    [manager]
  );

  return {
    sessionId: manager.getSessionId(),
    trackWalletEvent,
    trackTransactionEvent,
    trackGameEvent,
    trackMarketplaceEvent,
    flush,
    subscribe,
  };
};

/**
 * Hook for wallet lifecycle tracking
 */
export const useWalletAnalytics = () => {
  const { address, isConnected, chainId } = useAccount();
  const { trackWalletEvent } = useAnalytics();
  const previousAddressRef = useRef<Address | undefined>();

  useEffect(() => {
    if (isConnected && address) {
      if (!previousAddressRef.current) {
        // Initial connect
        trackWalletEvent(EventType.WALLET_CONNECTED);
      } else if (previousAddressRef.current !== address) {
        // Account changed
        trackWalletEvent(EventType.WALLET_ACCOUNT_CHANGED, previousAddressRef.current);
      }
      previousAddressRef.current = address;
    } else if (!isConnected && previousAddressRef.current) {
      // Disconnected
      trackWalletEvent(EventType.WALLET_DISCONNECTED);
      previousAddressRef.current = undefined;
    }
  }, [isConnected, address, trackWalletEvent]);

  useEffect(() => {
    if (chainId && previousAddressRef.current) {
      trackWalletEvent(EventType.WALLET_CHAIN_CHANGED);
    }
  }, [chainId, trackWalletEvent]);
};

/**
 * Hook for transaction lifecycle tracking
 */
export const useTransactionAnalytics = () => {
  const { address } = useAccount();
  const { trackTransactionEvent } = useAnalytics();

  const trackTxInitiated = useCallback(
    (to: Address, value?: string, functionName?: string) => {
      trackTransactionEvent(EventType.TX_INITIATED, {
        from: address!,
        to,
        value,
        contractInteraction: functionName
          ? { contractAddress: to, functionName }
          : undefined,
      } as Partial<TransactionEvent>);
    },
    [trackTransactionEvent, address]
  );

  const trackTxPending = useCallback(
    (txHash: string) => {
      trackTransactionEvent(EventType.TX_PENDING, {
        txHash,
        from: address!,
      } as Partial<TransactionEvent>);
    },
    [trackTransactionEvent, address]
  );

  const trackTxConfirmed = useCallback(
    (txHash: string, gasUsed?: string, gasPrice?: string) => {
      trackTransactionEvent(EventType.TX_CONFIRMED, {
        txHash,
        from: address!,
        gasUsed,
        gasPrice,
        status: 'success',
      } as Partial<TransactionEvent>);
    },
    [trackTransactionEvent, address]
  );

  const trackTxFailed = useCallback(
    (txHash: string, reason?: string) => {
      trackTransactionEvent(EventType.TX_FAILED, {
        txHash,
        from: address!,
        status: 'failed',
      } as Partial<TransactionEvent>);
    },
    [trackTransactionEvent, address]
  );

  return {
    trackTxInitiated,
    trackTxPending,
    trackTxConfirmed,
    trackTxFailed,
  };
};
