import { getPublicClient, getMatchRegistryContract, getPlayerCardContract } from './web3';
import { MatchResult } from '@/types/match';

/**
 * Smart contract interaction helpers
 * These functions handle all contract writes and reads
 */

/**
 * Record match on-chain via Match Registry contract
 * This stores the match hash and metadata for verification
 */
export const recordMatchOnChain = async (matchResult: MatchResult): Promise<string | null> => {
  try {
    const client = getPublicClient();
    if (!client) {
      console.error('Web3 client not initialized');
      return null;
    }

    // In production, use wallet client to write to contract
    // For now, return a mock transaction hash
    const mockTxHash = `0x${Array(64)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('')}`;

    console.log('Recording match on-chain:', mockTxHash);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return mockTxHash;
  } catch (error) {
    console.error('Failed to record match on-chain:', error);
    return null;
  }
};

/**
 * Mint first-win NFT (gasless)
 * ERC-1155 token for celebrating first victory
 * Uses Paymaster for gasless transactions
 */
export const mintFirstWinNFT = async (playerId: string, matchId: string): Promise<string | null> => {
  try {
    const client = getPublicClient();
    if (!client) {
      console.error('Web3 client not initialized');
      return null;
    }

    // In production:
    // 1. Create wallet client from user's wallet
    // 2. Prepare contract write for PlayerCard.mint()
    // 3. Use Paymaster for gasless transaction
    // 4. Execute and wait for confirmation

    // For demo, return mock transaction
    const mockTxHash = `0x${Array(64)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('')}`;

    console.log('Minting first-win NFT:', mockTxHash);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return mockTxHash;
  } catch (error) {
    console.error('Failed to mint NFT:', error);
    return null;
  }
};

/**
 * Get all NFTs owned by player (ERC-1155 balance)
 * Used for profile page and shop displays
 */
export const getPlayerNFTs = async (playerId: string, playerAddress: string): Promise<NFTToken[]> => {
  try {
    const client = getPublicClient();
    if (!client) {
      console.error('Web3 client not initialized');
      return [];
    }

    // In production, use The Graph to query NFT balances
    // Graph query: query PlayerNFTs($address: String!) {
    //   account(id: $address) {
    //     ERC1155tokens { id, balance, metadata }
    //   }
    // }

    // For demo, return mock NFTs
    const mockNFTs: NFTToken[] = [
      {
        id: '1',
        name: 'First Win',
        tokenId: 1,
        balance: 1,
        rarity: 'common',
        image: '/nft/first-win.png',
        contractAddress: process.env.NEXT_PUBLIC_PLAYER_CARD_ADDRESS || '',
      },
    ];

    return mockNFTs;
  } catch (error) {
    console.error('Failed to fetch player NFTs:', error);
    return [];
  }
};

/**
 * Get team NFT (ERC-721 Soul-Bound)
 * Each player has a soul-bound team NFT that cannot be transferred
 */
export const getTeamNFT = async (playerId: string, playerAddress: string): Promise<TeamNFT | null> => {
  try {
    const client = getPublicClient();
    if (!client) {
      console.error('Web3 client not initialized');
      return null;
    }

    // In production:
    // 1. Query team registry for player's team
    // 2. Check soul-bound status
    // 3. Fetch team metadata (logo, colors, players)

    // For demo, return mock team NFT
    const mockTeamNFT: TeamNFT = {
      tokenId: 1,
      teamName: 'Bass Biters',
      league: 'Premier Division',
      ownerAddress: playerAddress,
      soulBound: true,
      founded: new Date('2024-01-01'),
      players: ['player1', 'player2', 'player3'],
      image: '/teams/bass-biters.png',
    };

    return mockTeamNFT;
  } catch (error) {
    console.error('Failed to fetch team NFT:', error);
    return null;
  }
};

/**
 * Check if player has minimum rating requirement (for tournament entry)
 * Used for gated tournament access
 */
export const checkTournamentEligibility = async (playerId: string, playerRating: number): Promise<boolean> => {
  try {
    // Verify player has minimum rating (1000 ELO)
    const minimumRating = 1000;
    return playerRating >= minimumRating;
  } catch (error) {
    console.error('Failed to check tournament eligibility:', error);
    return false;
  }
};

/**
 * Get tournament entry fee (USDC)
 * Variable based on player's current rating
 * 1000 ELO = $1, 1500 ELO = $5, 2000+ ELO = $25
 */
export const getTournamentFee = (playerRating: number): number => {
  if (playerRating >= 2000) return 25;
  if (playerRating >= 1500) return 5;
  if (playerRating >= 1200) return 2;
  return 1;
};

/**
 * Record match result with anti-cheat validator
 * Stores validation metadata along with match result
 */
export const recordMatchWithValidation = async (
  matchResult: MatchResult,
  validationScore: number,
  isFlagged: boolean
): Promise<string | null> => {
  try {
    // In production:
    // 1. Call Match Registry.recordMatch()
    // 2. Encode validation score and flagged status
    // 3. Emit MatchRecorded event with metadata
    // 4. Return transaction hash

    const mockTxHash = `0x${Array(64)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('')}`;

    console.log(
      'Recorded match with validation:',
      mockTxHash,
      'Score:',
      validationScore,
      'Flagged:',
      isFlagged
    );

    return mockTxHash;
  } catch (error) {
    console.error('Failed to record match with validation:', error);
    return null;
  }
};

/**
 * Burn cosmetic NFT during crafting process
 * 3 cosmetics → 1 new cosmetic (burning inputs)
 */
export const burnCosmeticNFT = async (
  playerAddress: string,
  tokenId: number,
  amount: number
): Promise<boolean> => {
  try {
    // In production:
    // 1. Use wallet client to call PlayerCard.burn()
    // 2. Specify amount to burn (supports partial burns)
    // 3. Wait for confirmation
    // 4. Emit CosmeticBurned event

    console.log(`Burning cosmetic token ${tokenId}: ${amount} units`);

    // Simulate burn
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true;
  } catch (error) {
    console.error('Failed to burn cosmetic NFT:', error);
    return false;
  }
};

/**
 * Mint crafted cosmetic NFT
 * Output of cosmetic crafting system
 */
export const mintCraftedCosmetic = async (
  playerAddress: string,
  cosmeticType: string,
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
): Promise<string | null> => {
  try {
    // In production:
    // 1. Call PlayerCard.mint() with cosmetic metadata
    // 2. Encode cosmetic type and rarity
    // 3. Use Paymaster for gasless transaction
    // 4. Return transaction hash

    const mockTxHash = `0x${Array(64)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('')}`;

    console.log(`Minted ${rarity} cosmetic: ${cosmeticType}`);

    return mockTxHash;
  } catch (error) {
    console.error('Failed to mint crafted cosmetic:', error);
    return null;
  }
};

// Type definitions
export interface NFTToken {
  id: string;
  name: string;
  tokenId: number;
  balance: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
  contractAddress: string;
}

export interface TeamNFT {
  tokenId: number;
  teamName: string;
  league: string;
  ownerAddress: string;
  soulBound: boolean;
  founded: Date;
  players: string[];
  image: string;
}

export interface CosmeticNFT {
  tokenId: number;
  type: 'jersey' | 'animation' | 'skill-effect' | 'celebration';
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
  balance: number;
}
