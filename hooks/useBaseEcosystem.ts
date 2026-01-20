/**
 * useBaseEcosystem Hook
 * React hook for Base ecosystem integration
 * Provides access to Base chain utilities, DEXs, bridges, and services
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  getBaseNetworkStats,
  estimateBaseGasPrice,
  calculateBaseSavings,
  getBaseBridges,
  getBaseDexs,
  getBaseServices,
  getBaseEcosystemHealth,
  BASE_ECOSYSTEM,
} from '@/lib/web3/base-ecosystem';
import { useAccount, useNetwork, useBalance } from 'wagmi';

export interface BaseEcosystemState {
  // Network info
  blockNumber: number;
  gasPrice: string;
  isBase: boolean;
  
  // Gas estimation
  estimatedGasPrice: string | null;
  gasRecommendation: 'low' | 'standard' | 'fast' | null;
  estimatedTxCost: string | null;
  
  // Ecosystem data
  bridges: Array<any>;
  dexs: Array<any>;
  services: Array<any>;
  
  // Health
  ecosystemHealth: string;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

export interface BaseSavingsInfo {
  l1Cost: number;
  baseCost: number;
  savings: number;
  savingsPercent: number;
}

export function useBaseEcosystem() {
  const { address, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  
  const [state, setState] = useState<BaseEcosystemState>({
    blockNumber: 0,
    gasPrice: '0',
    isBase: false,
    estimatedGasPrice: null,
    gasRecommendation: null,
    estimatedTxCost: null,
    bridges: [],
    dexs: [],
    services: [],
    ecosystemHealth: 'unknown',
    isLoading: false,
    error: null,
  });

  const [savings, setSavings] = useState<BaseSavingsInfo | null>(null);

  // Initialize ecosystem data on mount
  const initializeEcosystem = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch network stats
      const stats = await getBaseNetworkStats();
      
      // Fetch gas price estimation
      const gasEstimate = await estimateBaseGasPrice();
      
      // Calculate savings
      const savingsData = calculateBaseSavings(50, 'complex'); // 50 Gwei L1 gas price
      
      // Get ecosystem data
      const bridges = getBaseBridges();
      const dexs = getBaseDexs();
      const services = getBaseServices();
      
      // Get ecosystem health
      const health = await getBaseEcosystemHealth();

      setState(prev => ({
        ...prev,
        blockNumber: stats.blockNumber,
        gasPrice: stats.gasPrice,
        isBase: stats.isBase,
        estimatedGasPrice: gasEstimate.gasPrice,
        gasRecommendation: gasEstimate.recommendation,
        estimatedTxCost: gasEstimate.priceInUSD,
        bridges,
        dexs,
        services,
        ecosystemHealth: health.status,
        isLoading: false,
      }));

      setSavings(savingsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeEcosystem();
  }, [initializeEcosystem]);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      initializeEcosystem();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [initializeEcosystem]);

  // Memoized calculations
  const userInfo = useMemo(() => {
    return {
      isOnBase: chain?.id === 8453 || chain?.id === 84532,
      chainName: chain?.name || 'Unknown',
      balance: balance?.formatted || '0',
      balanceSymbol: balance?.symbol || 'ETH',
    };
  }, [chain, balance]);

  // Get specific bridge URL
  const getBridgeLink = useCallback((bridgeId: string, token?: string, amount?: string) => {
    const bridge = BASE_ECOSYSTEM.BRIDGES[bridgeId as keyof typeof BASE_ECOSYSTEM.BRIDGES];
    if (!bridge) return '';
    
    let url = bridge.url;
    if (token && amount) {
      url += `?token=${token}&amount=${amount}&toChain=8453`;
    }
    return url;
  }, []);

  // Get specific DEX swap URL
  const getSwapLink = useCallback((dexId: string, fromToken: string, toToken: string) => {
    const dex = BASE_ECOSYSTEM.DEXS[dexId as keyof typeof BASE_ECOSYSTEM.DEXS];
    if (!dex) return '';

    const baseUrl = dexId === 'UNISWAP_V3' 
      ? 'https://app.uniswap.org/swap?chain=base'
      : dexId === 'AERODROME'
      ? 'https://aerodrome.finance/swap'
      : '';

    return baseUrl;
  }, []);

  // Get token info
  const getTokenInfo = useCallback((symbol: string) => {
    return BASE_ECOSYSTEM.TOKENS[symbol as keyof typeof BASE_ECOSYSTEM.TOKENS] || null;
  }, []);

  return {
    // State
    ...state,
    
    // User info
    userInfo,
    
    // Savings info
    savings,
    
    // Callbacks
    getBridgeLink,
    getSwapLink,
    getTokenInfo,
    refresh: initializeEcosystem,
  };
}

/**
 * Hook to check Base ecosystem availability
 * Useful for feature flags and conditional rendering
 */
export function useBaseAvailable() {
  const { isBase } = useBaseEcosystem();

  return {
    isBaseAvailable: isBase,
    shouldShowBaseFeaturesOnly: isBase,
  };
}

/**
 * Hook to monitor Base gas prices
 * Updates periodically and provides recommendations
 */
export function useBaseGasMonitor() {
  const { estimatedGasPrice, gasRecommendation } = useBaseEcosystem();
  
  const [gasHistory, setGasHistory] = useState<Array<{ price: string; timestamp: number }>>([]);

  useEffect(() => {
    if (!estimatedGasPrice) return;

    setGasHistory(prev => [
      ...prev.slice(-59), // Keep last 60 readings
      { price: estimatedGasPrice, timestamp: Date.now() }
    ]);
  }, [estimatedGasPrice]);

  const gasAverage = useMemo(() => {
    if (gasHistory.length === 0) return '0';
    const sum = gasHistory.reduce((acc, item) => acc + parseFloat(item.price), 0);
    return (sum / gasHistory.length).toFixed(4);
  }, [gasHistory]);

  const gasTrend = useMemo(() => {
    if (gasHistory.length < 2) return 'stable';
    const recent = parseFloat(gasHistory[gasHistory.length - 1].price);
    const previous = parseFloat(gasHistory[gasHistory.length - 2].price);
    
    if (recent > previous * 1.05) return 'increasing';
    if (recent < previous * 0.95) return 'decreasing';
    return 'stable';
  }, [gasHistory]);

  return {
    currentGasPrice: estimatedGasPrice,
    gasAverage,
    gasTrend,
    recommendation: gasRecommendation,
    historyLength: gasHistory.length,
  };
}

/**
 * Hook for Base ecosystem cost comparison
 * Shows cost savings vs Ethereum L1
 */
export function useBaseCostComparison(txComplexity: 'simple' | 'complex' = 'simple') {
  const { savings } = useBaseEcosystem();

  const comparison = useMemo(() => {
    if (!savings) return null;

    return {
      ethereumCost: `$${savings.l1Cost.toFixed(2)}`,
      baseCost: `$${savings.baseCost.toFixed(2)}`,
      savedAmount: `$${savings.savings.toFixed(2)}`,
      savingsPercent: `${savings.savingsPercent.toFixed(1)}%`,
      isSignificant: savings.savingsPercent > 50,
    };
  }, [savings]);

  return comparison;
}

/**
 * Hook to check if Base ecosystem service is available
 */
export function useBaseServiceAvailable(serviceId: string) {
  const { services } = useBaseEcosystem();

  const isAvailable = useMemo(() => {
    return services.some(s => s.id === serviceId);
  }, [services, serviceId]);

  const service = useMemo(() => {
    return services.find(s => s.id === serviceId) || null;
  }, [services, serviceId]);

  return { isAvailable, service };
}

export default useBaseEcosystem;
