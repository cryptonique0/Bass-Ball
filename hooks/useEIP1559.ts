import { useEffect, useRef, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';

interface FeeData {
  baseFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

interface FeeEstimate {
  slow: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint; estimatedTime: string };
  standard: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint; estimatedTime: string };
  fast: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint; estimatedTime: string };
  lastUpdated: number;
}

interface FeeMetrics {
  baseFee: bigint;
  feeEstimate: FeeEstimate | null;
  getSafeFeeData: () => FeeData | null;
  formatFee: (val: bigint) => string;
  refreshFees: () => Promise<void>;
  getGasPrice: () => bigint | null;
}

const formatWei = (val: bigint): string => {
  const gwei = Number(val) / 1e9;
  if (gwei >= 1) return `${gwei.toFixed(2)} Gwei`;
  const wei = Number(val);
  if (wei >= 1e6) return `${(wei / 1e6).toFixed(2)} Mwei`;
  return `${wei} wei`;
};

export function useEIP1559Fees(): FeeMetrics {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [baseFee, setBaseFee] = useState<bigint>(0n);
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null);
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const fetchFeeData = async () => {
    if (!publicClient) return;

    try {
      const blockData = await publicClient.getBlock({ blockTag: 'pending' });
      const baseFeePerGas = blockData.baseFeePerGas || 1n;
      setBaseFee(baseFeePerGas);

      const price = await publicClient.getGasPrice();
      setGasPrice(price);

      const prioritySlow = (baseFeePerGas * 1n) / 100n;
      const priorityStd = (baseFeePerGas * 15n) / 1000n;
      const priorityFast = (baseFeePerGas * 2n) / 100n;

      const baseMultiplier = baseFeePerGas * 2n;
      const buffer = (baseFeePerGas * 10n) / 100n;

      const slowMaxFee = baseMultiplier + prioritySlow + buffer;
      const stdMaxFee = baseMultiplier + priorityStd + buffer;
      const fastMaxFee = baseMultiplier + priorityFast + buffer;

      setFeeEstimate({
        slow: {
          maxFeePerGas: slowMaxFee,
          maxPriorityFeePerGas: prioritySlow,
          estimatedTime: '~30s',
        },
        standard: {
          maxFeePerGas: stdMaxFee,
          maxPriorityFeePerGas: priorityStd,
          estimatedTime: '~10s',
        },
        fast: {
          maxFeePerGas: fastMaxFee,
          maxPriorityFeePerGas: priorityFast,
          estimatedTime: '~3s',
        },
        lastUpdated: Date.now(),
      });

      lastUpdateRef.current = Date.now();
    } catch (err) {
      console.warn('Fee fetch error:', err);
    }
  };

  useEffect(() => {
    if (!publicClient) return;

    fetchFeeData();
    intervalRef.current = setInterval(fetchFeeData, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [publicClient]);

  const getSafeFeeData = (): FeeData | null => {
    if (!feeEstimate) return null;
    return {
      baseFeePerGas: baseFee,
      maxPriorityFeePerGas: feeEstimate.standard.maxPriorityFeePerGas,
    };
  };

  const refreshFees = async () => {
    await fetchFeeData();
  };

  const getGasPrice = (): bigint | null => {
    return gasPrice;
  };

  return {
    baseFee,
    feeEstimate,
    getSafeFeeData,
    formatFee: formatWei,
    refreshFees,
    getGasPrice,
  };
}