# Bass Ball In-Game Economy Adapters Guide

## Overview

The Game Economy Adapters system integrates all Web3 features directly into Bass Ball gameplay. Players earn real tokens from wins, stake in tournaments, unlock achievement NFTs, and trade cosmetics on a decentralized marketplace.

**Core Features:**
- 🎮 **Match Rewards**: USDC distributed based on wins/losses/draws
- 🏆 **Tournament Escrow**: Smart contract-managed prize pools
- 🎭 **Player Stats NFTs**: Achievement tokens with seasonal updates
- 🛍️ **In-Game Marketplace**: Formations, cosmetics, and special items

---

## Part 1: Match Rewards System

### Overview

Players earn USDC rewards for match outcomes. Rewards scale with MMR rank and include streak bonuses.

### Reward Brackets

| Rank | MMR Range | Win | Loss | Draw | Multiplier |
|------|-----------|-----|------|------|-----------|
| Bronze | 0-1000 | 5 USDC | 1 USDC | 2 USDC | 1.0x |
| Silver | 1000-1500 | 10 USDC | 2 USDC | 4 USDC | 1.2x |
| Gold | 1500-2000 | 20 USDC | 5 USDC | 8 USDC | 1.5x |
| Diamond | 2000-2500 | 40 USDC | 10 USDC | 15 USDC | 2.0x |
| Legendary | 2500+ | 100 USDC | 25 USDC | 40 USDC | 3.0x |

### Basic Example: Calculate Reward

```typescript
import { calculateMatchReward, getRewardBracketByMMR } from '@/lib/web3/game-economy-adapters';

// Diamond player wins a match
const reward = calculateMatchReward(
  'match-001',
  'player-123',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f42b3e',
  2200, // MMR
  'win'
);

console.log(reward);
// {
//   matchId: 'match-001',
//   playerId: 'player-123',
//   amount: 80,
//   baseReward: 40,
//   multiplier: 2.0,
//   finalReward: 80
// }

// Check bracket
const bracket = getRewardBracketByMMR(2200);
// → { level: 'diamond', winReward: 40, ... }
```

### Streak Bonuses

Consecutive wins add bonus multipliers:

```typescript
import { getStreakBonus } from '@/lib/web3/game-economy-adapters';

// 5-win streak
const bonus = getStreakBonus(5, 0); // +25% bonus
// Final reward: 40 * 2.0 * 1.25 = 100 USDC

// 3-loss streak
const malus = getStreakBonus(0, 3); // -15% penalty
// Final reward: 5 * 1.0 * 0.85 = 4.25 USDC
```

### Distribute Rewards for Match

```typescript
import { 
  distributeMatchRewards, 
  batchDistributeRewards 
} from '@/lib/web3/game-economy-adapters';

const match: Match = {
  id: 'match-001',
  homePlayerId: 'player-alice',
  awayPlayerId: 'player-bob',
  status: 'completed',
  winner: 'home',
  finalScore: { home: 3, away:1 },
  // ... other fields
};

const players = {
  'player-alice': { mmr: 1800, id: 'player-alice', /* ... */ },
  'player-bob': { mmr: 1600, id: 'player-bob', /* ... */ },
};

// Single match
const rewards = distributeMatchRewards(match, players['player-alice'], players['player-bob']);

// Rewards:
// - Alice (winner, Gold rank): 40 USDC
// - Bob (loser, Silver rank): 2 USDC

// Batch distribution for multiple matches
const batchRewards = batchDistributeRewards([match1, match2, match3], players);
```

### Reward History & Analytics

```typescript
import { 
  getPlayerRewardHistory, 
  calculateTotalEarnings 
} from '@/lib/web3/game-economy-adapters';

const history = getPlayerRewardHistory(allRewards, 'player-alice', 50);
// Returns last 50 rewards for Alice

const totalEarned = calculateTotalEarnings(allRewards, 'player-alice');
// Returns total USDC earned by Alice

// Example output
console.log({
  recentWins: 8,
  recentRewards: [100, 100, 100, 100, 100, 80, 80, 40],
  totalEarned: 680.50,
  averagePerMatch: 42.5,
});
```

