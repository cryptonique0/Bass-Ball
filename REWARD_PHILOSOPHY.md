# Reward Philosophy (Pay-to-Skill, Not Pay-to-Win)

## Part 1: Core Principle

### The Fundamental Rule

```
TOKENS UNLOCK ACCESS, NOT POWER

Token = Gate, not Advantage
Token = Choice, not Dominance
Token = Cosmetics, not Stats
```

### Why This Matters

```
Pay-to-Win Problem:
  User A (no money) vs User B ($100 spent)
  → User B ALWAYS wins due to stats
  → Game is broken
  
Bass Ball Model:
  User A (no money) vs User B ($100 spent)
  → If User A is skilled, User A wins
  → If User B is skilled, User B wins
  → Money affects experience, not outcome
```

### Economics Philosophy

```
Revenue Model (NOT Pay-to-Win):
  ✓ Entry fees (ranked tournaments)
  ✓ Cosmetic NFTs (skins, jerseys, animations)
  ✓ Governance tokens (voting rights)
  ✓ Marketplace fees (buying/selling cards)
  ✓ Sponsorship (in-game ads, team partnerships)

Forbidden Model (Pay-to-Win):
  ✗ Stat boosts for cash
  ✗ Player power levels tied to spending
  ✗ RNG manipulation with tokens
  ✗ AI difficulty reduction with money
  ✗ Stamina potions or recovery tokens
```

---

## Part 2: Where Tokens ARE Used

### 1. Entry Fees (Skill Filter)

```typescript
// tournaments/tournament-entry.ts

export interface TournamentEntry {
  tournamentId: string;
  entryFeeToken: bigint; // In wei
  entryFeeUSDC?: bigint; // Alternative stable coin
  skillRating: number; // Min rating required
  prizePool: bigint; // Sum of all entry fees
  format: "single_elimination" | "round_robin" | "league";
}

export class TournamentGatekeeping {
  /**
   * Entry fee creates SKILL FILTER, not POWER FILTER
   *
   * Purpose:
   *   - Prevent casual smurf accounts
   *   - Fund prize pool fairly
   *   - Create competitive brackets
   *
   * NOT for stat boosts or power advantages
   */

  async createRankedTournament(params: {
    name: string;
    entryFee: bigint; // e.g., 10 USDC
    minSkillRating: number; // e.g., 1000 rating
    maxParticipants: number;
    durationDays: number;
  }): Promise<TournamentId> {
    // Validate fee is reasonable (not too high)
    if (params.entryFee > parseUnits("1000", 6)) {
      throw new Error("Entry fee exceeds maximum (too expensive)");
    }

    // Create tournament
    // Collect fees into prize pool (no middleman fees)
    // Prize = 100% of collected fees distributed back

    return `tournament-${Date.now()}`;
  }

  /**
   * Validate that fee doesn't confer gameplay advantage
   */
  async validateEntryFeeIntegrity(tournamentId: string): Promise<{
    hasAdvantage: boolean;
    reason?: string;
  }> {
    const tournament = await this.getTournament(tournamentId);

    // Check that higher fee doesn't mean:
    // - Better player pool (it should)
    // - Better stats (it shouldn't)
    // - RNG favoritism (it shouldn't)
    // - AI difficulty reduction (it shouldn't)

    // Only check: does tournament have skill rating requirement?
    // If yes, entry fee is valid skill filter
    // If no, entry fee is suspicious

    return {
      hasAdvantage: false,
      reason: "Entry fee only funds prize pool",
    };
  }
}

// Example: Ranked tournament entry structure
export const RankedTournamentTiers = {
  BRONZE: {
    entryFee: parseUnits("1", 6), // 1 USDC
    minRating: 0,
    maxRating: 800,
    prizeMultiplier: 1.0,
  },
  SILVER: {
    entryFee: parseUnits("5", 6), // 5 USDC
    minRating: 800,
    maxRating: 1200,
    prizeMultiplier: 1.0,
  },
  GOLD: {
    entryFee: parseUnits("10", 6), // 10 USDC
    minRating: 1200,
    maxRating: 1600,
    prizeMultiplier: 1.0,
  },
  DIAMOND: {
    entryFee: parseUnits("25", 6), // 25 USDC
    minRating: 1600,
    maxRating: Infinity,
    prizeMultiplier: 1.0,
  },
};

// Key: Fee increases with skill rating
// Fee is gate to prevent smurfs
// Fee is NOT advantage
```

### 2. Cosmetic NFTs (Visual Only)

