/**
 * NFT and blockchain utilities for player cards and token management
 */

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface PlayerNFT {
  tokenId: string;
  contractAddress: string;
  playerAddress: string;
  metadata: NFTMetadata;
  mintedAt: number;
  chainId: number;
}

export interface TokenBalance {
  token: string;
  balance: bigint;
  decimals: number;
  symbol: string;
}

export class NFTManager {
  private nfts: Map<string, PlayerNFT> = new Map();
  private chainId: number;

  constructor(chainId: number = 8453) { // Base mainnet
    this.chainId = chainId;
  }

  /**
   * Register player NFT
   */
  registerNFT(nft: PlayerNFT): void {
    this.nfts.set(nft.tokenId, { ...nft });
  }

  /**
   * Get NFT by token ID
   */
  getNFT(tokenId: string): PlayerNFT | undefined {
    return this.nfts.get(tokenId);
  }

  /**
   * Get all NFTs for a player
   */
  getPlayerNFTs(playerAddress: string): PlayerNFT[] {
    return Array.from(this.nfts.values()).filter(
      (nft) => nft.playerAddress === playerAddress
    );
  }

  /**
   * Generate NFT metadata from player stats
   */
  generateMetadata(
    playerName: string,
    stats: Record<string, any>
  ): NFTMetadata {
    const attributes = Object.entries(stats).map(([key, value]) => ({
      trait_type: key,
      value: typeof value === 'number' ? value.toFixed(2) : String(value),
    }));

    return {
      name: playerName,
      description: `Bass-Ball Player Card - ${playerName}`,
      image: `https://ipfs.io/ipfs/QmXXXX.../${playerName}`,
      attributes,
    };
  }

  /**
   * Create token mint transaction data
   */
  createMintTransaction(
    to: string,
    metadata: NFTMetadata
  ): {
    to: string;
    data: string;
    value: string;
  } {
    // This is a placeholder - actual implementation would call smart contract
    return {
      to: '0x0000000000000000000000000000000000000000',
      data: '0x',
      value: '0',
    };
  }

  /**
   * Calculate NFT rarity score
   */
  calculateRarityScore(attributes: NFTMetadata['attributes']): number {
    let score = 0;

    attributes.forEach(({ trait_type, value }) => {
      // Base scoring on trait type and value
      if (trait_type === 'Overall Rating' && typeof value === 'string') {
        score += parseFloat(value) * 10;
      } else if (trait_type === 'Position') {
        const positionScores: Record<string, number> = {
          GK: 50,
          CB: 60,
          RB: 55,
          LB: 55,
          CDM: 70,
          CM: 75,
          CAM: 80,
          ST: 85,
          CF: 85,
          LW: 80,
          RW: 80,
        };
        score += positionScores[String(value)] || 50;
      }
    });

    return Math.round(score);
  }

  /**
   * Get collection statistics
   */
  getCollectionStats() {
    const nftArray = Array.from(this.nfts.values());

    return {
      totalNFTs: nftArray.length,
      uniquePlayers: new Set(nftArray.map((n) => n.playerAddress)).size,
      averageRarity: nftArray.reduce((sum, nft) => {
        return sum + this.calculateRarityScore(nft.metadata.attributes);
      }, 0) / Math.max(nftArray.length, 1),
      chainId: this.chainId,
    };
  }

  /**
   * Verify NFT ownership
   */
  verifyOwnership(tokenId: string, playerAddress: string): boolean {
    const nft = this.getNFT(tokenId);
    return nft?.playerAddress === playerAddress;
  }

  /**
   * Transfer NFT (updates player address)
   */
  transferNFT(tokenId: string, newOwner: string): boolean {
    const nft = this.nfts.get(tokenId);
    if (!nft) return false;

    nft.playerAddress = newOwner;
    return true;
  }

  /**
   * Burn NFT
   */
  burnNFT(tokenId: string): boolean {
    return this.nfts.delete(tokenId);
  }

  /**
   * Export collection
   */
  export() {
    return Array.from(this.nfts.values());
  }
}
