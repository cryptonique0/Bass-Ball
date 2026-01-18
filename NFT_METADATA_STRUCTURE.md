# NFT Metadata Structure

## Part 1: Metadata Standards & Schemas

### Overview

NFT metadata follows **ERC721 Metadata JSON Schema** standard, enabling OpenSea, Blur, and other marketplaces to display cards properly.

```typescript
// types/nft-metadata.ts

/**
 * ==================== PLAYER CARD METADATA ====================
 */

export interface PlayerCardAttribute {
  trait_type:
    | "Pace"
    | "Shooting"
    | "Passing"
    | "Defense"
    | "Dribbling"
    | "Physical"
    | "Rarity"
    | "Position"
    | "League"
    | "Team"
    | "CardType";
  value: string | number;
  max_value?: number;
}

export interface PlayerCardMetadata {
  name: string; // "Striker #21"
  description: string;
  image: string; // IPFS URL
  external_url?: string; // Link to player profile
  attributes: PlayerCardAttribute[];
  animation_url?: string; // Video/3D model
  properties?: {
    category?: string;
    creators?: Array<{ address: string; share: number }>;
  };
  // Bass Ball specific
  stats?: {
    pace: number;
    shooting: number;
    passing: number;
    defense: number;
    dribbling: number;
    physical: number;
  };
  position?: string;
  league?: string;
  nationality?: string;
  elo?: number;
  skill_moves?: string[];
  weak_foot?: "Left" | "Right";
  preferred_foot?: "Left" | "Right";
}

/**
 * ==================== TEAM NFT METADATA ====================
 */

export interface TeamNFTAttribute {
  trait_type:
    | "Division"
    | "Founded"
    | "Stadium"
    | "City"
    | "Wins"
    | "Losses"
    | "Rating"
    | "Members"
    | "Jersey_Primary"
    | "Jersey_Secondary"
    | "Logo_Hash";
  value: string | number;
  max_value?: number;
}

export interface TeamNFTMetadata {
  name: string; // "Lagos United FC"
  description: string;
  image: string; // IPFS URL (team logo)
  external_url?: string; // Team profile page
  attributes: TeamNFTAttribute[];
  background_color?: string; // Hex color for marketplace
  animation_url?: string; // Stadium tour or team video
  properties?: {
    category: "team";
    creators?: Array<{ address: string; share: number }>;
  };
  // Bass Ball specific
  stats?: {
    division: string;
    founded: number;
    stadium: string;
    wins: number;
    losses: number;
    rating: number;
    members: number;
  };
  colors?: {
    primary: string; // Hex: #FF0000
    secondary: string; // Hex: #FFFFFF
    accent?: string;
  };
  logo_uri?: string; // IPFS hash for team logo
  country?: string;
  city?: string;
  website?: string;
  social?: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
}

/**
 * ==================== CONSUMABLE CARD METADATA ====================
 */

export interface ConsumableCardMetadata {
  name: string; // "Speed Serum"
  description: string;
  image: string; // IPFS URL
  attributes: Array<{
    trait_type:
      | "Effect"
      | "Power"
      | "Duration"
      | "Cost"
      | "Rarity"
      | "Category";
    value: string | number;
  }>;
  effect: "STAMINA_RESTORE" | "SPEED_BOOST" | "PROTECTION";
  power: number;
  duration: number;
  consumable: true;
}

/**
 * ==================== BADGE METADATA ====================
 */

export interface BadgeMetadata {
  name: string; // "Hat Trick Master"
  description: string;
  image: string; // IPFS URL
  attributes: Array<{
    trait_type:
      | "Badge_Type"
      | "Rarity"
      | "Award_Date"
      | "Progress"
      | "Category";
    value: string | number;
  }>;
  badge_type:
    | "ACHIEVEMENT"
    | "MILESTONE"
    | "LEADERBOARD"
    | "SEASONAL"
    | "SOCIAL";
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  icon_url: string; // IPFS URL
  earned_date?: number; // Timestamp
}
```

---

## Part 2: Player Card Metadata Generator