```typescript
// cosmetics/cosmetic-nft-system.ts

export enum CosmeticType {
  JERSEY = "jersey",
  STADIUM_SKIN = "stadium_skin",
  PLAYER_ANIMATION = "player_animation",
  BALL_SKIN = "ball_skin",
  CELEBRATION = "celebration",
  BANNER = "banner",
  BADGE = "badge",
  NAMEPLATE = "nameplate",
}

export interface CosmeticNFT {
  id: string;
  type: CosmeticType;
  name: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  imageUri: string;
  animationUri?: string;
  metadata: {
    colors?: string[];
    designer?: string;
    releaseDate: number;
    isLimited?: boolean;
    maxSupply?: number;
  };

  // CRITICAL: No gameplay properties
  stats?: never;
  boosts?: never;
  passiveAbilities?: never;
  rngModifiers?: never;
}

export class CosmeticNFTSystem {
  /**
   * Create cosmetic NFT
   * ONLY visual, NEVER gameplay
   */
  async mintCosmeticNFT(cosmetic: CosmeticNFT): Promise<string> {
    // Validate: no gameplay properties
    this.validateNoGameplayProperties(cosmetic);

    // Validate: visual only
    this.validateVisualOnly(cosmetic);

    // Mint as ERC-1155
    const tokenId = await this.cosmeticContract.mint(
      cosmetic.type,
      cosmetic.metadata
    );

    return tokenId;
  }

  /**
   * Apply cosmetic to team
   * Pure visual customization
   */
  async applyCosmetic(
    teamId: string,
    cosmeticId: string
  ): Promise<{
    teamId: string;
    cosmetics: CosmeticNFT[];
    visualHash: string; // For rendering
  }> {
    const cosmetic = await this.getCosmeticNFT(cosmeticId);

    // Validate: doesn't affect gameplay
    if (this.affectsGameplay(cosmetic)) {
      throw new Error("Cosmetic affects gameplay - forbidden");
    }

    // Apply only to rendering layer
    const visualUpdate = await this.renderingService.updateTeamVisuals(
      teamId,
      cosmetic
    );

    // Game engine receives NO information about cosmetic
    // Engine only knows: team stats, player positions, ball physics
    // Engine does NOT know: jersey color, celebration animation

    return {
      teamId,
      cosmetics: await this.getTeamCosmetics(teamId),
      visualHash: visualUpdate.hash,
    };
  }

  private validateNoGameplayProperties(cosmetic: any): void {
    const forbiddenFields = [
      "stats",
      "boosts",
      "passiveAbilities",
      "rngModifiers",
      "stamina",
      "speed",
      "accuracy",
      "strength",
      "dribble",
      "defense",
    ];

    for (const field of forbiddenFields) {
      if (field in cosmetic && cosmetic[field] !== undefined) {
        throw new Error(
          `Cosmetic cannot have gameplay property: ${field}`
        );
      }
    }
  }

  private validateVisualOnly(cosmetic: CosmeticNFT): void {
    // Must have visual representation
    if (!cosmetic.imageUri && !cosmetic.animationUri) {
      throw new Error("Cosmetic must have visual representation");
    }

    // Type must be cosmetic-only
    const allowedTypes = Object.values(CosmeticType);
    if (!allowedTypes.includes(cosmetic.type)) {
      throw new Error(`Invalid cosmetic type: ${cosmetic.type}`);
    }
  }

  private affectsGameplay(cosmetic: CosmeticNFT): boolean {
    // If cosmetic is somehow used in game engine, it's forbidden
    // This is a safety check
    return false; // Should always be true (safe)
  }
}

// Example cosmetic NFTs that are ALLOWED
export const AllowedCosmetics = {
  "Jersey-ManUnited-Red": {
    type: CosmeticType.JERSEY,
    colors: ["#DA291C", "#FFF"],
    region: "chest",
    description: "Classic Manchester United red jersey",
  },

  "Stadium-Emirates": {
    type: CosmeticType.STADIUM_SKIN,
    name: "Emirates Stadium",
    description: "Play in iconic Arsenal stadium",
    imageUri: "ipfs://QmXXX",
  },

  "Celebration-Backflip": {
    type: CosmeticType.CELEBRATION,
    animation: "backflip.glb",
    description: "Victory backflip animation",
  },

  "Nameplate-Gold": {
    type: CosmeticType.NAMEPLATE,
    colors: ["#FFD700"],
    description: "Gold nameplate for leaderboard display",
  },
};

// Example cosmetics that are FORBIDDEN
export const ForbiddenCosmetics = {
  "SpeedBoost-Jersey": {
    type: CosmeticType.JERSEY,
    speedBoost: 1.1, // ❌ FORBIDDEN: affects gameplay
  },

  "AccuracyBall": {
    type: CosmeticType.BALL_SKIN,
    accuracyBoost: 0.95, // ❌ FORBIDDEN: affects gameplay
  },

  "StaminaRecovery": {
    type: CosmeticType.JERSEY,
    staminaRegenBoost: 1.5, // ❌ FORBIDDEN: affects gameplay
  },

  "LuckyAnimation": {
    type: CosmeticType.CELEBRATION,
    rngModifier: 0.9, // ❌ FORBIDDEN: affects RNG
  },
};
```

### 3. Governance (Voting Rights)

