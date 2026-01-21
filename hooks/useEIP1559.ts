import { useCallback, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export interface FeeData {
  baseFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gasPrice: bigint;
}

export interface FeeEstimate {
  slow: FeeData;
  standard: FeeData;
  fast: FeeData;
  lastUpdated: number;
}

export const useEIP1559Fees = (chainId = 8453) => {
  const { isConnected } = useAccount();
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null);
  const [baseFee, setBaseFee] = useState<bigint | null>(null);
  
  const fetchFeeData = useCallback(async () => {
    try {
      const isSepolia = chainId === 84532;
      const rpcUrl = isSepolia
        ? process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
        : process.env.NEXT_PUBLIC_BASE_RPC_URL;

      if (!rpcUrl) return;

      const blockResp = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: ['pending', false],
          id: 1,
        }),
      });

      const blockData = await blockResp.json();
      const baseFeeHex = blockData.result?.baseFeePerGas || '0x1';
      const currentBase = BigInt(baseFeeHex);
      setBaseFee(currentBase);

      const gasPriceResp = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          id: 1,
        }),
      });

      const gasPriceData = await gasPriceResp.json();
      const currentPrice = BigInt(gasPriceData.result);

      const slowPri = currentBase / BigInt(100);
      const stdPri = (currentBase * BigInt(15)) / BigInt(100);
      const fastPri = (currentBase * BigInt(2)) / BigInt(10);

      const slowMax = (currentBase * BigInt(2)) + slowPri;
      const stdMax = (currentBase * BigInt(2)) + stdPri;
      const fastMax = (currentBase * BigInt(3)) + fastPri;

      setFeeEstimate({
        slow: {
          baseFeePerGas: currentBase,
          maxPriorityFeePerGas: slowPri,
          maxFeePerGas: slowMax,
          gasPrice: currentPrice,
        },
        standard: {
          baseFeePerGas: currentBase,
          maxPriorityFeePerGas: stdPri,
          maxFeePerGas: stdMax,
          gasPrice: currentPrice,
        },
        fast: {
          baseFeePerGas: currentBase,
          maxPriorityFeePerGas: fastPri,
          maxFeePerGas: fastMax,
          gasPrice: currentPrice,
        },
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('EIP-1559 fetch error:', error);
    }
  }, [chainId]);

  useEffect(() => {
    if (!isConnected) return;
    fetchFeeData();
    const interval = setInterval(fetchFeeData, 15000);
    return () => clearInterval(interval);
  }, [isConnected, fetchFeeData]);

  const getSafeFeeData = useCallback((strategy = 'standard') => {
    if (!feeEstimate) return null;
    const fees = feeEstimate[strategy as keyof typeof feeEstimate];
    return {
      ...fees,
      maxFeePerGas: (fees.maxFeePerGas * BigInt(110)) / BigInt(100),
    };
  }, [feeEstimate]);

  return {
    feeEstimate,
    baseFee,
    getSafeFeeData,
    refreshFees: fetchFeeData,
  };
};
