import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';

export const useWalletEvents = (callbacks?: {
  onConnect?: (address: Address) => void;
  onDisconnect?: () => void;
  onChainChanged?: (chainId: number) => void;
  onError?: (error: Error) => void;
}) => {
  const { address, isConnected } = useAccount();
  const previousAddress = useRef<Address | undefined>();
  const previousConnected = useRef<boolean>(false);

  useEffect(() => {
    if (isConnected && address && !previousConnected.current) {
      callbacks?.onConnect?.(address);
      previousConnected.current = true;
      previousAddress.current = address;
    } else if (!isConnected && previousConnected.current) {
      callbacks?.onDisconnect?.();
      previousConnected.current = false;
      previousAddress.current = undefined;
    } else if (address && previousAddress.current && address !== previousAddress.current) {
      callbacks?.onConnect?.(address);
      previousAddress.current = address;
    }
  }, [address, isConnected, callbacks]);
};

export const WALLET_PROVIDERS = {
  metamask: {
    id: 'metaMask',
    name: 'MetaMask',
    icon: '🦊',
    priority: 1,
  },
  coinbase: {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '💙',
    priority: 2,
  },
  walletconnect: {
    id: 'walletConnect',
    name: 'WalletConnect',
    icon: '🔗',
    priority: 3,
  },
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    priority: 4,
  },
  brave: {
    id: 'brave',
    name: 'Brave Wallet',
    icon: '🦁',
    priority: 5,
  },
} as const;

export const detectInstalledWallets = (): string[] => {
  if (typeof window === 'undefined') return [];
  const installed: string[] = [];
  const ethereum = (window as any).ethereum;
  if (ethereum?.isMetaMask) installed.push(WALLET_PROVIDERS.metamask.id);
  if (ethereum?.isCoinbaseWallet) installed.push(WALLET_PROVIDERS.coinbase.id);
  if (ethereum?.isBraveWallet) installed.push(WALLET_PROVIDERS.brave.id);
  if (ethereum?.isRainbow) installed.push(WALLET_PROVIDERS.rainbow.id);
  return installed;
};

export const checkProviderHealth = async (
  rpcUrl: string
): Promise<{ healthy: boolean; latency: number; blockNumber?: number }> => {
  const startTime = Date.now();
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });

    const latency = Date.now() - startTime;
    if (!response.ok) return { healthy: false, latency };

    const data = await response.json();
    if (data.error) return { healthy: false, latency };

    return {
      healthy: true,
      latency,
      blockNumber: parseInt(data.result, 16),
    };
  } catch (error) {
    return { healthy: false, latency: Date.now() - startTime };
  }
};

class ProviderFallback {
  private providers: Array<{ url: string; name: string }>;
  private currentIndex: number = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthyProviders: Set<string> = new Set();

  constructor(providers: Array<{ url: string; name: string }>) {
    this.providers = providers;
    this.providers.forEach(p => {
      this.healthyProviders.add(p.url);
    });
  }

  getCurrentProvider(): string {
    return this.providers[this.currentIndex].url;
  }

  getCurrentProviderName(): string {
    return this.providers[this.currentIndex].name;
  }

  async switchProvider(): Promise<boolean> {
    const startIndex = this.currentIndex;
    do {
      this.currentIndex = (this.currentIndex + 1) % this.providers.length;
      const provider = this.providers[this.currentIndex];
      const health = await checkProviderHealth(provider.url);
      if (health.healthy) {
        console.log(`Switched to provider: ${provider.name}`);
        return true;
      }
      if (this.currentIndex === startIndex) {
        return false;
      }
    } while (true);
  }

  startHealthChecks(interval: number = 30000) {
    if (this.healthCheckInterval) return;
    this.healthCheckInterval = setInterval(async () => {
      for (const provider of this.providers) {
        const health = await checkProviderHealth(provider.url);
        if (health.healthy) {
          this.healthyProviders.add(provider.url);
        } else {
          this.healthyProviders.delete(provider.url);
        }
      }
      if (!this.healthyProviders.has(this.getCurrentProvider())) {
        await this.switchProvider();
      }
    }, interval);
  }

  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  getHealthyProviders(): Array<{ url: string; name: string }> {
    return this.providers.filter(p => this.healthyProviders.has(p.url));
  }
}

class ProviderManager {
  private static instance: ProviderManager;
  private fallback: ProviderFallback | null = null;

  private constructor() {}

  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  public initializeFallback(providers: Array<{ url: string; name: string }>) {
    this.fallback = new ProviderFallback(providers);
    this.fallback.startHealthChecks();
  }

  public getCurrentProvider(): string | null {
    return this.fallback?.getCurrentProvider() ?? null;
  }

  public async switchProvider(): Promise<boolean> {
    return this.fallback?.switchProvider() ?? false;
  }

  public getHealthyProviders() {
    return this.fallback?.getHealthyProviders() ?? [];
  }

  public cleanup() {
    this.fallback?.stopHealthChecks();
    this.fallback = null;
  }
}

export const providerManager = ProviderManager.getInstance();

export const WalletConnectConfig = {
  getProjectId(): string {
    const id = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    if (!id) {
      console.warn('WalletConnect project ID not configured.');
      return 'demo-projectid-placeholder';
    }
    return id;
  },

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    if (!projectId) {
      errors.push('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
    }
    return { valid: errors.length === 0, errors };
  },

  getMetadata() {
    return {
      name: 'Bass Ball - Web3 Gaming',
      description: 'The ultimate blockchain baseball game on Base',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://bassball.game',
      icons: ['https://bassball.game/logo.png'],
    };
  },
};