---

## Part 2: Tournament Escrow System

### Overview

Players stake USDC to enter tournaments. Funds are held in escrow on-chain, then distributed to winners.

### Tournament Structure

```typescript
import { createTournamentEscrow, calculatePrizeDistribution } from '@/lib/web3/game-economy-adapters';

const tournament: Tournament = {
  id: 'tournament-2024-01',
  name: 'Bass Ball Open',
  maxPlayers: 64,
  entryFee: 100, // 100 USDC
  prizePool: 6400, // Total from all entries
  format: 'single-elimination',
  startTime: Math.floor(Date.now() / 1000) + 3600,
  participants: ['player-1', 'player-2', /* ... 62 more */],
  status: 'registration',
  // ... other fields
};

// Create escrow for tournament
const escrow = createTournamentEscrow(tournament, players);

console.log({
  totalEscrow: 6400,
  playerCount: 64,
  perPlayer: 100,
  status: 'locked',
});
```

### Prize Distribution

```typescript
// Default: 50% 1st, 30% 2nd, 20% 3rd
const distribution = calculatePrizeDistribution(
  escrow,
  tournament,
  ['player-champion', 'player-runnerup', 'player-third'] // Winners in order
);

console.log(distribution);
// {
//   'player-champion': 3200,    // 50% of 6400
//   'player-runnerup': 1920,    // 30% of 6400
//   'player-third': 1280        // 20% of 6400
// }
```

### Release Tournament Funds

```typescript
import { releaseTournamentEscrow } from '@/lib/web3/game-economy-adapters';

const { escrow: releasedEscrow, distributions } = releaseTournamentEscrow(
  escrow,
  tournament,
  ['player-champion', 'player-runnerup', 'player-third']
);

console.log({
  escrow: {
    status: releasedEscrow.status, // 'released'
    txHash: releasedEscrow.distributionTxHash,
  },
  distributions,
});

// On-chain action: Transfer funds to winners' wallets
```

### Tournament Statistics

```typescript
import { getTournamentStats } from '@/lib/web3/game-economy-adapters';

const stats = getTournamentStats(tournament);

console.log({
  participants: 64,
  prizePool: 6400,
  avgPrize: 100,
  minStake: 100,
  maxStake: 6400,
  coverage: '64%', // % of daily economy
});
```

### Advanced: Multi-Stage Tournament

```typescript
// Round-robin followed by playoffs
const tournament: Tournament = {
  // ... base properties
  format: 'round-robin',
  prizeDistribution: [0.4, 0.3, 0.15, 0.1, 0.05], // Top 5 share
};

// Track tournament progression
const stages = {
  registration: { endTime: Date.now() + 24 * 3600 * 1000, players: 64 },
  groupStage: { endTime: Date.now() + 48 * 3600 * 1000, phases: 3 },
  playoffs: { endTime: Date.now() + 72 * 3600 * 1000, rounds: 4 },
};

// Each stage has its own reward pool if needed
```

---

## Part 3: Player Stats NFTs

### Overview

Seasonal NFTs represent player achievements. Minting requires minimum stats and unlocks special cosmetics.

### NFT Eligibility

```typescript
import { checkNFTMintEligibility } from '@/lib/web3/game-economy-adapters';

const player = {
  id: 'player-alice',
  totalMatches: 150,
  mmr: 1850,
  // ... other fields
};

const eligibility = checkNFTMintEligibility(player, 10, 800);

// Example outputs:
// Eligible player:
// {
//   eligible: true,
//   reasons: []
// }

// Ineligible player (insufficient MMR):
// {
//   eligible: false,
//   reasons: [
//     'Need at least 800 MMR (have 650)',
//     'Need at least 10 matches (have 8)'
//   ]
// }
```

### Check & Unlock Achievements