```typescript
// governance/governance-system.ts

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  category: "ENGINE_CHANGE" | "RULE_CHANGE" | "LEAGUE_CREATION" | "FEE_CHANGE";
  proposedChange: {
    type: string;
    oldValue: any;
    newValue: any;
  };
  votingPeriod: {
    startBlock: number;
    endBlock: number;
    totalVotes: number;
    votesFor: number;
    votesAgainst: number;
  };
  status: "pending" | "voting" | "passed" | "rejected" | "executed";
}

export class GovernanceSystem {
  /**
   * Governance is PURELY DEMOCRATIC
   *
   * NOT ALLOWED:
   * - Pay more, vote more (1 token = 1 vote)
   * - Buy voting power (tokens are not voting shares)
   * - Whales controlling updates
   *
   * ALLOWED:
   * - 1 player = 1 vote (if they hold governance token)
   * - Votes are transparent
   * - Changes require majority consensus
   */

  async createProposal(params: {
    title: string;
    description: string;
    category: string;
    proposedChange: {
      field: string;
      oldValue: any;
      newValue: any;
    };
    votingPeriodDays: number;
  }): Promise<string> {
    // Anyone with governance token can propose
    // Cost: 10 tokens (prevents spam)
    // But 1 token = 1 vote power (not 10x voting)

    const proposal: GovernanceProposal = {
      id: `proposal-${Date.now()}`,
      title: params.title,
      description: params.description,
      category: params.category as any,
      proposedChange: params.proposedChange,
      votingPeriod: {
        startBlock: await this.getLatestBlock(),
        endBlock: await this.getLatestBlock() + params.votingPeriodDays * 6500, // ~13s blocks
        totalVotes: 0,
        votesFor: 0,
        votesAgainst: 0,
      },
      status: "pending",
    };

    return proposal.id;
  }

  /**
   * Cast vote
   * 1 player = 1 vote (ALWAYS)
   * Voting power cannot be delegated or amplified
   */
  async vote(
    proposalId: string,
    playerAddress: string,
    decision: "for" | "against"
  ): Promise<void> {
    const proposal = await this.getProposal(proposalId);
    const hasVoted = await this.checkAlreadyVoted(proposalId, playerAddress);

    if (hasVoted) {
      throw new Error("Already voted on this proposal");
    }

    // Check: player has governance token (at least 1)
    const governanceTokenBalance = await this.getGovernanceTokenBalance(
      playerAddress
    );

    if (governanceTokenBalance < BigInt(1)) {
      throw new Error("Insufficient governance tokens to vote");
    }

    // Apply vote: always counts as 1 vote
    // Not 1 vote per token
    // Not votes = tokens held
    if (decision === "for") {
      proposal.votingPeriod.votesFor += 1;
    } else {
      proposal.votingPeriod.votesAgainst += 1;
    }

    proposal.votingPeriod.totalVotes += 1;

    await this.recordVote(proposalId, playerAddress, decision);
  }

  /**
   * Examples of governance proposals
   */
  async exampleProposals(): Promise<GovernanceProposal[]> {
    return [
      {
        id: "prop-1",
        title: "Create Premier League Season 2",
        description:
          "Launch Premier League Season 2 with 32 teams, new sponsorships",
        category: "LEAGUE_CREATION",
        proposedChange: {
          type: "ADD_LEAGUE",
          oldValue: null,
          newValue: { league: "Premier League S2", teams: 32 },
        },
        votingPeriod: {
          startBlock: 0,
          endBlock: 100000,
          totalVotes: 5000,
          votesFor: 4200, // 84% approval
          votesAgainst: 800,
        },
        status: "passed",
      },

      {
        id: "prop-2",
        title: "Increase stamina regen by 5%",
        description:
          "Make matches less tiring, reward aggressive play more",
        category: "ENGINE_CHANGE",
        proposedChange: {
          type: "MODIFY_ENGINE_PARAM",
          oldValue: 0.1,
          newValue: 0.105,
        },
        votingPeriod: {
          startBlock: 100000,
          endBlock: 200000,
          totalVotes: 4500,
          votesFor: 2250, // 50% - TIED
          votesAgainst: 2250,
        },
        status: "rejected", // Requires 50% + 1
      },

      {
        id: "prop-3",
        title: "Reduce entry fee from 10 to 5 USDC",
        description: "Make tournaments more accessible",
        category: "FEE_CHANGE",
        proposedChange: {
          type: "MODIFY_FEE",
          oldValue: parseUnits("10", 6),
          newValue: parseUnits("5", 6),
        },
        votingPeriod: {
          startBlock: 200000,
          endBlock: 300000,
          totalVotes: 5500,
          votesFor: 5000, // 91% approval
          votesAgainst: 500,
        },
        status: "passed",
      },
    ];
  }

  /**
   * Examples of FORBIDDEN governance
   */
  async forbiddenGovernanceApproaches(): Promise<any> {
    return {
      "Token-Weighted Voting": {
        description:
          "1 token = 1 vote power (FORBIDDEN: whales control)",
        example:
          "User with 1M tokens gets 1M votes (unfair concentration)",
        why_forbidden: "Breaks democratic principle",
      },

      "Delegated Voting": {
        description:
          "Token holders delegate votes to others (FORBIDDEN: vote concentration)",
        example:
          "Small holder gives votes to whale, whale controls more",
        why_forbidden: "Enables corruption and coordination",
      },

      "Buyable Governance": {
        description:
          "Buy voting power directly (FORBIDDEN: money = control)",
        example: "Pay 1000 USDC to get 1000 votes",
        why_forbidden:
          "Governance should be about community consensus, not spending power",
      },

      "Proposal Fee": {
        description:
          "High fee to make proposals (FORBIDDEN: silences poor players)",
        example: "100 token cost to propose = only whales can propose",
        why_forbidden: "Prevents democratic participation",
      },
    };
  }
}
```

### 4. NFT Crafting (Cosmetic Only)

```typescript
// crafting/cosmetic-crafting-system.ts

export interface CraftingRecipe {
  recipeId: string;
  inputCards: {
    cardId: string;
    quantity: number;
    rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  }[];
  outputCosmetic: CosmeticNFT;
  craftingTime: number; // seconds
  burnInputCards: boolean; // Destroy input cards?
}

export class CosmeticCraftingSystem {
  /**
   * Crafting system for COSMETICS ONLY
   *
   * ALLOWED:
   * - Combine 3 common player cards → 1 uncommon cosmetic
   * - Mix 5 emote cards → 1 celebration animation
   * - Burn duplicate jerseys → create custom design
   *
   * FORBIDDEN:
   * - Combine 5 cards → 1 star player with +10% speed
   * - Craft stamina potions
   * - Create stat-boosting items
   * - Generate power-ups
   */

  async createCraftingRecipe(recipe: CraftingRecipe): Promise<string> {
    // Validate: output is ONLY cosmetic
    if (!this.isCosmetic(recipe.outputCosmetic)) {
      throw new Error("Crafting output must be cosmetic only");
    }

    // Validate: output has no gameplay properties
    if (this.hasGameplayProperties(recipe.outputCosmetic)) {
      throw new Error("Cannot craft items with gameplay properties");
    }

    return recipe.recipeId;
  }

  /**
   * Example cosmetic crafting recipes (ALLOWED)
   */
  async exampleAllowedRecipes(): Promise<CraftingRecipe[]> {
    return [
      {
        recipeId: "craft-jersey-gold",
        inputCards: [
          { cardId: "card-striker-1", quantity: 3, rarity: "common" },
          { cardId: "card-gold-1", quantity: 1, rarity: "rare" },
        ],
        outputCosmetic: {
          id: "cosmetic-jersey-gold-custom",
          type: CosmeticType.JERSEY,
          name: "Gold Custom Jersey",
          description: "Crafted from 3 striker cards",
          rarity: "rare",
          imageUri: "ipfs://QmGoldJersey",
          metadata: { colors: ["#FFD700", "#000"] },
        },
        craftingTime: 3600, // 1 hour
        burnInputCards: true, // Cards are consumed
      },

      {
        recipeId: "craft-celebration-combo",
        inputCards: [
          { cardId: "card-celebration-1", quantity: 5 },
        ],
        outputCosmetic: {
          id: "cosmetic-celebration-fusion",
          type: CosmeticType.CELEBRATION,
          name: "Fusion Celebration",
          description: "5 celebration cards combined",
          rarity: "epic",
          imageUri: "ipfs://QmCelebration",
          animationUri: "ipfs://QmAnim",
          metadata: {},
        },
        craftingTime: 7200, // 2 hours
        burnInputCards: true,
      },
    ];
  }

  /**
   * Example FORBIDDEN crafting (NOT ALLOWED)
   */
  async exampleForbiddenRecipes(): Promise<any> {
    return [
      {
        recipeId: "FORBIDDEN-craft-stat-boost",
        description: "Combine cards to get stat boost",
        inputs: [
          { cardId: "card-striker-1", quantity: 5 },
        ],
        output: {
          name: "Speed Boost Potion",
          effect: "Player speed +20%",
          duration: 3600, // ❌ FORBIDDEN
        },
        why_forbidden: "Affects gameplay",
      },

      {
        recipeId: "FORBIDDEN-craft-stamina-recovery",
        description: "Create stamina potion from cards",
        inputs: [
          { cardId: "card-midfielder-1", quantity: 3 },
        ],
        output: {
          name: "Stamina Recovery",
          effect: "Restore 50% stamina",
          // ❌ FORBIDDEN: gameplay advantage
        },
        why_forbidden: "Gives gameplay advantage",
      },

      {
        recipeId: "FORBIDDEN-craft-luck-charm",
        description: "Combine rare cards for luck boost",
        inputs: [
          { cardId: "card-legendary-1", quantity: 1 },
        ],
        output: {
          name: "Lucky Charm",
          effect: "Increase shot accuracy by 15%",
          // ❌ FORBIDDEN: manipulates gameplay RNG
        },
        why_forbidden: "Modifies game engine probabilities",
      },
    ];
  }

  private isCosmetic(item: any): boolean {
    return Object.values(CosmeticType).includes(item.type);
  }

  private hasGameplayProperties(item: any): boolean {
    const gameplayProps = [
      "stats",
      "speedBoost",
      "accuracyBoost",
      "staminaBoost",
      "strengthBoost",
      "defenseBoost",
      "rngModifier",
      "effectDuration",
    ];

    for (const prop of gameplayProps) {
      if (prop in item && item[prop] !== undefined) {
        return true;
      }
    }

    return false;
  }
}
```

