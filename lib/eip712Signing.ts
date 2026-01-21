import { useCallback, useState } from 'react';
import { useAccount, useSignTypedData, usePublicClient } from 'wagmi';
import { recoverTypedDataAddress, verifyTypedData } from 'viem';
import type { Address, TypedData } from 'viem';

/**
 * EIP-712 Domain Separator
 * Ensures signatures are specific to a particular chain and contract
 */
export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Address;
}

/**
 * Standard typed data for gameplay actions
 */
export const GAME_ACTION_TYPE = {
  GameAction: [
    { name: 'player', type: 'address' },
    { name: 'action', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'gameData', type: 'bytes' },
  ],
} as const;

/**
 * Standard typed data for item purchases
 */
export const ITEM_PURCHASE_TYPE = {
  ItemPurchase: [
    { name: 'buyer', type: 'address' },
    { name: 'itemId', type: 'uint256' },
    { name: 'amount', type: 'uint256' },
    { name: 'price', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

/**
 * Standard typed data for tournament entry
 */
export const TOURNAMENT_ENTRY_TYPE = {
  TournamentEntry: [
    { name: 'player', type: 'address' },
    { name: 'tournamentId', type: 'uint256' },
    { name: 'entryFee', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

/**
 * Hook for EIP-712 typed data signing
 */
export const useEIP712Sign = () => {
  const { address } = useAccount();
  const { signTypedDataAsync, isPending } = useSignTypedData();
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signGameAction = useCallback(
    async (
      domain: EIP712Domain,
      player: Address,
      action: string,
      gameData: string,
      nonce: bigint
    ) => {
      try {
        setError(null);
        const timestamp = BigInt(Math.floor(Date.now() / 1000));

        const signature = await signTypedDataAsync({
          domain: {
            name: domain.name,
            version: domain.version,
            chainId: domain.chainId,
            verifyingContract: domain.verifyingContract,
          },
          types: GAME_ACTION_TYPE,
          primaryType: 'GameAction',
          message: {
            player,
            action,
            timestamp,
            nonce,
            gameData: gameData as `0x${string}`,
          },
        });

        setSignature(signature);
        return signature;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign failed';
        setError(message);
        throw err;
      }
    },
    [signTypedDataAsync]
  );

  const signItemPurchase = useCallback(
    async (
      domain: EIP712Domain,
      buyer: Address,
      itemId: bigint,
      amount: bigint,
      price: bigint,
      nonce: bigint
    ) => {
      try {
        setError(null);
        const timestamp = BigInt(Math.floor(Date.now() / 1000));

        const signature = await signTypedDataAsync({
          domain: {
            name: domain.name,
            version: domain.version,
            chainId: domain.chainId,
            verifyingContract: domain.verifyingContract,
          },
          types: ITEM_PURCHASE_TYPE,
          primaryType: 'ItemPurchase',
          message: {
            buyer,
            itemId,
            amount,
            price,
            timestamp,
            nonce,
          },
        });

        setSignature(signature);
        return signature;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign failed';
        setError(message);
        throw err;
      }
    },
    [signTypedDataAsync]
  );

  const signTournamentEntry = useCallback(
    async (
      domain: EIP712Domain,
      player: Address,
      tournamentId: bigint,
      entryFee: bigint,
      nonce: bigint
    ) => {
      try {
        setError(null);
        const timestamp = BigInt(Math.floor(Date.now() / 1000));

        const signature = await signTypedDataAsync({
          domain: {
            name: domain.name,
            version: domain.version,
            chainId: domain.chainId,
            verifyingContract: domain.verifyingContract,
          },
          types: TOURNAMENT_ENTRY_TYPE,
          primaryType: 'TournamentEntry',
          message: {
            player,
            tournamentId,
            entryFee,
            timestamp,
            nonce,
          },
        });

        setSignature(signature);
        return signature;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign failed';
        setError(message);
        throw err;
      }
    },
    [signTypedDataAsync]
  );

  const clearSignature = useCallback(() => {
    setSignature(null);
    setError(null);
  }, []);

  return {
    address,
    signature,
    error,
    isPending,
    signGameAction,
    signItemPurchase,
    signTournamentEntry,
    clearSignature,
  };
};

/**
 * Utility functions for signature verification
 */
export const recoverSignerFromTypedData = async (
  domain: EIP712Domain,
  types: TypedData,
  primaryType: string,
  message: any,
  signature: `0x${string}`
): Promise<Address | null> => {
  try {
    const recoveredAddress = await recoverTypedDataAddress({
      domain: {
        name: domain.name,
        version: domain.version,
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract,
      },
      types,
      primaryType,
      message,
      signature,
    });
    return recoveredAddress;
  } catch (err) {
    console.error('Recovery failed:', err);
    return null;
  }
};

/**
 * Verify EIP-712 signature matches signer
 */
export const verifyEIP712Signature = async (
  domain: EIP712Domain,
  types: TypedData,
  primaryType: string,
  message: any,
  signature: `0x${string}`,
  expectedSigner: Address
): Promise<boolean> => {
  try {
    const signer = await recoverSignerFromTypedData(
      domain,
      types,
      primaryType,
      message,
      signature
    );
    return signer?.toLowerCase() === expectedSigner.toLowerCase();
  } catch (err) {
    return false;
  }
};