```typescript
import { checkAndUnlockAchievements } from '@/lib/web3/game-economy-adapters';

const achievements = checkAndUnlockAchievements(player, []);

// Returns unlocked achievements for this player:
// [
//   {
//     id: 'first_match',
//     name: 'Welcome to Bass Ball',
//     unlockedAt: 1704067200000,
//     rarity: 'common'
//   },
//   {
//     id: 'first_win',
//     name: 'First Victory',
//     unlockedAt: 1704153600000,
//     rarity: 'common'
//   },
//   {
//     id: 'gold_rank',
//     name: 'Gold Tier',
//     unlockedAt: 1704240000000,
//     rarity: 'epic'
//   },
//   // ... more achievements
// ]
```

### Available Achievements

| Achievement | Requirement | Rarity |
|-------------|-------------|--------|
| Welcome to Bass Ball | First match | Common |
| First Victory | Win 1 match | Common |
| Hat Trick Hero | Score 3+ goals | Rare |
| On Fire | 5 consecutive wins | Uncommon |
| Gold Tier | Reach 1500 MMR | Epic |
| Legendary | Reach 2500 MMR | Legendary |
| Champion | Win tournament | Epic |

### Mint Player Stats NFT

```typescript
import { 
  createPlayerStatsNFT, 
  checkAndUnlockAchievements 
} from '@/lib/web3/game-economy-adapters';

const player = {
  id: 'player-alice',
  username: 'Alice#1234',
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f42b3e',
  totalMatches: 150,
  wins: 95,
  losses: 45,
  draws: 10,
  mmr: 1850,
  totalEarnings: 1500,
};

// Get achievements
const achievements = checkAndUnlockAchievements(player, []);

// Create NFT data
const nftData = createPlayerStatsNFT(player, achievements, 1);

console.log({
  playerName: nftData.playerName,
  season: nftData.season,
  rarity: nftData.rarity, // 'rare' (Gold tier)
  stats: {
    wins: 95,
    losses: 45,
    winRate: 63.33,
    mmr: 1850,
    totalEarnings: 1500,
    achievements: 3,
  },
  achievements: achievements.map(a => ({
    name: a.name,
    icon: a.icon,
    unlockedAt: new Date(a.unlockedAt).toISOString(),
  })),
});
```

### NFT Metadata Standard

```json
{
  "name": "Alice#1234 - Season 1",
  "description": "Bass Ball player stats and achievements snapshot",
  "image": "ipfs://Qm...", // Player card with stats
  "attributes": [
    {
      "trait_type": "Rank",
      "value": "Gold"
    },
    {
      "trait_type": "MMR",
      "value": 1850
    },
    {
      "trait_type": "Win Rate",
      "value": "63.33%"
    },
    {
      "trait_type": "Total Matches",
      "value": 150
    },
    {
      "trait_type": "Total Earnings",
      "value": "1500 USDC"
    },
    {
      "trait_type": "Achievements",
      "value": 3
    },
    {
      "trait_type": "Rarity",
      "value": "Rare"
    }
  ]
}
```

### NFT Benefits

Holding a player stats NFT unlocks:

```typescript
const nftBenefits = {
  rarity: 'rare',
  benefits: [
    '✨ Exclusive cosmetics',
    '🎁 Daily reward multiplier (+10%)',
    '🏅 Special badge in profile',
    '💎 Access to premium tournaments',
    '🎵 Custom celebration animations',
  ],
  season: 1,
  validUntil: 'Season 2 starts',
};
```

---

## Part 4: Marketplace System

### Overview

Players buy/sell formations, cosmetics, and special items using USDC on a decentralized marketplace.

### Browse Marketplace

```typescript
import { getMarketplaceItems } from '@/lib/web3/game-economy-adapters';

// Get all items
const allItems = getMarketplaceItems();

// Filter by type
const formations = getMarketplaceItems({ type: 'formation' });
// [
//   { id: 'formation_4-3-3', name: '4-3-3 Classic', price: 50 },
//   { id: 'formation_5-3-2', name: '5-3-2 Defensive', price: 75 },
//   { id: 'formation_3-5-2', name: '3-5-2 Attacking', price: 100 },
// ]

// Filter by price range
const budget = getMarketplaceItems({ 
  minPrice: 0, 
  maxPrice: 50 
});

// Filter by rarity
const epicItems = getMarketplaceItems({ 
  rarity: 'epic' 
});
```

### Available Items

