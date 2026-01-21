import { useCallback, useMemo } from 'react';
import { useContractRead, useContractWrite } from 'wagmi';
import { parseAbi, encodeFunctionData, decodeFunctionResult } from 'viem';

/**
 * GameToken ERC20 contract functions
 */
export const GAME_TOKEN_ABI = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
]);

/**
 * BassBall Game contract functions
 */
export const BASSBALL_GAME_ABI = parseAbi([
  'function playerStats(address player) external view returns (uint256 level, uint256 wins, uint256 losses, uint256 totalScore)',
  'function registerPlayer(string calldata username) external',
  'function startMatch(address opponent) external returns (uint256 matchId)',
  'function submitScore(uint256 matchId, uint256 homeScore, uint256 awayScore) external',
  'function claimRewards(uint256 matchId) external',
  'function getCurrentSeason() external view returns (uint256)',
  'function getPlayerEarnings(address player) external view returns (uint256)',
]);

/**
 * Team NFT contract functions
 */
export const TEAM_NFT_ABI = parseAbi([
  'function balanceOf(address owner) external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function getTeamInfo(uint256 teamId) external view returns (string name, string symbol, uint256 totalSupply)',
  'function createTeam(string calldata name, string calldata symbol) external returns (uint256)',
  'function mintTeamNFT(uint256 teamId, address to) external returns (uint256)',
]);

interface PlayerStats {
  level: number;
  wins: number;
  losses: number;
  totalScore: number;
}

interface TeamInfo {
  name: string;
  symbol: string;
  totalSupply: number;
}

/**
 * Hook for interacting with GameToken ERC20
 */
export const useGameToken = (tokenAddress: string, userAddress?: string) => {
  const { data: balance } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: GAME_TOKEN_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    enabled: !!userAddress,
  });

  const { data: symbol } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: GAME_TOKEN_ABI,
    functionName: 'symbol',
  });

  const { data: decimals } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: GAME_TOKEN_ABI,
    functionName: 'decimals',
  });

  const { writeAsync: approve } = useContractWrite({
    address: tokenAddress as `0x${string}`,
    abi: GAME_TOKEN_ABI,
    functionName: 'approve',
  });

  const { writeAsync: transfer } = useContractWrite({
    address: tokenAddress as `0x${string}`,
    abi: GAME_TOKEN_ABI,
    functionName: 'transfer',
  });

  const formatBalance = useCallback((raw: bigint) => {
    if (!decimals) return '0';
    const divisor = BigInt(10) ** BigInt(decimals);
    const major = raw / divisor;
    const minor = (raw % divisor * BigInt(100)) / divisor;
    return `${major}.${String(minor).padStart(2, '0')}`;
  }, [decimals]);

  return {
    balance,
    symbol: symbol as string,
    decimals: decimals as number,
    formatBalance,
    approve,
    transfer,
  };
};

/**
 * Hook for interacting with BassBall Game contract
 */
export const useBassBallGame = (gameAddress: string, playerAddress?: string) => {
  const { data: playerStats } = useContractRead({
    address: gameAddress as `0x${string}`,
    abi: BASSBALL_GAME_ABI,
    functionName: 'playerStats',
    args: playerAddress ? [playerAddress as `0x${string}`] : undefined,
    enabled: !!playerAddress,
  });

  const { data: currentSeason } = useContractRead({
    address: gameAddress as `0x${string}`,
    abi: BASSBALL_GAME_ABI,
    functionName: 'getCurrentSeason',
  });

  const { data: earnings } = useContractRead({
    address: gameAddress as `0x${string}`,
    abi: BASSBALL_GAME_ABI,
    functionName: 'getPlayerEarnings',
    args: playerAddress ? [playerAddress as `0x${string}`] : undefined,
    enabled: !!playerAddress,
  });

  const { writeAsync: registerPlayer } = useContractWrite({
    address: gameAddress as `0x${string}`,
    abi: BASSBALL_GAME_ABI,
    functionName: 'registerPlayer',
  });

  const { writeAsync: startMatch } = useContractWrite({
    address: gameAddress as `0x${string}`,
    abi: BASSBALL_GAME_ABI,
    functionName: 'startMatch',
  });

  const { writeAsync: submitScore } = useContractWrite({
    address: gameAddress as `0x${string}`,
    abi: BASSBALL_GAME_ABI,
    functionName: 'submitScore',
  });

  const { writeAsync: claimRewards } = useContractWrite({
    address: gameAddress as `0x${string}`,
    abi: BASSBALL_GAME_ABI,
    functionName: 'claimRewards',
  });

  const stats = useMemo((): PlayerStats | null => {
    if (!playerStats) return null;
    const [level, wins, losses, totalScore] = playerStats;
    return {
      level: Number(level),
      wins: Number(wins),
      losses: Number(losses),
      totalScore: Number(totalScore),
    };
  }, [playerStats]);

  return {
    stats,
    currentSeason: currentSeason ? Number(currentSeason) : 0,
    earnings: earnings || BigInt(0),
    registerPlayer,
    startMatch,
    submitScore,
    claimRewards,
  };
};

/**
 * Hook for interacting with Team NFT contract
 */
export const useTeamNFT = (teamNFTAddress: string, userAddress?: string) => {
  const { data: balance } = useContractRead({
    address: teamNFTAddress as `0x${string}`,
    abi: TEAM_NFT_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    enabled: !!userAddress,
  });

  const { writeAsync: createTeam } = useContractWrite({
    address: teamNFTAddress as `0x${string}`,
    abi: TEAM_NFT_ABI,
    functionName: 'createTeam',
  });

  const { writeAsync: mintTeamNFT } = useContractWrite({
    address: teamNFTAddress as `0x${string}`,
    abi: TEAM_NFT_ABI,
    functionName: 'mintTeamNFT',
  });

  return {
    balance: balance ? Number(balance) : 0,
    createTeam,
    mintTeamNFT,
  };
};

/**
 * Contract address manager singleton
 */
class ContractRegistry {
  private static instance: ContractRegistry;
  private contracts: Record<string, Record<number, string>> = {
    GAME_TOKEN: {
      8453: process.env.NEXT_PUBLIC_GAME_TOKEN_BASE || '0x',
      84532: process.env.NEXT_PUBLIC_GAME_TOKEN_SEPOLIA || '0x',
    },
    BASSBALL_GAME: {
      8453: process.env.NEXT_PUBLIC_BASSBALL_GAME_BASE || '0x',
      84532: process.env.NEXT_PUBLIC_BASSBALL_GAME_SEPOLIA || '0x',
    },
    TEAM_NFT: {
      8453: process.env.NEXT_PUBLIC_TEAM_NFT_BASE || '0x',
      84532: process.env.NEXT_PUBLIC_TEAM_NFT_SEPOLIA || '0x',
    },
  };

  private constructor() {}

  public static getInstance(): ContractRegistry {
    if (!ContractRegistry.instance) {
      ContractRegistry.instance = new ContractRegistry();
    }
    return ContractRegistry.instance;
  }

  public getAddress(contractName: keyof typeof this.contracts, chainId: number): string {
    return this.contracts[contractName]?.[chainId] || '';
  }

  public getAllAddresses(chainId: number) {
    return {
      gameToken: this.getAddress('GAME_TOKEN', chainId),
      bassBallGame: this.getAddress('BASSBALL_GAME', chainId),
      teamNFT: this.getAddress('TEAM_NFT', chainId),
    };
  }
}

export const contractRegistry = ContractRegistry.getInstance();