```typescript
// services/metadata/player-card-metadata-service.ts

export interface PlayerCardData {
  cardId: string;
  name: string;
  position: string;
  nationality: string;
  pace: number;
  shooting: number;
  passing: number;
  defense: number;
  dribbling: number;
  physical: number;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  imageHash: string; // IPFS CID
  skillMoves?: string[];
  weakFoot?: "Left" | "Right";
  preferredFoot?: "Left" | "Right";
  elo?: number;
  league?: string;
}

export class PlayerCardMetadataService {
  /**
   * Generate metadata for player card
   */
  generateMetadata(
    card: PlayerCardData,
    contractAddress: string
  ): PlayerCardMetadata {
    const overallRating = this.calculateOverall(card);
    const rarity = this.rarityToString(card.rarity);

    return {
      name: card.name,
      description: this.generateDescription(card),
      image: `ipfs://${card.imageHash}`,
      external_url: `https://bassball.io/cards/${card.cardId}`,
      attributes: [
        {
          trait_type: "Pace",
          value: card.pace,
          max_value: 99,
        },
        {
          trait_type: "Shooting",
          value: card.shooting,
          max_value: 99,
        },
        {
          trait_type: "Passing",
          value: card.passing,
          max_value: 99,
        },
        {
          trait_type: "Defense",
          value: card.defense,
          max_value: 99,
        },
        {
          trait_type: "Dribbling",
          value: card.dribbling,
          max_value: 99,
        },
        {
          trait_type: "Physical",
          value: card.physical,
          max_value: 99,
        },
        {
          trait_type: "Rarity",
          value: rarity,
        },
        {
          trait_type: "Position",
          value: card.position,
        },
        {
          trait_type: "League",
          value: card.league || "Unknown",
        },
        {
          trait_type: "Nationality",
          value: card.nationality,
        },
        {
          trait_type: "Overall",
          value: overallRating,
          max_value: 99,
        },
        ...(card.elo ? [{ trait_type: "ELO", value: card.elo }] : []),
      ],
      stats: {
        pace: card.pace,
        shooting: card.shooting,
        passing: card.passing,
        defense: card.defense,
        dribbling: card.dribbling,
        physical: card.physical,
      },
      position: card.position,
      league: card.league,
      nationality: card.nationality,
      elo: card.elo,
      skill_moves: card.skillMoves,
      weak_foot: card.weakFoot,
      preferred_foot: card.preferredFoot,
    };
  }

  /**
   * Calculate overall rating (0-99)
   * Weighted average of stats
   */
  private calculateOverall(card: PlayerCardData): number {
    const weights = {
      pace: 0.1,
      shooting: 0.2,
      passing: 0.2,
      defense: 0.15,
      dribbling: 0.2,
      physical: 0.15,
    };

    const overall =
      card.pace * weights.pace +
      card.shooting * weights.shooting +
      card.passing * weights.passing +
      card.defense * weights.defense +
      card.dribbling * weights.dribbling +
      card.physical * weights.physical;

    return Math.round(overall);
  }

  /**
   * Generate human-readable description
   */
  private generateDescription(card: PlayerCardData): string {
    const rarity = this.rarityToString(card.rarity);
    const overall = this.calculateOverall(card);

    const descriptions: Record<string, string> = {
      GK: `${rarity} goalkeeper from ${card.nationality}. Known for quick reflexes.`,
      CB: `${rarity} center-back from ${card.nationality}. Strong defender with good positioning.`,
      LB: `${rarity} left-back from ${card.nationality}. Versatile defender with creative passing.`,
      RB: `${rarity} right-back from ${card.nationality}. Solid defender and key in attacks.`,
      CM: `${rarity} midfielder from ${card.nationality}. Controls the midfield with passing prowess.`,
      LM: `${rarity} left-midfielder from ${card.nationality}. Agile and technical on the wing.`,
      RM: `${rarity} right-midfielder from ${card.nationality}. Creative playmaker on the flank.`,
      ST: `${rarity} striker from ${card.nationality}. Clinical finisher in the box.`,
    };

    const baseDesc =
      descriptions[card.position] ||
      `${rarity} player from ${card.nationality}.`;

    return `${baseDesc} Overall Rating: ${overall}. ${card.skillMoves?.length || 0} skill moves. Preferred Foot: ${card.preferredFoot || "Either"}.`;
  }

  private rarityToString(
    rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY"
  ): string {
    const rarityMap: Record<string, string> = {
      COMMON: "Common",
      UNCOMMON: "Uncommon",
      RARE: "Rare",
      EPIC: "Epic",
      LEGENDARY: "Legendary",
    };
    return rarityMap[rarity] || "Unknown";
  }

  /**
   * Generate data URI (for on-chain metadata)
   */
  generateDataURI(metadata: PlayerCardMetadata): string {
    const json = JSON.stringify(metadata);
    const base64 = Buffer.from(json).toString("base64");
    return `data:application/json;base64,${base64}`;
  }
}
```

---

## Part 3: Team NFT Metadata Generator

```typescript
// services/metadata/team-nft-metadata-service.ts