**Formations:**
- 4-3-3 Classic (50 USDC) - Balanced
- 5-3-2 Defensive (75 USDC) - Defense focused
- 3-5-2 Attacking (100 USDC) - Attack focused

**Cosmetics:**
- Golden Jersey (25 USDC) - Limited 100
- Neon Stadium (50 USDC) - Limited 50

**Consumables:**
- Double Reward Boost (10 USDC)
- Formation Card Pack (25 USDC)

### Create Listing

```typescript
import { createMarketplaceOrder } from '@/lib/web3/game-economy-adapters';

// Seller lists item
const listing = createMarketplaceOrder(
  'cosmetic_gold_kit',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f42b3e', // Seller wallet
  25, // USDC price
  'listing',
  24 // Expires in 24 hours
);

console.log({
  id: listing.id,
  item: 'cosmetic_gold_kit',
  price: 25,
  status: 'active',
  expiresAt: new Date(listing.expiresAt).toISOString(),
});
```

### Purchase Item

```typescript
import { fillMarketplaceOrder } from '@/lib/web3/game-economy-adapters';

// Buyer purchases item
const filledOrder = fillMarketplaceOrder(
  listing,
  '0x98765432100123456789012345678901234567890' // Buyer wallet
);

console.log({
  id: filledOrder.id,
  status: 'filled',
  seller: listing.seller,
  buyer: filledOrder.buyer,
  price: 25,
  txHash: filledOrder.txHash,
});

// On-chain actions:
// 1. Transfer 25 USDC from buyer to marketplace
// 2. Transfer item NFT from seller to buyer
// 3. Transfer proceeds to seller (after platform fee)
```

### Calculate Fees

```typescript
import { calculateMarketplaceFee } from '@/lib/web3/game-economy-adapters';

const transaction = calculateMarketplaceFee(100); // 100 USDC item

console.log({
  itemPrice: 100,
  platformFee: 2.50, // 2.5%
  totalCost: 102.50,
  breakdown: {
    seller: 97.50, // After fee
    platform: 2.50,
  },
});
```

### Marketplace Analytics

```typescript
import { getMarketplaceMetrics } from '@/lib/web3/game-economy-adapters';

const metrics = getMarketplaceMetrics(allOrders);

console.log({
  totalVolume: 50000, // Total USDC traded
  totalOrders: 500,
  filledOrders: 400,
  activeListings: 95,
  averagePrice: 125,
  medianPrice: 50,
});
```

### Secondary Market Example

```typescript
// Player wants to sell rare cosmetic
const originalPurchase = {
  buyer: '0x111...',
  price: 25,
};

// Now selling on secondary market
const secondaryListing = createMarketplaceOrder(
  'cosmetic_gold_kit',
  '0x111...', // Original buyer is now seller
  45, // Higher price due to scarcity
  'listing'
);

// New buyer purchases
const sale = fillMarketplaceOrder(secondaryListing, '0x222...');

// Economics:
// - Secondary seller (0x111) gets: 43.88 USDC (after 2.5% fee)
// - Secondary buyer (0x222) pays: 45 USDC
// - Platform earns: 1.12 USDC
```

---

## Part 5: Economy Analytics & Reporting

### Player Economy Metrics

```typescript
import { getPlayerEconomyMetrics } from '@/lib/web3/game-economy-adapters';

const metrics = getPlayerEconomyMetrics(player, allRewards, allOrders);

console.log({
  totalEarned: 1500.50,
  earnedThisWeek: 125.25,
  averageRewardPerMatch: 42.5,
  itemsPurchased: 8,
  itemsSpent: 350,
  netEconomy: 1150.50, // Total earned minus spent
});

// Business metrics
console.log({
  roi: 3.29, // 1500.50 / 456 (if entry fee was 456)
  weeklyVelocity: 125.25 / 7, // 17.89 USDC/day
  spendingRate: 350 / 1500.50, // 23.3% of earnings reinvested
});
```

### Overall Economy Stats