---

## Part 3: Where Tokens Are NOT Used

### Forbidden: Player Stats

```typescript
// engine/player-stat-validation.ts

export interface PlayerStats {
  pace: number; // 50-99
  shooting: number;
  passing: number;
  defense: number;
  dribbling: number;
  physical: number;
  overall: number; // Weighted average
}

export class PlayerStatValidator {
  /**
   * CRITICAL: Player stats NEVER depend on:
   * - Token balance
   * - Token spent
   * - Cosmetics owned
   * - Entry fee paid
   */

  async validatePlayerStats(
    playerId: string,
    stats: PlayerStats
  ): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check: stats not influenced by tokens
    const playerTokenBalance = await this.getPlayerTokenBalance(playerId);
    const statsBasedOnTokens = this.checkForTokenInfluence(
      stats,
      playerTokenBalance
    );

    if (statsBasedOnTokens) {
      issues.push(
        "Stats appear to be influenced by token balance (FORBIDDEN)"
      );
    }

    // Check: stats not influenced by spending history
    const playerSpending = await this.getPlayerSpendingHistory(playerId);
    const statsBasedOnSpending = this.checkForSpendingInfluence(
      stats,
      playerSpending
    );

    if (statsBasedOnSpending) {
      issues.push(
        "Stats appear to be influenced by spending (FORBIDDEN)"
      );
    }

    // Check: stats not influenced by cosmetics
    const playerCosmetics = await this.getPlayerCosmetics(playerId);
    const statsBasedOnCosmetics = this.checkForCosmeticInfluence(
      stats,
      playerCosmetics
    );

    if (statsBasedOnCosmetics) {
      issues.push(
        "Stats appear to be influenced by cosmetics (FORBIDDEN)"
      );
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Stats should be DETERMINED BY:
   * - Player card rarity (for initial team)
   * - Player skill rating (from match history)
   * - Age and experience (from blockchain data)
   *
   * Stats should NEVER be determined by:
   * - Token balance
   * - NFT cosmetics
   * - Entry fee paid
   */

  private checkForTokenInfluence(
    stats: PlayerStats,
    tokenBalance: bigint
  ): boolean {
    // If stats correlate perfectly with token balance, it's suspicious
    // This would be: rich players = always have higher stats
    // That's pay-to-win

    // In a fair system, stats are independent of tokens
    return false; // Safety: assume fair until proven otherwise
  }

  private checkForSpendingInfluence(
    stats: PlayerStats,
    spending: any
  ): boolean {
    // Check if stats are boosted based on cumulative spending
    // This would be fraud
    return false;
  }

  private checkForCosmeticInfluence(
    stats: PlayerStats,
    cosmetics: any[]
  ): boolean {
    // Cosmetics should have 0 influence on stats
    // If wearing gold jersey gives +5 pace, that's pay-to-win
    return false;
  }
}

// Example: Player card stats (determined by RARITY + BLOCKCHAIN DATA ONLY)
export const PlayerCardStatsExample = {
  playerId: "striker-001",
  name: "Marcus Rashford",
  team: "Manchester United",
  rarity: "rare", // Determines base stats

  // These are set at card creation, based on rarity
  stats: {
    pace: 87, // Rare card = higher pace
    shooting: 86,
    passing: 75,
    defense: 45,
    dribbling: 84,
    physical: 79,
    overall: 78,
  },

  // These are updated from blockchain match history
  blockchainderivedStats: {
    wins: 45,
    matches: 100,
    winRate: 0.45,
    eloRating: 1350,
    lastUpdateBlock: 19402831,
  },

  // Token balance does NOT affect these values
  tokenBalance: parseUnits("1000", 18), // Irrelevant
  hasPremiumCosmetics: true, // Irrelevant
  entryFeePaid: parseUnits("25", 6), // Irrelevant
};
```

### Forbidden: Match RNG