export interface TeamNFTData {
  teamId: string;
  name: string;
  city: string;
  country: string;
  founded: number;
  stadium: string;
  division: string;
  wins: number;
  losses: number;
  rating: number;
  memberCount: number;
  logoHash: string; // IPFS CID
  primaryColor: string; // Hex
  secondaryColor: string; // Hex
  accentColor?: string; // Hex
  website?: string;
  twitter?: string;
  discord?: string;
}

export class TeamNFTMetadataService {
  /**
   * Generate team NFT metadata
   */
  generateMetadata(team: TeamNFTData): TeamNFTMetadata {
    const winRate = team.wins + team.losses > 0
      ? (team.wins / (team.wins + team.losses)) * 100
      : 0;

    return {
      name: team.name,
      description: this.generateDescription(team),
      image: `ipfs://${team.logoHash}`,
      external_url: `https://bassball.io/teams/${team.teamId}`,
      background_color: team.primaryColor,
      attributes: [
        {
          trait_type: "Division",
          value: team.division,
        },
        {
          trait_type: "Founded",
          value: team.founded,
        },
        {
          trait_type: "Stadium",
          value: team.stadium,
        },
        {
          trait_type: "City",
          value: team.city,
        },
        {
          trait_type: "Country",
          value: team.country,
        },
        {
          trait_type: "Wins",
          value: team.wins,
        },
        {
          trait_type: "Losses",
          value: team.losses,
        },
        {
          trait_type: "Rating",
          value: team.rating,
          max_value: 9999,
        },
        {
          trait_type: "Members",
          value: team.memberCount,
        },
        {
          trait_type: "Win_Rate",
          value: Math.round(winRate),
        },
      ],
      stats: {
        division: team.division,
        founded: team.founded,
        stadium: team.stadium,
        wins: team.wins,
        losses: team.losses,
        rating: team.rating,
        members: team.memberCount,
      },
      colors: {
        primary: team.primaryColor,
        secondary: team.secondaryColor,
        accent: team.accentColor,
      },
      logo_uri: `ipfs://${team.logoHash}`,
      country: team.country,
      city: team.city,
      website: team.website,
      social: {
        twitter: team.twitter,
        discord: team.discord,
        website: team.website,
      },
    };
  }

  /**
   * Generate team description
   */
  private generateDescription(team: TeamNFTData): string {
    const winRate = team.wins + team.losses > 0
      ? (team.wins / (team.wins + team.losses)) * 100
      : 0;

    return `Official team NFT for ${team.name}. Based in ${team.city}, ${team.country}. Playing in the ${team.division} division. Stadium: ${team.stadium}. Founded in ${team.founded}. Record: ${team.wins}W-${team.losses}L (${Math.round(winRate)}%). Rating: ${team.rating}. Members: ${team.memberCount}.`;
  }

  /**
   * Generate dynamic metadata URI (fetched from server)
   * Updates when team stats change
   */
  generateDynamicMetadataURI(
    teamId: string,
    baseUrl: string
  ): string {
    return `${baseUrl}/api/metadata/team/${teamId}`;
  }

  /**
   * Update metadata after match (server endpoint)
   */
  async updateTeamMetadata(
    teamId: string,
    updates: Partial<TeamNFTData>
  ): Promise<TeamNFTMetadata> {
    // Fetch current team data
    const team = await this.fetchTeamData(teamId);

    // Apply updates
    const updated = { ...team, ...updates };

    // Generate new metadata
    return this.generateMetadata(updated);
  }

  private async fetchTeamData(teamId: string): Promise<TeamNFTData> {
    // Would fetch from database
    return {} as TeamNFTData;
  }
}
```

---

## Part 4: Dynamic Metadata Updates

```typescript
// services/metadata/dynamic-metadata-service.ts

/**
 * Update NFT metadata after game events
 * Can update on-chain if metadata URI is contract address
 */
export class DynamicMetadataService {
  private playerService: PlayerCardMetadataService;
  private teamService: TeamNFTMetadataService;

  constructor(
    playerService: PlayerCardMetadataService,
    teamService: TeamNFTMetadataService
  ) {
    this.playerService = playerService;
    this.teamService = teamService;
  }