```typescript
import { getGameEconomyStats } from '@/lib/web3/game-economy-adapters';

const economyStats = getGameEconomyStats(
  allMatches,
  allRewards,
  allTournaments,
  allNFTs,
  allOrders,
  activePlayerCount
);

console.log({
  totalMatches: 50000,
  totalRewardsDistributed: 1250000, // USDC
  totalTournamentVolume: 500000,
  totalNFTsMinted: 2500,
  totalMarketplaceVolume: 125000,
  activePlayerCount: 10000,
  averageRewardPerMatch: 25,
  averageStakePerTournament: 5000,
});
```

### Economy Health Checks

```typescript
const healthCheck = {
  rewards: {
    distributed: 1250000,
    pending: 50000,
    backlog: 0,
    status: '✅ Healthy'
  },
  liquidity: {
    escrow: 500000,
    available: 250000,
    utilization: '67%',
    status: '✅ Adequate'
  },
  marketplace: {
    volume: 125000,
    listings: 350,
    avgPrice: 35.71,
    turnover: '2.4x/week',
    status: '⚠️ Moderate'
  },
  players: {
    active: 10000,
    newThisWeek: 1200,
    retention: '78%',
    engagement: '8.5h/week',
    status: '✅ Growing'
  }
};
```

---

## Part 6: Integration Examples

### Complete Match Flow

```typescript
import {
  calculateMatchReward,
  distributeMatchRewards,
  getPlayerRewardHistory,
} from '@/lib/web3/game-economy-adapters';

// 1. Match completes
const completedMatch: Match = {
  id: 'match-2024-001',
  homePlayerId: 'alice',
  awayPlayerId: 'bob',
  status: 'completed',
  winner: 'home',
  finalScore: { home: 3, away: 1 },
  rewardDistributed: false,
  // ...
};

// 2. Distribute rewards
const rewards = distributeMatchRewards(
  completedMatch,
  alicePlayer,
  bobPlayer
);

// 3. On-chain: Transfer USDC to winners
// await contractCall.distributeRewards(rewards);

// 4. Mark match as rewarded
completedMatch.rewardDistributed = true;
completedMatch.rewardTxHash = '0x...';

// 5. Update UI with reward
showRewardNotification({
  title: 'Match Complete!',
  amount: rewards[0].finalReward,
  rank: getBracketNameByMMR(alicePlayer.mmr),
});

// 6. Player can view history
const history = getPlayerRewardHistory(allRewards, 'alice');
```

### Tournament Entry to Prize Distribution

```typescript
import {
  createTournamentEscrow,
  releaseTournamentEscrow,
  getTournamentStats,
} from '@/lib/web3/game-economy-adapters';

// 1. Tournament registration
const tournament: Tournament = {
  id: 'tournament-spring-2024',
  name: 'Spring Championship',
  maxPlayers: 64,
  entryFee: 100,
  status: 'registration',
  // ...
};

// 2. Create escrow as players register
const escrow = createTournamentEscrow(tournament, participants);
console.log(`Escrow locked: ${escrow.totalAmount} USDC`);

// 3. Show tournament stats
const stats = getTournamentStats(tournament);
displayStats(stats);

// 4. Tournament completes with winners
const winners = ['player-1', 'player-2', 'player-3'];

// 5. Release escrow and distribute prizes
const { escrow: released, distributions } = releaseTournamentEscrow(
  escrow,
  tournament,
  winners
);

// 6. On-chain: Execute prize distribution
// await contractCall.distributePrizes(distributions);

// 7. Notify winners
notifyWinners(distributions);
```

### NFT Minting Achievement

```typescript
import {
  checkNFTMintEligibility,
  checkAndUnlockAchievements,
  createPlayerStatsNFT,
} from '@/lib/web3/game-economy-adapters';

// 1. Check if player qualifies
const { eligible, reasons } = checkNFTMintEligibility(player);

if (!eligible) {
  showMessage(`Not eligible: ${reasons.join(', ')}`);
  return;
}

// 2. Get all achievements
const achievements = checkAndUnlockAchievements(player, []);

// 3. Create NFT data
const nftData = createPlayerStatsNFT(player, achievements, season);

// 4. Generate metadata JSON and upload to IPFS
const ipfsHash = await uploadToIPFS({
  name: `${player.username} - Season ${season}`,
  description: 'Player stats and achievements snapshot',
  attributes: generateAttributes(nftData),
});

// 5. On-chain: Mint NFT
const txHash = await contractCall.mintPlayerStatsNFT({
  player: player.walletAddress,
  metadataURI: `ipfs://${ipfsHash}`,
  season,
});

