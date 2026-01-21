'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';

export type TransactionState = 'idle' | 'signing' | 'pending' | 'confirming' | 'completed' | 'error';

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: bigint;
  estimatedCostUSD?: number;
}

export interface TransactionData {
  hash?: string;
  state: TransactionState;
  error?: string;
  progress: number;
  confirmations: number;
  requiredConfirmations: number;
  gasUsed?: bigint;
  gasPrice?: bigint;
  totalCost?: bigint;
  explorerUrl?: string;
}

/**
 * Hook for handling blockchain transactions with gas optimization
 */
export const useTransaction = (chainId: number = 8453) => {
  const { address, isConnected } = useAccount();
  const [txData, setTxData] = useState<TransactionData>({
    state: 'idle',
    progress: 0,
    confirmations: 0,
    requiredConfirmations: 2,
  });

  const [gasPrices, setGasPrices] = useState<{
    fast: bigint;
    standard: bigint;
    slow: bigint;
  } | null>(null);

  /**
   * Estimate gas for a transaction
   */
  const estimateGas = useCallback(async (
    to: string,
    value: bigint,
    data?: string
  ): Promise<GasEstimate | null> => {
    if (!address) return null;

    try {
      const rpcUrl = chainId === 84532 
        ? process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
        : process.env.NEXT_PUBLIC_BASE_RPC_URL;

      if (!rpcUrl) return null;

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_estimateGas',
          params: [{
            from: address,
            to,
            value: `0x${value.toString(16)}`,
            data,
          }],
          id: 1,
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        console.error('Gas estimation error:', result.error);
        return null;
      }

      const gasLimit = BigInt(result.result);
      const gasPrice = gasPrices?.standard || BigInt(1e9);

      return {
        gasLimit,
        gasPrice,
        estimatedCost: gasLimit * gasPrice,
      };
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return null;
    }
  }, [address, chainId, gasPrices?.standard]);

  /**
   * Fetch current gas prices
   */
  const fetchGasPrices = useCallback(async () => {
    try {
      const rpcUrl = chainId === 84532 
        ? process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
        : process.env.NEXT_PUBLIC_BASE_RPC_URL;

      if (!rpcUrl) return;

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          id: 1,
        }),
      });

      const result = await response.json();
      const basePrice = BigInt(result.result);

      setGasPrices({
        standard: basePrice,
        fast: (basePrice * BigInt(12)) / BigInt(10),
        slow: (basePrice * BigInt(8)) / BigInt(10),
      });
    } catch (error) {
      console.error('Failed to fetch gas prices:', error);
    }
  }, [chainId]);

  /**
   * Fetch gas prices on mount and every 15 seconds
   */
  useEffect(() => {
    fetchGasPrices();
    const interval = setInterval(fetchGasPrices, 15000);
    return () => clearInterval(interval);
  }, [fetchGasPrices]);

  /**
   * Format gas cost to ETH and USD
   */
  const formatGasCost = useCallback((gas: bigint, price?: bigint): string => {
    const p = price || gasPrices?.standard || BigInt(1e9);
    const costWei = gas * p;
    const costEth = parseFloat(formatEther(costWei));
    
    const costUSD = (costEth * 2000).toFixed(2);
    
    return `${costEth.toFixed(6)} ETH (~$${costUSD})`;
  }, [gasPrices?.standard]);

  /**
   * Simulate transaction (dry run)
   */
  const simulateTransaction = useCallback(async (
    to: string,
    value: bigint,
    data?: string
  ): Promise<boolean> => {
    if (!address) return false;

    try {
      const rpcUrl = chainId === 84532 
        ? process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
        : process.env.NEXT_PUBLIC_BASE_RPC_URL;

      if (!rpcUrl) return false;

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            from: address,
            to,
            value: `0x${value.toString(16)}`,
            data,
          }, 'latest'],
          id: 1,
        }),
      });

      const result = await response.json();
      return !result.error;
    } catch (error) {
      console.error('Transaction simulation failed:', error);
      return false;
    }
  }, [address, chainId]);

  /**
   * Track transaction progress
   */
  const trackTransaction = useCallback(async (
    txHash: string,
    requiredConfirmations: number = 2
  ) => {
    setTxData(prev => ({
      ...prev,
      hash: txHash,
      state: 'pending' as const,
      progress: 20,
    }));

    try {
      const rpcUrl = chainId === 84532 
        ? process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
        : process.env.NEXT_PUBLIC_BASE_RPC_URL;

      if (!rpcUrl) return;

      let confirmations = 0;
      let attempts = 0;
      const maxAttempts = 120;

      while (confirmations < requiredConfirmations && attempts < maxAttempts) {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [txHash],
            id: 1,
          }),
        });

        const result = await response.json();
        const receipt = result.result;

        if (receipt) {
          const currentBlock = await (await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_blockNumber',
              id: 1,
            }),
          })).json();

          confirmations = parseInt(currentBlock.result, 16) - parseInt(receipt.blockNumber, 16) + 1;
          
          const progress = 20 + (confirmations / requiredConfirmations) * 60;
          setTxData(prev => ({
            ...prev,
            confirmations,
            progress: Math.min(progress, 80),
            state: confirmations >= requiredConfirmations ? 'confirming' as const : 'pending' as const,
            gasUsed: BigInt(receipt.gasUsed),
            explorerUrl: `https://${chainId === 84532 ? 'sepolia.' : ''}basescan.org/tx/${txHash}`,
          }));

          if (confirmations >= requiredConfirmations) break;
        }

        attempts++;
        await new Promise(r => setTimeout(r, 2500));
      }

      setTxData(prev => ({
        ...prev,
        state: confirmations >= requiredConfirmations ? 'completed' as const : 'error' as const,
        progress: 100,
        error: confirmations < requiredConfirmations ? 'Transaction timeout' : undefined,
      }));
    } catch (error) {
      console.error('Error tracking transaction:', error);
      setTxData(prev => ({
        ...prev,
        state: 'error' as const,
        error: error instanceof Error ? error.message : 'Transaction tracking failed',
      }));
    }
  }, [chainId]);

  /**
   * Optimize gas by selecting best gas price tier
   */
  const getOptimalGasPrice = useCallback((strategy: 'fast' | 'standard' | 'slow' = 'standard') => {
    return gasPrices?.[strategy];
  }, [gasPrices]);

  /**
   * Calculate transaction cost upfront
   */
  const calculateTransactionCost = useCallback(async (
    to: string,
    value: bigint,
    data?: string,
    gasMultiplier: number = 1.1
  ): Promise<bigint | null> => {
    const estimate = await estimateGas(to, value, data);
    if (!estimate) return null;

    const bufferedGas = (estimate.gasLimit * BigInt(Math.floor(gasMultiplier * 100))) / BigInt(100);
    const gasPrice = gasPrices?.standard || BigInt(1e9);
    
    return bufferedGas * gasPrice;
  }, [estimateGas, gasPrices?.standard]);

  return {
    txData,
    gasPrices,
    isConnected,
    estimateGas,
    fetchGasPrices,
    simulateTransaction,
    trackTransaction,
    calculateTransactionCost,
    getOptimalGasPrice,
    formatGasCost,
    resetTransaction: () => setTxData({
      state: 'idle',
      progress: 0,
      confirmations: 0,
      requiredConfirmations: 2,
    }),
  };
};
