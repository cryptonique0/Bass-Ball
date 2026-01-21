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

  const getReceipt = useCallback(async (txHash: string) => {
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
      console.error('Receipt error:', err);
      return null;
    }
  }, [getRpcUrl]);

  const getBlockNum = useCallback(async () => {
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
      return 0;
    }
  }, [getRpcUrl]);

  const pollTx = useCallback(
    async (txHash: string, needed = 2, maxAt = 120, pollInt = 2500) => {
      setPollState({
        txHash,
        status: 'polling',
        receipt: null,
        confirmations: 0,
        requiredConfirmations: needed,
        error: null,
        progress: 0,
      });

      attemptsRef.current = 0;

      const poll = async () => {
        try {
          attemptsRef.current += 1;
          const receipt = await getReceipt(txHash);

          if (!receipt) {
            const prg = (attemptsRef.current / maxAt) * 30;
            setPollState(prev => prev ? {...prev, progress: Math.min(prg, 30)} : null);
            if (attemptsRef.current >= maxAt) {
              setPollState(prev => prev ? {
                ...prev,
                status: 'timeout' as const,
                error: 'Timeout',
                progress: 100,
              } : null);
              if (pollingRef.current) clearInterval(pollingRef.current);
            }
            return;
          }

          const currBlock = await getBlockNum();
          const txBlock = parseInt(receipt.blockNumber, 16);
          const confirms = Math.max(0, currBlock - txBlock + 1);
          const prg = 30 + (confirms / needed) * 60;
          const isConfirmed = confirms >= needed;
          const isFailed = receipt.status === 0;

          setPollState(prev => prev ? {
            ...prev,
            receipt: {
              transactionHash: receipt.transactionHash,
              blockNumber: txBlock,
              blockHash: receipt.blockHash,
              confirmations: confirms,
              gasUsed: BigInt(receipt.gasUsed),
              status: receipt.status,
            },
            confirmations: confirms,
            progress: Math.min(prg, isConfirmed ? 100 : 95),
            status: isFailed ? ('failed' as const) : isConfirmed ? ('confirmed' as const) : ('polling' as const),
          } : null);

          if (isConfirmed || isFailed) {
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        } catch (error) {
          const err = error instanceof Error ? error.message : 'Error';
          setPollState(prev => prev ? {
            ...prev,
            status: 'failed' as const,
            error: err,
            progress: 100,
          } : null);
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      };

      pollingRef.current = setInterval(poll, pollInt);
      await poll();
    },
    [getReceipt, getBlockNum]
  );

  const stop = useCallback(() => {
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
    pollTx,
    stop,
    getReceipt,
    getBlockNum,
  };
};
