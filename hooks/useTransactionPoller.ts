import { useCallback, useState, useRef, useEffect } from 'react';

export type PollStatus = 'idle' | 'polling' | 'confirmed' | 'failed' | 'timeout';

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  confirmations: number;
  gasUsed: bigint;
  status: 0 | 1;
}

export interface PollState {
  txHash: string;
  status: PollStatus;
  receipt: TransactionReceipt | null;
  confirmations: number;
  requiredConfirmations: number;
  error: string | null;
  progress: number;
}

export const useTransactionPoller = (chainId = 8453) => {
  const [pollState, setPollState] = useState<PollState | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);

  const getRpcUrl = useCallback(() => {
    const isSepolia = chainId === 84532;
    return isSepolia
      ? process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
      : process.env.NEXT_PUBLIC_BASE_RPC_URL;
  }, [chainId]);

  const getTransactionReceipt = useCallback(async (txHash: string) => {
    const rpcUrl = getRpcUrl();
    if (!rpcUrl) return null;

    try {
      const resp = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [txHash],
          id: 1,
        }),
      });

      const data = await resp.json();
      return data.result;
    } catch (err) {
      console.error('Receipt fetch error:', err);
      return null;
    }
  }, [getRpcUrl]);

  const getCurrentBlockNumber = useCallback(async () => {
    const rpcUrl = getRpcUrl();
    if (!rpcUrl) return 0;

    try {
      const resp = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          id: 1,
        }),
      });

      const data = await resp.json();
      return parseInt(data.result, 16);
    } catch (err) {
      console.error('Block number fetch error:', err);
      return 0;
    }
  }, [getRpcUrl]);

  const pollTransaction = useCallback(
    async (
      txHash: string,
      requiredConfirmations = 2,
      maxAttempts = 120,
      pollInterval = 2500
    ) => {
      setPollState({
        txHash,
        status: 'polling',
        receipt: null,
        confirmations: 0,
        requiredConfirmations,
        error: null,
        progress: 0,
      });

      attemptsRef.current = 0;

      const pollFn = async () => {
        try {
          attemptsRef.current += 1;

          const receipt = await getTransactionReceipt(txHash);

          if (!receipt) {
            const progress = (attemptsRef.current / maxAttempts) * 30;
            setPollState(prev => prev ? {
              ...prev,
              progress: Math.min(progress, 30),
            } : null);

            if (attemptsRef.current >= maxAttempts) {
              setPollState(prev => prev ? {
                ...prev,
                status: 'timeout' as const,
                error: 'Transaction confirmation timeout',
                progress: 100,
              } : null);
              if (pollingRef.current) clearInterval(pollingRef.current);
              return;
            }
            return;
          }

          const currentBlock = await getCurrentBlockNumber();
          const txBlock = parseInt(receipt.blockNumber, 16);
          const confirmations = Math.max(0, currentBlock - txBlock + 1);

          const progress = 30 + (confirmations / requiredConfirmations) * 60;

          const isConfirmed = confirmations >= requiredConfirmations;
          const isFailed = receipt.status === 0;

          setPollState(prev => prev ? {
            ...prev,
            receipt: {
              transactionHash: receipt.transactionHash,
              blockNumber: txBlock,
              blockHash: receipt.blockHash,
              confirmations,
              gasUsed: BigInt(receipt.gasUsed),
              status: receipt.status,
            },
            confirmations,
            progress: Math.min(progress, isConfirmed ? 100 : 95),
            status: isFailed
              ? ('failed' as const)
              : isConfirmed
              ? ('confirmed' as const)
              : ('polling' as const),
          } : null);

          if (isConfirmed || isFailed) {
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        } catch (error) {
          const err = error instanceof Error ? error.message : 'Unknown error';
          setPollState(prev => prev ? {
            ...prev,
            status: 'failed' as const,
            error: err,
            progress: 100,
          } : null);
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      };

      pollingRef.current = setInterval(pollFn, pollInterval);
      await pollFn();
    },
    [getTransactionReceipt, getCurrentBlockNumber]
  );

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return {
    pollState,
    pollTransaction,
    stopPolling,
    getTransactionReceipt,
    getCurrentBlockNumber,
  };
};