```typescript
// engine/rng-validation.ts

export class RNGValidator {
  /**
   * CRITICAL: RNG NEVER depends on:
   * - Token balance
   * - Cosmetics owned
   * - Entry fee paid
   * - Player wealth
   */

  async validateMatchRNG(
    matchId: string,
    seed: string,
    playerATokenBalance: bigint,
    playerBTokenBalance: bigint
  ): Promise<{
    fair: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // RNG seed should only depend on: blockhash
    // NOT on player token balance
    if (this.rngDependsOnTokens(seed, playerATokenBalance)) {
      issues.push(
        "RNG appears to depend on Player A token balance (FORBIDDEN)"
      );
    }

    if (this.rngDependsOnTokens(seed, playerBTokenBalance)) {
      issues.push(
        "RNG appears to depend on Player B token balance (FORBIDDEN)"
      );
    }

    return {
      fair: issues.length === 0,
      issues,
    };
  }

  /**
   * Allowed RNG sources:
   * ✓ blockhash(blockNumber)
   * ✓ Chainlink VRF
   * ✓ Transaction hash
   * ✓ Timestamp
   *
   * Forbidden RNG sources:
   * ✗ Player token balance
   * ✗ Player spending history
   * ✗ Cosmetics owned
   * ✗ Skill rating
   * ✗ Team owner
   */

  private rngDependsOnTokens(seed: string, tokenBalance: bigint): boolean {
    // If seed includes player tokens in calculation, that's fraud
    // Example of fraud: seed = keccak256(blockhash + playerTokenBalance)
    // Then rich players get "luckier" RNG

    // In fair system: seed is independent of player wealth
    return false; // Safety assumption
  }

  /**
   * Example: Fair RNG generation
   */
  async generateFairSeed(blockNumber: number): Promise<string> {
    // Get blockhash from Base blockchain
    // This is immutable and player-independent
    const blockhash = await this.publicClient.getBlock({
      blockNumber: BigInt(blockNumber),
    });

    // Seed is ONLY the blockhash
    // No player data mixed in
    return blockhash.hash!;
  }

  /**
   * Example: Unfair RNG generation (FORBIDDEN)
   */
  async generateUnfairSeed(
    blockNumber: number,
    playerTokenBalance: bigint
  ): Promise<string> {
    const blockhash = await this.publicClient.getBlock({
      blockNumber: BigInt(blockNumber),
    });

    // ❌ FORBIDDEN: Mixing player token balance into seed
    // This makes rich players "luckier"
    const unfairSeed = keccak256(
      toUtf8Bytes(blockhash.hash + playerTokenBalance.toString())
    );

    // This would be provable fraud if caught
    return unfairSeed;
  }
}
```

### Forbidden: AI Difficulty

```typescript
// engine/ai-difficulty-validation.ts

export class AIDifficultyValidator {
  /**
   * CRITICAL: AI difficulty NEVER depends on:
   * - Token balance
   * - Cosmetics owned
   * - Entry fee paid
   * - Player skill rating
   * - Player achievements
   *
   * AI difficulty is ONLY determined by:
   * - Explicitly chosen difficulty level
   * - Random selection
   */

  async validateAIDifficulty(
    matchId: string,
    aiDifficulty: "easy" | "medium" | "hard",
    playerTokenBalance: bigint
  ): Promise<{
    fair: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check: difficulty doesn't scale with spending
    if (this.difficultyScalesWithSpending(aiDifficulty, playerTokenBalance)) {
      issues.push(
        "AI difficulty appears to scale with token balance (FORBIDDEN)"
      );
    }

    // Check: player can't buy easier AI
    if (playerTokenBalance > parseUnits("1000", 18)) {
      // Rich player
      const richPlayerEasy = this.getAIDifficultyForPlayer(
        playerTokenBalance
      );

      if (richPlayerEasy === "easy") {
        issues.push(
          "Rich players appear to face easier AI (pay-to-win advantage)"
        );
      }
    }

    return {
      fair: issues.length === 0,
      issues,
    };
  }

  /**
   * Examples of FORBIDDEN AI difficulty scaling
   */
  async forbiddenDifficultyScaling(): Promise<any> {
    return {
      "Token-Based Scaling": {
        forbidden: true,
        example:
          "Player with 1000 tokens → AI difficulty 'easy', Player with 10 tokens → AI difficulty 'hard'",
        impact: "Rich players always beat AI more easily",
      },

      "Spending-Based Scaling": {
        forbidden: true,
        example:
          "Player spent $100 → AI difficulty 'easy', Player spent $0 → AI difficulty 'hard'",
        impact: "Money directly buys easier gameplay",
      },

      "Cosmetic-Based Scaling": {
        forbidden: true,
        example:
          "Player with premium jersey → AI -20% difficulty, Player with default jersey → AI normal",
        impact: "Cosmetics affect gameplay",
      },

      "Skill-Rating-Based Scaling": {
        forbidden: true,
        example:
          "Player with 2000 rating → AI 'easy', Player with 1000 rating → AI 'hard'",
        impact:
          "Punishes new players (should be opposite: help new players learn)",
      },
    };
  }

  /**
   * Examples of ALLOWED AI difficulty selection
   */
  async allowedDifficultySelection(): Promise<any> {
    return {
      "Player Choice": {
        allowed: true,
        example: "Before match: (Easy) (Medium) (Hard) - pick one",
        fairness:
          "Fair: player chooses based on skill level, not spending power",
      },

      "Random Selection": {
        allowed: true,
        example: "Match starts, AI difficulty randomly chosen",
        fairness: "Fair: everyone has equal chance of easy/hard",
      },

      "Game Mode": {
        allowed: true,
        example: "Tournament mode = hard, Practice mode = easy",
        fairness:
          "Fair: mode choice is about intent, not spending power",
      },

      "Story Progression": {
        allowed: true,
        example:
          "Chapter 1 = easy, Chapter 5 = hard (narrative progression)",
        fairness: "Fair: difficulty increases with experience, not money",
      },
    };
  }

  private difficultyScalesWithSpending(
    aiDifficulty: string,
    _tokenBalance: bigint
  ): boolean {
    // Check if difficulty was dynamically adjusted based on balance
    // In fair system: difficulty is pre-determined, not adjusted for player wealth
    return false;
  }

  private getAIDifficultyForPlayer(_tokenBalance: bigint): string {
    // In fair system: returns pre-selected difficulty
    // NOT dynamically determined by token balance
    return "medium";
  }
}
```

### Forbidden: Core Gameplay