  /**
   * Update player card metadata after match
   */
  async updatePlayerCardMetadata(
    cardId: string,
    matchStats: {
      goalsScored: number;
      assists: number;
      tacklesWon: number;
      passesCompleted: number;
      rating: number;
    }
  ): Promise<void> {
    // Fetch card
    const card = await this.fetchCard(cardId);

    // Update ELO based on match performance
    const eloGain = this.calculateEloGain(matchStats.rating, card.elo || 1600);
    card.elo = (card.elo || 1600) + eloGain;

    // Update career stats
    await this.updateCardStats(cardId, matchStats);

    // Regenerate metadata
    const metadata = this.playerService.generateMetadata(card, "");

    // If using off-chain metadata, update IPFS
    await this.updateIPFSMetadata(cardId, metadata);

    // If using on-chain metadata, update contract
    // await contract.updateMetadata(cardId, metadata);
  }

  /**
   * Update team NFT metadata after match
   */
  async updateTeamMetadata(
    teamId: string,
    matchResult: {
      won: boolean;
      goalsFor: number;
      goalsAgainst: number;
      ratingChange: number;
    }
  ): Promise<void> {
    // Fetch team
    const team = await this.fetchTeamData(teamId);

    // Update record
    if (matchResult.won) {
      team.wins++;
    } else {
      team.losses++;
    }

    // Update rating
    team.rating += matchResult.ratingChange;

    // Regenerate metadata
    const metadata = this.teamService.generateMetadata(team);

    // Update IPFS or contract
    await this.updateIPFSMetadata(teamId, metadata);
  }

  /**
   * Calculate ELO gain based on performance
   * K-factor = 32, rating diff affects gain
   */
  private calculateEloGain(
    matchRating: number, // 0-100 player match rating
    currentElo: number
  ): number {
    // Higher match rating = more ELO gain
    const baseGain = (matchRating / 100) * 32;

    // Soft cap: diminishing returns above 2000
    if (currentElo > 2000) {
      return baseGain * 0.5;
    }
    if (currentElo > 1800) {
      return baseGain * 0.75;
    }

    return baseGain;
  }

  private async updateIPFSMetadata(
    id: string,
    metadata: any
  ): Promise<void> {
    // Upload to IPFS
    // Would use Pinata or Web3.Storage
    console.log(`Updated ${id} metadata on IPFS`);
  }

  private async fetchCard(cardId: string): Promise<PlayerCardData> {
    return {} as PlayerCardData;
  }

  private async fetchTeamData(teamId: string): Promise<TeamNFTData> {
    return {} as TeamNFTData;
  }

  private async updateCardStats(
    cardId: string,
    stats: any
  ): Promise<void> {
    // Update in database
  }
}
```

---

## Part 5: Metadata Validation

```typescript
// services/metadata/metadata-validator.ts