// 6. Store in database
await db.playerStatsNFT.create({
  ...nftData,
  tokenId: response.tokenId,
  ipfsHash,
  txHash,
});

// 7. Award NFT benefits
grantNFTBenefits(player.id, nftData.rarity);
```

### Marketplace Purchase Flow

```typescript
import {
  getMarketplaceItems,
  createMarketplaceOrder,
  fillMarketplaceOrder,
  calculateMarketplaceFee,
} from '@/lib/web3/game-economy-adapters';

// 1. Browse marketplace
const formations = getMarketplaceItems({ type: 'formation' });
displayCatalog(formations);

// 2. Create listing (seller perspective)
const listing = createMarketplaceOrder(
  'formation_3-5-2',
  seller.wallet,
  100,
  'listing',
  72 // 72 hour expiry
);

// 3. Show to buyers, someone decides to purchase
const { price, fee, total } = calculateMarketplaceFee(listing.price);

// 4. Buyer confirms purchase
showConfirmation({
  item: 'formation_3-5-2',
  price: 100,
  fee: 2.50,
  total: 102.50,
});

// 5. Fill order on-chain
const filledOrder = fillMarketplaceOrder(listing, buyer.wallet);

// 6. Execute blockchain transaction
await contractCall.executeMarketplaceSale({
  orderId: filledOrder.id,
  amount: total,
  recipient: seller.wallet,
  itemTransfer: filledOrder.itemId,
});

// 7. Update inventory
await updateInventory(buyer.id, 'add', filledOrder.itemId);
await updateInventory(seller.id, 'remove', filledOrder.itemId);

// 8. Show success
showNotification(`Purchased ${itemName}!`);
```

---

## Part 7: Advanced Configuration

### Custom Reward Brackets

```typescript
const CUSTOM_BRACKETS = {
  seasonal_multiplier: {
    off_season: 0.5,
    regular_season: 1.0,
    playoffs: 2.0,
  },
  event_bonuses: {
    'tournament-spring': 1.5,
    'rivalry-weekend': 2.0,
    'new-season': 1.2,
  },
  achievement_bonuses: {
    first_time_formation: 0.25,
    perfect_game: 0.5,
    shutout: 0.3,
  },
};

// Apply multipliers
const baseReward = 40;
const seasonalReward = baseReward * CUSTOM_BRACKETS.seasonal_multiplier.playoffs;
const withEventBonus = seasonalReward * CUSTOM_BRACKETS.event_bonuses['tournament-spring'];
// Final: 40 * 2.0 * 1.5 = 120 USDC
```

### Dynamic Pricing

```typescript
// Price adjustments based on supply/demand
const adjustPrice = (basePrice: number, supplyPercent: number) => {
  if (supplyPercent > 80) return basePrice * 0.7; // Oversupply
  if (supplyPercent > 50) return basePrice * 0.85; // Plenty
  if (supplyPercent > 20) return basePrice * 1.0; // Normal
  if (supplyPercent > 5) return basePrice * 1.5; // Scarce
  return basePrice * 2.0; // Very rare
};

const goldenJerseySupply = 45 / 100; // 45%
const adjustedPrice = adjustPrice(25, goldenJerseySupply);
// 25 * 0.85 = 21.25 USDC
```

### Anti-Smurf Rewards

```typescript
// New accounts earn less
const smurfMultiplier = (accountAge: number) => {
  const daysSinceCreation = Math.floor((Date.now() - accountAge) / (1000 * 3600 * 24));
  
  if (daysSinceCreation < 7) return 0.5; // 50% rewards first week
  if (daysSinceCreation < 30) return 0.75; // 75% first month
  return 1.0; // Full rewards after
};