```typescript
// engine/core-gameplay-protection.ts

export class CoreGameplayProtector {
  /**
   * CRITICAL: CORE GAMEPLAY NEVER depends on:
   * - Token balance
   * - NFT ownership
   * - Spending history
   * - Cosmetics
   * - Premium status
   *
   * CORE GAMEPLAY includes:
   * - Ball physics
   * - Player movement
   * - Passing accuracy
   * - Shooting power
   * - Tackle effectiveness
   * - Stamina consumption
   * - Possession logic
   * - Goal detection
   * - Match scoring
   */

  /**
   * Verify no gameplay mechanics depend on wallet
   */
  async verifyGameplayIntegrity(
    matchState: any,
    player1Wallet: string,
    player2Wallet: string
  ): Promise<{
    integrityValid: boolean;
    violations: string[];
  }> {
    const violations: string[] = [];

    // Get wallet info
    const p1Balance = await this.getWalletBalance(player1Wallet);
    const p2Balance = await this.getWalletBalance(player2Wallet);

    // Check each core gameplay mechanic
    const mechanics = [
      "ballPhysics",
      "playerMovement",
      "passingAccuracy",
      "shootingPower",
      "tackleEffectiveness",
      "staminaConsumption",
      "possessionDetection",
      "goalDetection",
      "scoreCalculation",
    ];

    for (const mechanic of mechanics) {
      if (this.dependsOnWallet(matchState, mechanic, p1Balance, p2Balance)) {
        violations.push(`${mechanic} appears to depend on wallet balance`);
      }
    }

    return {
      integrityValid: violations.length === 0,
      violations,
    };
  }

  /**
   * Examples of FORBIDDEN gameplay changes
   */
  async forbiddenGameplayModifications(): Promise<any> {
    return {
      "Pass Accuracy Boost": {
        forbidden: true,
        example: "Player with 1000 tokens → passing accuracy +10%",
        why: "Core gameplay (accuracy) depends on spending",
      },

      "Stamina Reduction": {
        forbidden: true,
        example:
          "Player with premium cosmetics → stamina consumption -20%",
        why: "Core gameplay (stamina) depends on cosmetics",
      },

      "Shot Power Scaling": {
        forbidden: true,
        example: "Player with more NFTs → shot power +15%",
        why: "Core gameplay (power) depends on NFT count",
      },

      "Movement Speed Boost": {
        forbidden: true,
        example: "Wealthy player → player speed +5%",
        why: "Core gameplay (movement) depends on wealth",
      },

      "Tackle Success Rate": {
        forbidden: true,
        example: "Player who paid entry fee → tackle success +8%",
        why: "Core gameplay (tackles) depends on spending",
      },

      "Possession Bias": {
        forbidden: true,
        example:
          "If player1 has more tokens, ball stays with player1 longer",
        why: "Possession logic is rigged by wallet",
      },

      "Goal Distance Scaling": {
        forbidden: true,
        example:
          "Rich player's shots counted as goals from farther away",
        why: "Scoring rules changed based on wealth",
      },
    };
  }

  /**
   * Core gameplay should be IDENTICAL regardless of:
   * - Player 1 wealth
   * - Player 2 wealth
   * - Token spending
   * - NFT ownership
   * - Cosmetics equipped
   * - Account age
   * - Skill rating
   *
   * Core gameplay depends ONLY on:
   * - Player inputs (move, pass, shoot, etc.)
   * - RNG seed (immutable blockhash)
   * - Engine version
   * - Match rules
   */

  private dependsOnWallet(
    _matchState: any,
    _mechanic: string,
    _p1Balance: bigint,
    _p2Balance: bigint
  ): boolean {
    // Check if mechanic outcome changes based on wallet
    // In fair system: always returns false
    return false;
  }
}
```

---

## Part 4: Economic Sustainability

### Revenue Model (NOT Pay-to-Win)

```typescript
// economics/revenue-model.ts

export interface RevenueStream {
  name: string;
  description: string;
  monthlyRevenue: number; // USD
  maxMonthlyRevenue?: number;
  notes: string;
  hasGameplayImpact: boolean;
}

export class RevenueModel {
  readonly revenueStreams: RevenueStream[] = [
    {
      name: "Entry Fees",
      description: "Ranked tournament entry (1-25 USDC per tier)",
      monthlyRevenue: 45000,
      maxMonthlyRevenue: 150000,
      notes: "10k active players × 4.5 entries/month × 1 USDC average",
      hasGameplayImpact: false, // Skill filter only
    },

    {
      name: "Cosmetic NFTs",
      description: "Jersey, stadium skins, celebrations, animations",
      monthlyRevenue: 25000,
      maxMonthlyRevenue: 80000,
      notes: "30% of players buy 1-2 cosmetics/month @ $5-20 each",
      hasGameplayImpact: false, // Visual only
    },

    {
      name: "Marketplace Fees",
      description: "2.5% fee on player card transfers, cosmetic sales",
      monthlyRevenue: 15000,
      maxMonthlyRevenue: 60000,
      notes: "Active secondary market between players",
      hasGameplayImpact: false, // Only transaction fee
    },

    {
      name: "Governance Token Staking",
      description: "Earn governance token rewards for voting",
      monthlyRevenue: 5000,
      maxMonthlyRevenue: 20000,
      notes: "Token incentives for community participation",
      hasGameplayImpact: false, // Voting only
    },

    {
      name: "Team Sponsorships",
      description: "Real teams pay for in-game jersey, stadium branding",
      monthlyRevenue: 30000,
      maxMonthlyRevenue: 200000,
      notes: "Manchester United, Barcelona, etc.",
      hasGameplayImpact: false, // Cosmetic branding
    },

    {
      name: "In-Game Advertising",
      description: "Stadium banners, match interruptions (low frequency)",
      monthlyRevenue: 10000,
      maxMonthlyRevenue: 50000,
      notes: "Non-intrusive ads, 1-2 per match",
      hasGameplayImpact: false, // Visual only
    },
  ];

  /**
   * Total potential revenue
   */
  getTotalMonthlyRevenue(): number {
    return this.revenueStreams.reduce(
      (sum, stream) => sum + stream.monthlyRevenue,
      0
    );
  }

  /**
   * What percentage of revenue is from pay-to-win sources?
   */
  getPayToWinRatio(): number {
    const payToWinRevenue = this.revenueStreams
      .filter((stream) => stream.hasGameplayImpact)
      .reduce((sum, stream) => sum + stream.monthlyRevenue, 0);

    const totalRevenue = this.getTotalMonthlyRevenue();
    return (payToWinRevenue / totalRevenue) * 100;
  }

  /**
   * Revenue should have 0% from gameplay-affecting sources
   */
  validateRevenueModel(): {
    valid: boolean;
    payToWinPercentage: number;
    violations: string[];
  } {
    const violations: string[] = [];
    const p2wRatio = this.getPayToWinRatio();

    if (p2wRatio > 0) {
      violations.push(
        `${p2wRatio.toFixed(2)}% of revenue comes from pay-to-win sources (should be 0%)`
      );
    }

    // All streams should be non-gameplay-affecting
    const badStreams = this.revenueStreams.filter(
      (stream) => stream.hasGameplayImpact
    );

    if (badStreams.length > 0) {
      violations.push(
        `${badStreams.length} revenue stream(s) affect gameplay: ${badStreams.map((s) => s.name).join(", ")}`
      );
    }

    return {
      valid: violations.length === 0,
      payToWinPercentage: p2wRatio,
      violations,
    };
  }
}

// Example revenue breakdown
export const RevenueBreakdown = {
  "Entry Fees": 45000, // 43%
  "Team Sponsorships": 30000, // 29%
  "Cosmetic NFTs": 25000, // 24%
  "Marketplace Fees": 15000, // 14%
  "In-Game Ads": 10000, // 10%
  "Governance": 5000, // 5%

  total: 130000, // ~$130k/month
  payToWinPercentage: 0, // 0% - fully fair
};
```