export class MetadataValidator {
  /**
   * Validate player card metadata
   */
  validatePlayerMetadata(metadata: PlayerCardMetadata): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push("name is required");
    }

    if (!metadata.image || !metadata.image.startsWith("ipfs://")) {
      errors.push("image must be IPFS URL");
    }

    if (!Array.isArray(metadata.attributes)) {
      errors.push("attributes must be array");
    }

    // Validate stats
    if (metadata.stats) {
      if (
        metadata.stats.pace < 0 ||
        metadata.stats.pace > 99
      ) {
        errors.push("pace must be 0-99");
      }
      if (
        metadata.stats.shooting < 0 ||
        metadata.stats.shooting > 99
      ) {
        errors.push("shooting must be 0-99");
      }
      // ... validate other stats
    }

    // Validate attributes
    for (const attr of metadata.attributes || []) {
      if (!attr.trait_type || !attr.value) {
        errors.push("each attribute must have trait_type and value");
      }

      // Check for reasonable values
      if (typeof attr.value === "number" && attr.max_value) {
        if (attr.value < 0 || attr.value > attr.max_value) {
          errors.push(
            `${attr.trait_type} value exceeds max_value`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate team NFT metadata
   */
  validateTeamMetadata(metadata: TeamNFTMetadata): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push("name is required");
    }

    if (!metadata.image || !metadata.image.startsWith("ipfs://")) {
      errors.push("image must be IPFS URL");
    }

    // Validate colors
    if (metadata.colors) {
      const colorRegex = /^#[0-9A-F]{6}$/i;
      if (!colorRegex.test(metadata.colors.primary)) {
        errors.push("primary color must be valid hex");
      }
      if (!colorRegex.test(metadata.colors.secondary)) {
        errors.push("secondary color must be valid hex");
      }
    }

    // Validate stats
    if (metadata.stats) {
      if (metadata.stats.wins < 0 || metadata.stats.losses < 0) {
        errors.push("wins and losses must be non-negative");
      }
      if (metadata.stats.rating < 0 || metadata.stats.rating > 9999) {
        errors.push("rating must be 0-9999");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate metadata size (gas limits)
   * On-chain metadata must be <24KB for Solidity string
   */
  validateMetadataSize(metadata: any, maxBytes: number = 24000): {
    valid: boolean;
    size: number;
  } {
    const json = JSON.stringify(metadata);
    const bytes = new TextEncoder().encode(json).length;

    return {
      valid: bytes <= maxBytes,
      size: bytes,
    };
  }
}
```

---

## Part 6: IPFS Metadata Storage

```typescript
// services/metadata/ipfs-metadata-storage.ts
import { Web3Storage } from "web3.storage";
import axios from "axios";

export class IPFSMetadataStorage {
  private web3Storage: Web3Storage;
  private pinataApiUrl = "https://api.pinata.cloud";
  private pinataKey: string;
  private pinataSecret: string;

  constructor(
    web3StorageToken: string,
    pinataKey: string,
    pinataSecret: string
  ) {
    this.web3Storage = new Web3Storage({ token: web3StorageToken });
    this.pinataKey = pinataKey;
    this.pinataSecret = pinataSecret;
  }

  /**
   * Store metadata on IPFS (Pinata)
   */
  async storeMetadataOnPinata(
    metadata: PlayerCardMetadata | TeamNFTMetadata,
    filename: string
  ): Promise<string> {
    // CID - Content Identifier
    const cid = await axios.post(
      `${this.pinataApiUrl}/pinning/pinJSONToIPFS`,
      metadata,
      {
        headers: {
          pinata_api_key: this.pinataKey,
          pinata_secret_api_key: this.pinataSecret,
        },
      }
    );

    return cid.data.IpfsHash; // Return IPFS hash
  }

  /**
   * Store metadata with Web3.Storage
   */
  async storeMetadataOnWeb3Storage(
    metadata: PlayerCardMetadata | TeamNFTMetadata,
    filename: string
  ): Promise<string> {
    const json = JSON.stringify(metadata);
    const file = new File([json], filename, { type: "application/json" });

    const cid = await this.web3Storage.put([file], {
      name: filename,
      wrapWithDirectory: false,
    });

    return cid;
  }

  /**
   * Retrieve metadata from IPFS
   */
  async retrieveMetadata(ipfsHash: string): Promise<any> {
    const url = `https://ipfs.io/ipfs/${ipfsHash}`;
    const response = await axios.get(url);
    return response.data;
  }

  /**
   * Update metadata on IPFS (creates new version)
   */
  async updateMetadata(
    metadata: PlayerCardMetadata | TeamNFTMetadata,
    filename: string
  ): Promise<string> {
    // IPFS is immutable, so we create a new file
    return this.storeMetadataOnPinata(metadata, filename);
  }

  /**
   * Pin to IPFS (ensure it stays available)
   */
  async pinMetadata(ipfsHash: string): Promise<void> {
    await axios.post(
      `${this.pinataApiUrl}/pinning/pinByHash`,
      {
        hashToPin: ipfsHash,
      },
      {
        headers: {
          pinata_api_key: this.pinataKey,
          pinata_secret_api_key: this.pinataSecret,
        },
      }
    );
  }

  /**
   * Unpin metadata (stop pinning)
   */
  async unpinMetadata(ipfsHash: string): Promise<void> {
    await axios.delete(
      `${this.pinataApiUrl}/pinning/unpin/${ipfsHash}`,
      {
        headers: {
          pinata_api_key: this.pinataKey,
          pinata_secret_api_key: this.pinataSecret,
        },
      }
    );
  }

  /**
   * Batch store multiple metadata files
   */
  async storeMetadataBatch(
    metadataList: Array<{
      metadata: PlayerCardMetadata | TeamNFTMetadata;
      filename: string;
    }>
  ): Promise<string[]> {
    const hashes: string[] = [];

    for (const { metadata, filename } of metadataList) {
      const hash = await this.storeMetadataOnPinata(metadata, filename);
      hashes.push(hash);
    }

    return hashes;
  }
}
```

---

## Part 7: Contract Metadata URI Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * ==================== ERC721 TEAM NFT ====================
 */
contract BassBallTeamNFT is ERC721 {
  using Strings for uint256;

  mapping(uint256 => string) public tokenMetadata;
  string private baseURI = "https://bassball.io/api/metadata/team/";

  constructor() ERC721("BassBallTeam", "BBALL") {}

  /**
   * Return metadata URI
   * Can point to:
   * 1. Off-chain: https://example.com/metadata/{tokenId}.json
   * 2. IPFS: ipfs://Qm...
   * 3. On-chain: data:application/json;base64,...
   */
  function tokenURI(uint256 tokenId)
    public
    view
    override
    returns (string memory)
  {
    require(_exists(tokenId), "Token does not exist");

    // If dynamic metadata stored on-chain
    if (bytes(tokenMetadata[tokenId]).length > 0) {
      return tokenMetadata[tokenId];
    }

    // Otherwise, return base URL
    return string.concat(baseURI, tokenId.toString());
  }

  /**
   * Set metadata URI (for dynamic updates)
   */
  function setTokenMetadata(uint256 tokenId, string memory metadata)
    public
    onlyOwner
  {
    tokenMetadata[tokenId] = metadata;
  }

  /**
   * Mint with on-chain metadata
   */
  function mintWithMetadata(
    address to,
    uint256 tokenId,
    string memory metadataUri
  ) public onlyOwner {
    _mint(to, tokenId);
    tokenMetadata[tokenId] = metadataUri;
  }
}

/**
 * ==================== ERC1155 PLAYER CARD ====================
 */
contract BassBallPlayerCard is ERC1155 {
  using Strings for uint256;

  mapping(uint256 => string) public cardMetadata;
  string private baseURI = "https://bassball.io/api/metadata/card/";

  constructor() ERC1155("") {}

  /**
   * Return metadata URI for card
   */
  function uri(uint256 tokenId)
    public
    view
    override
    returns (string memory)
  {
    if (bytes(cardMetadata[tokenId]).length > 0) {
      return cardMetadata[tokenId];
    }

    return string.concat(baseURI, tokenId.toString());
  }

  /**
   * Set card metadata
   */
  function setCardMetadata(uint256 cardId, string memory metadata)
    public
    onlyOwner
  {
    cardMetadata[cardId] = metadata;
  }

  /**
   * Mint card
   */
  function mintCard(
    address to,
    uint256 cardId,
    uint256 amount
  ) public onlyOwner {
    _mint(to, cardId, amount, "");
  }
}

/**
 * ==================== ON-CHAIN METADATA ====================
 * For metadata stored on-chain (not IPFS)
 */
contract BassBallOnChainMetadata {
  /**
   * Generate base64-encoded metadata JSON
   */
  function generateMetadataURI(
    string memory name,
    string memory description,
    string memory imageURI,
    bytes memory attributes
  ) public pure returns (string memory) {
    string memory json = string.concat(
      '{"name":"',
      name,
      '","description":"',
      description,
      '","image":"',
      imageURI,
      '","attributes":',
      string(attributes),
      "}"
    );

    bytes memory encoded = Base64.encode(bytes(json));
    return string.concat("data:application/json;base64,", encoded);
  }

  /**
   * Build attributes array JSON
   */
  function buildAttributes(
    string[] memory traitTypes,
    string[] memory values
  ) public pure returns (bytes memory) {
    require(traitTypes.length == values.length, "Length mismatch");

    bytes memory result = "[";

    for (uint256 i = 0; i < traitTypes.length; i++) {
      if (i > 0) result = bytes.concat(result, ",");

      result = bytes.concat(
        result,
        '{"trait_type":"',
        bytes(traitTypes[i]),
        '","value":"',
        bytes(values[i]),
        '"}'
      );
    }

    result = bytes.concat(result, "]");
    return result;
  }
}
```

---

## Part 8: Examples & Templates

```typescript
// examples/metadata-examples.ts

/**
 * Player Card Examples
 */

export const strikerCardExample: PlayerCardMetadata = {
  name: "Mohamed Salah",
  description:
    "Rare Egyptian striker. Clinical finisher with excellent pace and shooting. Overall Rating: 94.",
  image: "ipfs://QmXxxx...",
  external_url: "https://bassball.io/cards/card-0001",
  attributes: [
    { trait_type: "Pace", value: 92, max_value: 99 },
    { trait_type: "Shooting", value: 94, max_value: 99 },
    { trait_type: "Passing", value: 85, max_value: 99 },
    { trait_type: "Defense", value: 45, max_value: 99 },
    { trait_type: "Dribbling", value: 90, max_value: 99 },
    { trait_type: "Physical", value: 78, max_value: 99 },
    { trait_type: "Rarity", value: "Rare" },
    { trait_type: "Position", value: "ST" },
    { trait_type: "League", value: "Premier" },
    { trait_type: "Nationality", value: "Egypt" },
    { trait_type: "Overall", value: 94, max_value: 99 },
    { trait_type: "ELO", value: 2145 },
  ],
  stats: {
    pace: 92,
    shooting: 94,
    passing: 85,
    defense: 45,
    dribbling: 90,
    physical: 78,
  },
  position: "ST",
  league: "Premier",
  nationality: "Egypt",
  elo: 2145,
  skill_moves: ["5-star weak foot", "5-star skill moves"],
  weak_foot: "Right",
  preferred_foot: "Left",
};

/**
 * Team NFT Examples
 */

export const teamNFTExample: TeamNFTMetadata = {
  name: "Lagos United FC",
  description:
    "Official team NFT for Lagos United FC. Based in Lagos, Nigeria. Playing in the Gold division. Stadium: Base Arena. Founded in 2025. Record: 15W-3L (83%). Rating: 2485. Members: 45.",
  image: "ipfs://QmYyyy...",
  external_url: "https://bassball.io/teams/team-0001",
  background_color: "#FF0000",
  attributes: [
    { trait_type: "Division", value: "Gold" },
    { trait_type: "Founded", value: 2025 },
    { trait_type: "Stadium", value: "Base Arena" },
    { trait_type: "City", value: "Lagos" },
    { trait_type: "Country", value: "Nigeria" },
    { trait_type: "Wins", value: 15 },
    { trait_type: "Losses", value: 3 },
    { trait_type: "Rating", value: 2485, max_value: 9999 },
    { trait_type: "Members", value: 45 },
    { trait_type: "Win_Rate", value: 83 },
  ],
  stats: {
    division: "Gold",
    founded: 2025,
    stadium: "Base Arena",
    wins: 15,
    losses: 3,
    rating: 2485,
    members: 45,
  },
  colors: {
    primary: "#FF0000",
    secondary: "#FFFFFF",
    accent: "#FFD700",
  },
  logo_uri: "ipfs://QmZzzz...",
  country: "Nigeria",
  city: "Lagos",
  website: "https://lagosunited.io",
  social: {
    twitter: "@LagosUnited",
    discord: "https://discord.gg/lagosunited",
  },
};

/**
 * Consumable Card Example
 */

export const consumableCardExample: ConsumableCardMetadata = {
  name: "Speed Serum",
  description:
    "Uncommon consumable item. Increases player pace by 20% for 5 seconds.",
  image: "ipfs://QmConsumable...",
  attributes: [
    { trait_type: "Effect", value: "SPEED_BOOST" },
    { trait_type: "Power", value: 20 },
    { trait_type: "Duration", value: 300 },
    { trait_type: "Cost", value: 100 },
    { trait_type: "Rarity", value: "Uncommon" },
    { trait_type: "Category", value: "Consumable" },
  ],
  effect: "SPEED_BOOST",
  power: 20,
  duration: 300,
  consumable: true,
};

/**
 * Badge Example
 */

export const badgeExample: BadgeMetadata = {
  name: "Hat Trick Master",
  description:
    "Awarded for scoring 3 goals in a single match. Epic achievement.",
  image: "ipfs://QmBadge...",
  attributes: [
    { trait_type: "Badge_Type", value: "ACHIEVEMENT" },
    { trait_type: "Rarity", value: "EPIC" },
    { trait_type: "Category", value: "Scoring" },
    { trait_type: "Award_Date", value: 1705600000 },
  ],
  badge_type: "ACHIEVEMENT",
  rarity: "EPIC",
  icon_url: "ipfs://QmBadgeIcon...",
  earned_date: 1705600000,
};
```

---

## Part 9: Testing Metadata

```typescript
// test/metadata.test.ts
import { describe, it, expect } from "vitest";
import { PlayerCardMetadataService } from "../services/metadata/player-card-metadata-service";
import { TeamNFTMetadataService } from "../services/metadata/team-nft-metadata-service";
import { MetadataValidator } from "../services/metadata/metadata-validator";

describe("NFT Metadata", () => {
  let playerService: PlayerCardMetadataService;
  let teamService: TeamNFTMetadataService;
  let validator: MetadataValidator;

  beforeEach(() => {
    playerService = new PlayerCardMetadataService();
    teamService = new TeamNFTMetadataService();
    validator = new MetadataValidator();
  });

  describe("Player Card Metadata", () => {
    it("should generate valid player metadata", () => {
      const card = {
        cardId: "card-1",
        name: "Striker",
        position: "ST",
        nationality: "Egypt",
        pace: 92,
        shooting: 94,
        passing: 85,
        defense: 45,
        dribbling: 90,
        physical: 78,
        rarity: "RARE" as const,
        imageHash: "QmXxxx",
      };

      const metadata = playerService.generateMetadata(card, "");

      expect(metadata.name).toBe("Striker");
      expect(metadata.attributes).toHaveLength(11);
      expect(metadata.stats.pace).toBe(92);
    });

    it("should validate player metadata", () => {
      const metadata = {
        name: "Test Card",
        description: "Test",
        image: "ipfs://QmTest",
        attributes: [
          { trait_type: "Pace", value: 85, max_value: 99 },
        ],
        stats: {
          pace: 85,
          shooting: 80,
          passing: 75,
          defense: 70,
          dribbling: 80,
          physical: 75,
        },
      } as any;

      const validation = validator.validatePlayerMetadata(metadata);
      expect(validation.valid).toBe(true);
    });

    it("should calculate overall rating", () => {
      const card = {
        cardId: "card-1",
        name: "Test",
        position: "ST",
        nationality: "Test",
        pace: 100,
        shooting: 100,
        passing: 100,
        defense: 100,
        dribbling: 100,
        physical: 100,
        rarity: "LEGENDARY" as const,
        imageHash: "QmTest",
      };

      const metadata = playerService.generateMetadata(card, "");
      const overallAttr = metadata.attributes.find(
        (a) => a.trait_type === "Overall"
      );

      expect(overallAttr?.value).toBe(100);
    });
  });

  describe("Team NFT Metadata", () => {
    it("should generate valid team metadata", () => {
      const team = {
        teamId: "team-1",
        name: "Lagos United",
        city: "Lagos",
        country: "Nigeria",
        founded: 2025,
        stadium: "Base Arena",
        division: "Gold",
        wins: 15,
        losses: 3,
        rating: 2485,
        memberCount: 45,
        logoHash: "QmTeam",
        primaryColor: "#FF0000",
        secondaryColor: "#FFFFFF",
      };

      const metadata = teamService.generateMetadata(team);

      expect(metadata.name).toBe("Lagos United");
      expect(metadata.colors.primary).toBe("#FF0000");
      expect(metadata.stats.wins).toBe(15);
    });

    it("should validate team metadata", () => {
      const metadata = {
        name: "Test Team",
        description: "Test",
        image: "ipfs://QmTest",
        attributes: [],
        colors: {
          primary: "#FF0000",
          secondary: "#FFFFFF",
        },
        stats: {
          wins: 10,
          losses: 5,
          rating: 2000,
          members: 25,
          division: "Gold",
          founded: 2025,
          stadium: "Stadium",
        },
      } as any;

      const validation = validator.validateTeamMetadata(metadata);
      expect(validation.valid).toBe(true);
    });

    it("should reject invalid hex colors", () => {
      const metadata = {
        name: "Test",
        description: "Test",
        image: "ipfs://QmTest",
        attributes: [],
        colors: {
          primary: "RED", // Invalid
          secondary: "#FFFFFF",
        },
      } as any;

      const validation = validator.validateTeamMetadata(metadata);
      expect(validation.valid).toBe(false);
    });
  });

  describe("Metadata Size", () => {
    it("should validate metadata size", () => {
      const metadata = {
        name: "Test",
        description: "Test",
        image: "ipfs://QmTest",
        attributes: [],
      };

      const validation = validator.validateMetadataSize(metadata);
      expect(validation.valid).toBe(true);
      expect(validation.size).toBeGreaterThan(0);
    });
  });
});
```

---

## Summary

### Metadata Standards
✅ ERC721 Metadata JSON Schema
✅ Optional dynamic updates
✅ IPFS or on-chain storage
✅ Marketplace compatible (OpenSea, Blur)

### Key Fields

**Player Cards:**
- Attributes: Pace, Shooting, Passing, Defense, Dribbling, Physical, Rarity
- Stats: Numerical values 0-99
- Metadata: Position, League, Nationality, ELO

**Team NFTs:**
- Attributes: Division, Founded, Stadium, City, Wins, Losses, Rating
- Colors: Primary, Secondary, Accent (hex)
- Metadata: Website, Twitter, Discord

### Storage Options
✅ IPFS (Pinata/Web3.Storage) - recommended
✅ On-chain (data: URIs) - size limited
✅ Off-chain (API endpoint) - dynamic updates

### Updates
✅ Player cards: ELO changes, match stats
✅ Team NFTs: Win/loss record, rating
✅ Dynamic via new IPFS hashes or contract calls
