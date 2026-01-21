import { useCallback, useEffect, useRef, useState } from 'react';
import { usePublicClient } from 'wagmi';

export interface ProviderConfig {
  url: string;
  name: string;
  priority: number;
  maxRetries?: number;
  timeout?: number;
}

export interface ProviderHealth {
  name: string;
  isHealthy: boolean;
  lastCheck: number;
  latency: number;
  failureCount: number;
}

interface ProviderState {
  active: string | null;
  health: Map<string, ProviderHealth>;
  lastRotation: number;
}

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_MAX_RETRIES = 3;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const FAILURE_THRESHOLD = 3;

/**
 * Provider failover system with health checks
 * Automatically rotates to healthy providers on failure
 */
export class ProviderFailoverManager {
  private providers: ProviderConfig[];
  private state: ProviderState;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(providers: ProviderConfig[]) {
    this.providers = providers.sort((a, b) => b.priority - a.priority);
    this.state = {
      active: providers[0]?.name || null,
      health: new Map(),
      lastRotation: Date.now(),
    };

    // Initialize health states
    providers.forEach(p => {
      this.state.health.set(p.name, {
        name: p.name,
        isHealthy: true,
        lastCheck: Date.now(),
        latency: 0,
        failureCount: 0,
      });
    });
  }

  /**
   * Health check for a provider
   */
  private async checkProviderHealth(provider: ProviderConfig): Promise<number> {
    const start = Date.now();
    const timeout = provider.timeout || DEFAULT_TIMEOUT;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const latency = Date.now() - start;
      return latency;
    } catch (err) {
      return -1; // Indicates failure
    }
  }

  /**
   * Run health checks on all providers
   */
  async runHealthChecks(): Promise<void> {
    for (const provider of this.providers) {
      const latency = await this.checkProviderHealth(provider);
      const health = this.state.health.get(provider.name)!;

      if (latency >= 0) {
        health.isHealthy = true;
        health.latency = latency;
        health.failureCount = Math.max(0, health.failureCount - 1);
      } else {
        health.failureCount += 1;
        health.isHealthy = health.failureCount < FAILURE_THRESHOLD;
      }

      health.lastCheck = Date.now();
    }

    // Switch to healthy provider if needed
    this.rotateProviderIfNeeded();
  }

  /**
   * Get the current active provider
   */
  getActiveProvider(): ProviderConfig | null {
    return this.providers.find(p => p.name === this.state.active) || null;
  }

  /**
   * Get all provider health states
   */
  getHealthStatus(): ProviderHealth[] {
    return Array.from(this.state.health.values());
  }

  /**
   * Report provider failure and rotate if needed
   */
  reportFailure(providerName: string): void {
    const health = this.state.health.get(providerName);
    if (health) {
      health.failureCount += 1;
      health.isHealthy = health.failureCount < FAILURE_THRESHOLD;
    }

    if (providerName === this.state.active) {
      this.rotateProviderIfNeeded();
    }
  }

  /**
   * Find and rotate to a healthy provider
   */
  private rotateProviderIfNeeded(): void {
    const currentActive = this.getActiveProvider();
    const currentHealth = currentActive ? this.state.health.get(currentActive.name) : null;

    if (currentHealth?.isHealthy) return; // Current provider is healthy

    // Find the healthiest available provider
    const healthyProviders = this.providers.filter(p => {
      const health = this.state.health.get(p.name);
      return health?.isHealthy;
    });

    if (healthyProviders.length > 0) {
      // Sort by latency for best performance
      healthyProviders.sort((a, b) => {
        const healthA = this.state.health.get(a.name)!.latency;
        const healthB = this.state.health.get(b.name)!.latency;
        return healthA - healthB;
      });

      const newProvider = healthyProviders[0];
      if (newProvider.name !== this.state.active) {
        console.log(`[Provider Failover] Switching from ${this.state.active} to ${newProvider.name}`);
        this.state.active = newProvider.name;
        this.state.lastRotation = Date.now();
      }
    }
  }

  /**
   * Start automatic health checking
   */
  startHealthChecks(): void {
    if (this.healthCheckInterval) return;

    this.runHealthChecks(); // Run immediately
    this.healthCheckInterval = setInterval(
      () => this.runHealthChecks(),
      HEALTH_CHECK_INTERVAL
    );
  }

  /**
   * Stop automatic health checking
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Reset health state for a provider
   */
  resetProvider(providerName: string): void {
    const health = this.state.health.get(providerName);
    if (health) {
      health.failureCount = 0;
      health.isHealthy = true;
      health.lastCheck = Date.now();
    }
  }
}

/**
 * Hook for provider failover management
 */
export const useProviderFailover = (providers: ProviderConfig[]) => {
  const managerRef = useRef<ProviderFailoverManager | null>(null);
  const [activeProvider, setActiveProvider] = useState<ProviderConfig | null>(null);
  const [healthStatus, setHealthStatus] = useState<ProviderHealth[]>([]);

  useEffect(() => {
    managerRef.current = new ProviderFailoverManager(providers);
    setActiveProvider(managerRef.current.getActiveProvider());
    setHealthStatus(managerRef.current.getHealthStatus());

    managerRef.current.startHealthChecks();

    return () => {
      managerRef.current?.stopHealthChecks();
    };
  }, [providers]);

  const reportFailure = useCallback((providerName: string) => {
    if (managerRef.current) {
      managerRef.current.reportFailure(providerName);
      setActiveProvider(managerRef.current.getActiveProvider());
      setHealthStatus(managerRef.current.getHealthStatus());
    }
  }, []);

  const resetProvider = useCallback((providerName: string) => {
    if (managerRef.current) {
      managerRef.current.resetProvider(providerName);
      setHealthStatus(managerRef.current.getHealthStatus());
    }
  }, []);

  const checkHealth = useCallback(async () => {
    if (managerRef.current) {
      await managerRef.current.runHealthChecks();
      setActiveProvider(managerRef.current.getActiveProvider());
      setHealthStatus(managerRef.current.getHealthStatus());
    }
  }, []);

  return {
    activeProvider,
    healthStatus,
    reportFailure,
    resetProvider,
    checkHealth,
  };
};
