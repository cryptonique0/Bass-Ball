import { useMemo, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { encodeFunctionData, decodeFunctionResult, type Abi } from 'viem';
import type { ContractReadCall, ContractWriteCall } from './contractABIs';

/**
 * Hook for safe contract read operations
 * Handles errors gracefully and returns typed data
 */
export const useContractRead = (params: ContractReadCall) => {
  const { data, isLoading, error, refetch, queryKey } = useReadContract({
    address: params.address as `0x${string}`,
    abi: params.abi,
    functionName: params.functionName,
    args: params.args,
  });

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    isLoading,
    error: error?.message || null,
    refresh,
    queryKey,
  };
};

/**
 * Hook for safe contract write operations
 * Handles transaction lifecycle and errors
 */
export const useContractWrite = (params: ContractWriteCall) => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const write = useCallback(() => {
    try {
      writeContract({
        address: params.address as `0x${string}`,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
        value: params.value,
      });
    } catch (err) {
      console.error('Contract write error:', err);
    }
  }, [writeContract, params]);

  return {
    write,
    hash,
    receipt,
    isPending,
    isConfirming,
    isSuccess,
    error: error?.message || null,
  };
};

/**
 * Hook for batch contract reads
 * Efficiently read multiple contracts at once
 */
export const useMultipleReads = (calls: ContractReadCall[]) => {
  const results = calls.map(call => useReadContract({
    address: call.address as `0x${string}`,
    abi: call.abi,
    functionName: call.functionName,
    args: call.args,
  }));

  const data = useMemo(() => results.map(r => r.data), [results]);
  const isLoading = useMemo(() => results.some(r => r.isLoading), [results]);
  const errors = useMemo(() => results.map(r => r.error?.message), [results]);

  return {
    data,
    isLoading,
    errors,
  };
};

/**
 * Helper to encode contract function calls
 */
export const encodeContractCall = (
  abi: Abi,
  functionName: string,
  args?: any[]
): string => {
  try {
    return encodeFunctionData({
      abi,
      functionName,
      args,
    });
  } catch (err) {
    console.error('Encode call error:', err);
    return '0x';
  }
};

/**
 * Helper to decode contract read results
 */
export const decodeContractResult = (
  abi: Abi,
  functionName: string,
  data: string
): any => {
  try {
    return decodeFunctionResult({
      abi,
      functionName,
      data: data as `0x${string}`,
    });
  } catch (err) {
    console.error('Decode result error:', err);
    return null;
  }
};

/**
 * Hook for token operations (ERC20)
 */
export const useTokenOps = (tokenAddress: string, spenderAddress?: string) => {
  // Import here to avoid circular deps
  const { GAME_TOKEN_ABI } = require('./contractABIs');

  const balance = useContractRead({
    address: tokenAddress,
    abi: GAME_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [spenderAddress],
  });

  const decimals = useContractRead({
    address: tokenAddress,
    abi: GAME_TOKEN_ABI,
    functionName: 'decimals',
  });

  const symbol = useContractRead({
    address: tokenAddress,
    abi: GAME_TOKEN_ABI,
    functionName: 'symbol',
  });

  const formatBalance = useCallback((raw: bigint) => {
    if (!decimals.data) return '0';
    const dec = Number(decimals.data);
    const divisor = BigInt(10) ** BigInt(dec);
    const major = raw / divisor;
    const minor = (raw % divisor * BigInt(100)) / divisor;
    return `${major}.${String(minor).padStart(2, '0')}`;
  }, [decimals.data]);

  return {
    balance,
    decimals,
    symbol,
    formatBalance,
  };
};

/**
 * Hook for NFT operations (ERC721)
 */
export const useNFTOps = (nftAddress: string, userAddress?: string) => {
  const { BASSBALL_NFT_ABI } = require('./contractABIs');

  const balance = useContractRead({
    address: nftAddress,
    abi: BASSBALL_NFT_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : [],
  });

  const totalSupply = useContractRead({
    address: nftAddress,
    abi: BASSBALL_NFT_ABI,
    functionName: 'totalSupply',
  });

  const ownerOf = useCallback((tokenId: bigint) => {
    return useContractRead({
      address: nftAddress,
      abi: BASSBALL_NFT_ABI,
      functionName: 'ownerOf',
      args: [tokenId],
    });
  }, [nftAddress]);

  const tokenURI = useCallback((tokenId: bigint) => {
    return useContractRead({
      address: nftAddress,
      abi: BASSBALL_NFT_ABI,
      functionName: 'tokenURI',
      args: [tokenId],
    });
  }, [nftAddress]);

  return {
    balance,
    totalSupply,
    ownerOf,
    tokenURI,
  };
};