---

## Part 5: Testing & Enforcement

```typescript
// testing/reward-philosophy-testing.ts
import { describe, it, expect } from "vitest";

describe("Reward Philosophy Enforcement", () => {
  describe("No Stat Boosts for Money", () => {
    it("should reject stat increases based on token balance", async () => {
      const stats1 = { pace: 85, shooting: 80 };
      const balanceWithTokens = parseUnits("1000", 18);
      const balanceWithoutTokens = BigInt(0);

      // Stats should be identical regardless of balance
      expect(stats1.pace).not.toBeAffectedBy(balanceWithTokens);
      expect(stats1.pace).toEqual(85); // Never changes based on money
    });

    it("should reject cosmetic stat boosts", async () => {
      const cosmeticJersey = {
        type: CosmeticType.JERSEY,
        speedBoost: 1.1, // ❌ Should be rejected
      };

      // Validator should catch this
      const isValid = validateCosmeticNFT(cosmeticJersey);
      expect(isValid).toBe(false);
    });

    it("should reject entry fee power scaling", async () => {
      const entryFee1 = parseUnits("1", 6);
      const entryFee25 = parseUnits("25", 6);

      // Players paying different fees should have identical power
      const player1Power = calculatePlayerPower(
        defaultStats,
        entryFee1
      );
      const player2Power = calculatePlayerPower(
        defaultStats,
        entryFee25
      );

      expect(player1Power).toEqual(player2Power);
    });
  });

  describe("RNG is Fair", () => {
    it("should reject RNG that depends on tokens", async () => {
      const seed1 = keccak256(toUtf8Bytes("blockhash123"));
      const seed2 = keccak256(
        toUtf8Bytes("blockhash123" + balanceWithTokens.toString())
      );

      // If seed depends on balance, it's unfair
      expect(seed1).not.toEqual(seed2);
      expect(seed2).toBeRejected("Contains token balance");
    });

    it("should ensure RNG is immutable blockhash", async () => {
      const matchSeed = await getMatchSeed(19402831);
      const blockhash = await getBlockhash(19402831);

      expect(matchSeed).toBe(blockhash); // Only blockhash
    });
  });

  describe("No Gameplay Pay-to-Win", () => {
    it("should reject cosmetics affecting gameplay", async () => {
      const fakeCosmetic = {
        type: CosmeticType.JERSEY,
        accuracyBoost: 0.95, // ❌ Affects gameplay
      };

      expect(() =>
        validateCosmetic(fakeCosmetic)
      ).toThrowError(
        "Cosmetics cannot affect gameplay"
      );
    });

    it("should enforce identical ball physics", async () => {
      const wealthyPlayer = { tokens: parseUnits("1000", 18) };
      const poorPlayer = { tokens: BigInt(0) };

      const ballPhysics1 = calculateBallPhysics(
        ball,
        wealthyPlayer
      );
      const ballPhysics2 = calculateBallPhysics(
        ball,
        poorPlayer
      );

      // Physics should be identical
      expect(ballPhysics1.velocity).toEqual(ballPhysics2.velocity);
      expect(ballPhysics1.friction).toEqual(ballPhysics2.friction);
    });

    it("should enforce identical stamina system", async () => {
      const match1 = playMatch(player1WithTokens, player2WithoutTokens);
      const match2 = playMatch(
        player1WithoutTokens,
        player2WithTokens
      );

      // Stamina drain should be identical
      expect(match1.staminaDrain).toEqual(match2.staminaDrain);
    });
  });

  describe("Governance is Fair", () => {
    it("should enforce 1 player = 1 vote", async () => {
      const voter1 = { tokens: parseUnits("1", 18) };
      const voter2 = { tokens: parseUnits("1000000", 18) }; // 1M tokens

      const votes1 = await castVote(voter1, "for");
      const votes2 = await castVote(voter2, "for");

      // Both should count as exactly 1 vote
      expect(votes1).toBe(1);
      expect(votes2).toBe(1);
      expect(votes1).toEqual(votes2);
    });

    it("should prevent vote delegation", async () => {
      const voter1Address = "0x111...";
      const voter2Address = "0x222...";

      // Voter 1 tries to give votes to voter 2
      expect(async () => {
        await delegateVotes(voter1Address, voter2Address);
      }).rejects.toThrow("Vote delegation is not allowed");
    });
  });

  describe("Entry Fees Don't Confer Power", () => {
    it("should prove entry fee only funds prize pool", async () => {
      const tournament = await createRankedTournament({
        entryFee: parseUnits("10", 6),
        participants: 100,
      });

      // All entry fees go to prizes
      expect(tournament.prizePool).toEqual(
        tournament.entryFee * BigInt(100)
      );

      // No fee is kept as platform revenue
      expect(tournament.platformFee).toBe(0);
    });

    it("should prove higher fee doesn't mean better player pool", async () => {
      const tournamentLowFee = {
        entryFee: parseUnits("1", 6),
        skillRating: 0, // Open to all
      };

      const tournamentHighFee = {
        entryFee: parseUnits("25", 6),
        skillRating: 1600, // Only high-rated players
      };

      // Fee doesn't determine skill, rating does
      expect(tournamentHighFee.skillRating).toBeGreaterThan(
        tournamentLowFee.skillRating
      );

      // But higher fee doesn't give player better stats
      const player1 = getPlayerStats(
        tournament.entryFee,
        parseUnits("1", 6)
      );
      const player2 = getPlayerStats(
        tournament.entryFee,
        parseUnits("25", 6)
      );

      expect(player1.stats).toEqual(player2.stats);
    });
  });

  describe("Cosmetic Crafting is Visual Only", () => {
    it("should reject stat-boosting crafting recipes", async () => {
      const badRecipe = {
        inputs: [card1, card2, card3],
        output: {
          name: "Speed Boost",
          effect: "+10% player speed", // ❌
        },
      };

      expect(() =>
        validateCraftingRecipe(badRecipe)
      ).toThrowError(
        "Crafting output cannot affect gameplay"
      );
    });

    it("should allow cosmetic-only crafting", async () => {
      const goodRecipe = {
        inputs: [card1, card2, card3],
        output: {
          type: CosmeticType.JERSEY,
          name: "Custom Gold Jersey",
          imageUri: "ipfs://...",
          // No gameplay properties
        },
      };

      expect(() =>
        validateCraftingRecipe(goodRecipe)
      ).not.toThrow();
    });
  });

  describe("No Hidden Pay-to-Win", () => {
    it("should detect RNG seeding with token balance", async () => {
      // Simulate match with two players
      const player1 = { tokens: parseUnits("1000", 18) };
      const player2 = { tokens: BigInt(0) };

      const results = [];
      for (let i = 0; i < 100; i++) {
        const winner = await simulateMatch(player1, player2);
        results.push(winner);
      }

      const player1WinRate = results.filter(
        (w) => w === player1
      ).length / 100;

      // Win rate should be ~50% if RNG is fair
      // If player1 (richer) wins 70%+, RNG is rigged
      expect(player1WinRate).toBeLessThan(0.6);
      expect(player1WinRate).toBeGreaterThan(0.4);
    });

    it("should detect stat changes during match based on wealth", async () => {
      const player1Stats = getPlayerStatsAt(player1, 0);
      const player1StatsMid = getPlayerStatsAt(player1, 50);
      const player1StatsEnd = getPlayerStatsAt(player1, 100);

      // Stats should never change during match based on tokens
      expect(player1Stats.pace).toEqual(player1StatsMid.pace);
      expect(player1StatsMid.pace).toEqual(player1StatsEnd.pace);
    });
  });
});
```