const newAccountReward = baseReward * smurfMultiplier(accountCreatedTime);
```

### Fraud Detection

```typescript
// Flag suspicious reward patterns
const detectFraud = (rewards: MatchReward[]) => {
  const patterns = {
    unrealistic_winrate: 0,
    rapid_ranking_climb: 0,
    unusual_amounts: 0,
  };

  // Check patterns...
  return patterns;
};
```

---

## Part 8: API Reference

### Match Rewards

```typescript
// Calculate single reward
calculateMatchReward(
  matchId: string,
  playerId: string,
  wallet: string,
  mmr: number,
  outcome: 'win' | 'loss' | 'draw',
  bonus?: number
): MatchReward

// Distribute for single match
distributeMatchRewards(
  match: Match,
  homePlayer: Player,
  awayPlayer: Player
): MatchReward[]

// Distribute for multiple matches
batchDistributeRewards(
  matches: Match[],
  players: Record<string, Player>
): MatchReward[]

// Get reward history
getPlayerRewardHistory(
  rewards: MatchReward[],
  playerId: string,
  limit?: number
): MatchReward[]

// Calculate total earnings
calculateTotalEarnings(
  rewards: MatchReward[],
  playerId: string
): number
```

### Tournament Escrow

```typescript
// Create escrow
createTournamentEscrow(
  tournament: Tournament,
  participants: Player[]
): TournamentEscrow

// Calculate prize distribution
calculatePrizeDistribution(
  escrow: TournamentEscrow,
  tournament: Tournament,
  winners: string[]
): Record<string, number>

// Release escrow
releaseTournamentEscrow(
  escrow: TournamentEscrow,
  tournament: Tournament,
  winners: string[]
): { escrow: TournamentEscrow; distributions: Record<string, number> }

// Get stats
getTournamentStats(tournament: Tournament): TournamentStats
```

### Player Stats NFTs

```typescript
// Check eligibility
checkNFTMintEligibility(
  player: Player,
  minMatches?: number,
  minMMR?: number
): { eligible: boolean; reasons: string[] }

// Check and unlock achievements
checkAndUnlockAchievements(
  player: Player,
  existing: Achievement[]
): Achievement[]

// Create NFT data
createPlayerStatsNFT(
  player: Player,
  achievements: Achievement[],
  season?: number
): PlayerStatsNFT
```

### Marketplace

```typescript
// Get items
getMarketplaceItems(filter?: {
  type?: string;
  rarity?: string;
  maxPrice?: number;
  minPrice?: number;
}): MarketplaceItem[]

// Create order
createMarketplaceOrder(
  itemId: string,
  seller: string,
  price: number,
  orderType?: 'listing' | 'offer',
  expirationHours?: number
): MarketplaceOrder

// Fill order
fillMarketplaceOrder(
  order: MarketplaceOrder,
  buyer: string
): MarketplaceOrder

// Calculate fees
calculateMarketplaceFee(
  price: number,
  feePercentage?: number
): { price: number; fee: number; total: number }

// Get metrics
getMarketplaceMetrics(orders: MarketplaceOrder[]): MarketplaceMetrics
```

### Analytics

```typescript
// Get game economy stats
getGameEconomyStats(
  matches: Match[],
  rewards: MatchReward[],
  tournaments: Tournament[],
  nfts: PlayerStatsNFT[],
  orders: MarketplaceOrder[],
  activePlayers: number
): GameEconomyStats

// Get player metrics
getPlayerEconomyMetrics(
  player: Player,
  rewards: MatchReward[],
  orders: MarketplaceOrder[]
): PlayerEconomyMetrics

// Get player inventory
getPlayerInventory(
  playerId: string,
  formations: string[],
  cosmetics: string[],
  usdcBalance: number,
  baseBalance: number,
  claimable: number
): PlayerInventory
```

---

## Summary

The Game Economy Adapters connects all DeFi infrastructure directly to Bass Ball gameplay:

- ✅ **Match Rewards** - Earn USDC from wins
- ✅ **Tournament Escrow** - Stake tokens on tournaments
- ✅ **Player NFTs** - Unlock achievement tokens
- ✅ **Marketplace** - Trade cosmetics and formations

All systems integrate with Base Chain for real, on-chain transactions.
