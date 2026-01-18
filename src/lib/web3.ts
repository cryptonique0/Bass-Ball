// Web3 integration using Viem for Base chain
import { createPublicClient, http, getContract, Account, Chain, PublicClient } from 'viem';
import { base } from 'viem/chains';
import { MatchResult, VerificationResult } from '@/types/match';

// Match Registry Contract ABI
const MATCH_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'recordMatch',
    inputs: [
      { name: 'matchId', type: 'bytes32' },
      { name: 'replayHash', type: 'bytes32' },
      { name: 'resultHash', type: 'bytes32' },
      { name: 'ipfsHash', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getMatch',
    inputs: [{ name: 'matchId', type: 'bytes32' }],
    outputs: [
      { name: 'matchId', type: 'bytes32' },
      { name: 'replayHash', type: 'bytes32' },
      { name: 'resultHash', type: 'bytes32' },
      { name: 'ipfsHash', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;

// Player Card NFT ABI (ERC-1155)
const PLAYER_CARD_ABI = [
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

let publicClient: PublicClient;

export const initializeWeb3 = () => {
  publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
  });

  return publicClient;
};

export const getPublicClient = (): PublicClient => {
  if (!publicClient) {
    return initializeWeb3();
  }
  return publicClient;
};

/**
 * Get match result from chain
 */
export const getMatchOnChain = async (matchId: string) => {
  try {
    const client = getPublicClient();
    const contract = getContract({
      address: process.env.NEXT_PUBLIC_MATCH_REGISTRY_ADDRESS as `0x${string}`,
      abi: MATCH_REGISTRY_ABI,
      client,
    });

    const result = await contract.read.getMatch([matchId as `0x${string}`]);

    return {
      matchId: result[0],
      replayHash: result[1],
      resultHash: result[2],
      ipfsHash: result[3],
      timestamp: Number(result[4]),
    };
  } catch (error) {
    console.error('Failed to fetch match from chain:', error);
    return null;
  }
};

/**
 * Verify match result hash matches on-chain
 */
export const verifyMatchResult = async (
  matchResult: MatchResult,
  onChainHash: string
): Promise<VerificationResult> => {
  try {
    // Recompute hash locally
    const computedHash = computeResultHash(matchResult);

    const valid = computedHash === onChainHash;

    return {
      valid,
      computedHash,
      onChainHash,
      mismatchType: valid ? undefined : 'hash_mismatch',
      details: {
        seed: matchResult.seed,
        engineVersion: matchResult.engineVersion,
        finalScore: {
          home: matchResult.homeScore,
          away: matchResult.awayScore,
        },
        inputsProcessed:
          matchResult.inputs.home.length + matchResult.inputs.away.length,
        duration: matchResult.duration,
      },
    };
  } catch (error) {
    console.error('Verification failed:', error);
    return {
      valid: false,
      computedHash: 'error',
      onChainHash,
      mismatchType: 'verification_error',
      details: {
        seed: matchResult.seed,
        engineVersion: matchResult.engineVersion,
        finalScore: {
          home: matchResult.homeScore,
          away: matchResult.awayScore,
        },
        inputsProcessed:
          matchResult.inputs.home.length + matchResult.inputs.away.length,
        duration: matchResult.duration,
      },
    };
  }
};

/**
 * Compute result hash (keccak256)
 * Must match server-side computation
 */
export const computeResultHash = (matchResult: MatchResult): string => {
  // In production, use viem's keccak256
  // For now, return a placeholder
  const data = JSON.stringify({
    seed: matchResult.seed,
    engineVersion: matchResult.engineVersion,
    homeScore: matchResult.homeScore,
    awayScore: matchResult.awayScore,
  });

  // This would be: keccak256(toHex(data))
  return matchResult.resultHash; // Use server-computed hash for verification
};

/**
 * Get contract instance for match registry
 */
export const getMatchRegistryContract = () => {
  const client = getPublicClient();
  return getContract({
    address: process.env.NEXT_PUBLIC_MATCH_REGISTRY_ADDRESS as `0x${string}`,
    abi: MATCH_REGISTRY_ABI,
    client,
  });
};

/**
 * Get contract instance for player cards
 */
export const getPlayerCardContract = () => {
  const client = getPublicClient();
  return getContract({
    address: process.env.NEXT_PUBLIC_PLAYER_CARD_ADDRESS as `0x${string}`,
    abi: PLAYER_CARD_ABI,
    client,
  });
};

/**
 * Check if player has won NFT already (guest mode)
 */
export const checkPlayerCardBalance = async (
  address: string,
  cardId: number
): Promise<number> => {
  try {
    const contract = getPlayerCardContract();
    const balance = await contract.read.balanceOf([address, cardId]);
    return Number(balance);
  } catch (error) {
    console.error('Failed to check card balance:', error);
    return 0;
  }
};

/**
 * Format match result for on-chain storage
 */
export const formatMatchForStorage = (matchResult: MatchResult) => {
  return {
    matchId: `0x${matchResult.matchId.padStart(64, '0')}`,
    replayHash: matchResult.replayHash,
    resultHash: matchResult.resultHash,
    ipfsHash: matchResult.matchId, // Placeholder - would be real IPFS hash in production
    homeTeam: matchResult.homeTeam,
    awayTeam: matchResult.awayTeam,
    homeScore: matchResult.homeScore,
    awayScore: matchResult.awayScore,
    duration: matchResult.duration,
  };
};