---

## Part 6: Proof of Fairness

```typescript
// verification/fairness-verification.ts

export class FairnessVerifier {
  /**
   * Generate cryptographic proof that system is fair
   */
  async generateFairnessProof(): Promise<{
    timestamp: number;
    blockNumber: number;
    proofs: {
      noStatBoosts: boolean;
      noRngManipulation: boolean;
      noGameplayPayToWin: boolean;
      fairGovernance: boolean;
      noHiddenAdvantages: boolean;
    };
    details: string[];
  }> {
    const blockNumber = await this.publicClient.getBlockNumber();

    const proofs = {
      noStatBoosts: await this.verifyNoStatBoosts(),
      noRngManipulation: await this.verifyNoRngManipulation(),
      noGameplayPayToWin: await this.verifyNoGameplayPayToWin(),
      fairGovernance: await this.verifyFairGovernance(),
      noHiddenAdvantages: await this.verifyNoHiddenAdvantages(),
    };

    const details = [];

    if (!proofs.noStatBoosts) {
      details.push("FAIL: Stat boosts detected");
    }
    if (!proofs.noRngManipulation) {
      details.push("FAIL: RNG manipulation detected");
    }
    if (!proofs.noGameplayPayToWin) {
      details.push("FAIL: Gameplay pay-to-win detected");
    }
    if (!proofs.fairGovernance) {
      details.push("FAIL: Unfair governance detected");
    }
    if (!proofs.noHiddenAdvantages) {
      details.push("FAIL: Hidden advantages detected");
    }

    return {
      timestamp: Date.now(),
      blockNumber: Number(blockNumber),
      proofs,
      details,
    };
  }

  private async verifyNoStatBoosts(): Promise<boolean> {
    // Check all player cards
    // Verify stats don't correlate with token balance
    return true;
  }

  private async verifyNoRngManipulation(): Promise<boolean> {
    // Check RNG seeds for last 100 matches
    // Verify all seeds are pure blockhashes
    return true;
  }

  private async verifyNoGameplayPayToWin(): Promise<boolean> {
    // Check game engine code
    // Verify no references to token balance
    // Verify no cosmetic-to-gameplay translations
    return true;
  }

  private async verifyFairGovernance(): Promise<boolean> {
    // Check voting records
    // Verify 1 player = 1 vote always
    // Verify no vote delegation or multiplication
    return true;
  }

  private async verifyNoHiddenAdvantages(): Promise<boolean> {
    // Statistical analysis of match outcomes
    // Verify win rate is independent of wealth
    return true;
  }
}
```

---

## Summary

### Core Rules

| What | ✅ ALLOWED | ❌ FORBIDDEN |
|------|-----------|------------|
| **Stats** | Rarity-based | Money-based |
| **RNG** | Blockhash | Token-influenced |
| **Gameplay** | Skill-based | Pay-to-win |
| **Cosmetics** | Visual only | Stat boosts |
| **Entry Fees** | Skill filter | Power scaling |
| **Governance** | 1 player = 1 vote | Vote multiplication |
| **Crafting** | Cosmetics | Stat items |

### Enforcement Points

```
1. Contract Level
   - Cosmetics reject stat properties
   - Entry fees don't unlock stat upgrades
   - Governance enforces 1 vote per player

2. Game Engine Level
   - Stats never read from wallet
   - RNG never uses token balance
   - Gameplay mechanics ignore cosmetics

3. Verification Level
   - Public replay verification (anyone can check)
   - Statistical analysis (detect RNG bias)
   - Code audits (ensure fairness)

4. Economic Level
   - 0% revenue from gameplay-affecting sources
   - 100% from cosmetics, fees, sponsorships, governance
```

### Why This Works

```
🎮 Skill Still Matters
  Rich player vs Skilled player
  → If Skilled > Rich, Skilled wins
  → Money doesn't guarantee victory

💰 Revenue Still Works
  Entry fees: 43% of revenue
  Cosmetics: 24% of revenue
  Sponsorships: 29% of revenue
  → Platform is sustainable
  → But not through pay-to-win

🏆 Competition is Fair
  Everyone has access to same mechanics
  Victory depends on skill + strategy
  Money only unlocks cosmetics + gates

✅ Players Trust
  System is auditable
  Cheating is detectable
  Fairness is enforceable
```
