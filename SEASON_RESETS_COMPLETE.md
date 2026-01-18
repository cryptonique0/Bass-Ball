# Season Resets, Rewards & Challenges - Complete Guide

## Overview

This system implements three interconnected features for managing competitive seasons:

1. **Season Reset System** - Transitions between seasons with flexible stat preservation
2. **Reward System** - Distributes XP, tokens, and cosmetic NFTs based on achievements
3. **Challenge System** - Daily and weekly challenges with tracking and rewards

## Architecture

### Core Components

```
lib/seasonManagement.ts (364 lines)
├── SeasonManager - Manages season lifecycle and stat archival
├── SeasonConfig - Season definition with flexible reset rules
└── PlayerSeasonSnapshot - Archives end-of-season statistics

lib/rewardSystem.ts (451 lines)
├── RewardManager - Distributes and tracks rewards
├── Reward - Reward definition (XP, tokens, cosmetics, badges)
├── RewardClaim - Tracks pending and claimed rewards
├── CosmeticNFT - NFT cosmetic definition with metadata
└── RankingRewardTier - Tiered rewards by ranking position

lib/challengeSystem.ts (450+ lines)
├── ChallengeManager - Manages daily/weekly challenges
├── Challenge - Challenge definition with difficulty and rewards
└── ChallengeProgress - Tracks individual player progress

components/RewardsAndChallenges.tsx (600+ lines)
├── RewardsAndChallenges - Main UI component with tabs
├── RewardsTab - Display pending/claimed rewards and cosmetics
├── ChallengesTab - Display active daily/weekly challenges
└── Supporting cards - ChallengeCard, RewardCard, CosmeticCard
```

---

## Season Management

### Creating a Season

```typescript
import { SeasonManager } from '@/lib/seasonManagement';

const seasonMgr = SeasonManager.getInstance();

const season = seasonMgr.createSeason(
  1,                           // Season number
  'Winter 2026',              // Season name
  'winter_theme',             // Theme
  {
    resetLevel: false,        // Don't reset player levels
    resetTier: false,         // Don't reset tiers
    preserveXP: true,         // Keep some XP
    preserveXPPercentage: 10, // Keep 10% of XP
    resetMatches: true,       // Reset match count
    preserveBadges: true,     // Keep earned badges
    resetStreak: true,        // Reset win streak
  }
);

// season object:
// {
//   seasonId: 'season_1',
//   seasonNumber: 1,
//   seasonName: 'Winter 2026',
//   theme: 'winter_theme',
//   startDate: 1704067200000,
//   endDate: 1711844800000,
//   status: 'planning',
//   resetDate: 1711944800000,
//   resetRules: { ... }
// }
```

### Activating a Season

```typescript
// Start the season
seasonMgr.activateSeason('season_1');

// Season status changes from 'planning' to 'active'
```

### Taking Snapshots

```typescript
// Archive stats before reset
const snapshot = seasonMgr.takeSnapshot(
  'season_1',
  'team_1',
  'team',
  'Team A'
);

// Snapshot captures:
// - Final level, tier, XP
// - Match statistics (W/L/D, goals, assists)
// - Average rating
// - Badges and milestones
// - Final rank and position
```

### Executing Season Reset

```typescript
// Execute full season transition
const result = seasonMgr.executeSeasonReset('season_1');

// Returns:
// {
//   seasonId: 'season_1',
//   entitiesReset: 5,
//   snapshotsCreated: 5,
//   xpCarriedOver: [
//     { entityId: 'team_1', previousXP: 1000, carriedOver: 100 },
//     ...
//   ],
//   adjustments: [
//     { entityId: 'team_1', newLevel: 1, newXP: 100 },
//     ...
//   ],
//   resetDate: 1711944800000
// }
```

### Querying Season Data

```typescript
// Get all snapshots for a season
const snapshots = seasonMgr.getSeasonSnapshots('season_1');

// Get season statistics
const stats = seasonMgr.getSeasonStats('season_1');
// {
//   averageLevel: 5.2,
//   topTier: 'legendary',
//   totalMatches: 150,
//   highestWinRate: 0.75,
//   totalPlayers: 5
// }

// Get reset history
const history = seasonMgr.getResetHistory();

// Get all seasons
const allSeasons = seasonMgr.getAllSeasons();
```

---

## Reward System

### Reward Types

```typescript
type RewardType = 'xp' | 'token' | 'cosmetic_nft' | 'cosmetic' | 'badge';

interface Reward {
  rewardId: string;
  type: RewardType;
  amount: number;              // XP points, token count, etc.
  description: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  source: 'season_end' | 'ranking_top10' | 'tier_promotion' | 'challenge';
  metadata?: Record<string, unknown>;
}
```

### Reward Tiers (by Ranking Position)

```
Top 5:      1000 XP + 500 tokens + exclusive NFT
Top 10:      500 XP + 250 tokens + badge
Top 25:      250 XP + 100 tokens + badge
Top 50:      100 XP +  50 tokens
Top 100:      50 XP +  25 tokens
```

### Awarding Ranking Rewards

```typescript
import { RewardManager } from '@/lib/rewardSystem';

const rewardMgr = RewardManager.getInstance();

// Award based on final ranking
const rewards = rewardMgr.awardRankingRewards(
  'team_1',       // Entity ID
  'team',         // Entity type
  'Team A',       // Entity name
  3,              // Final rank (top 5!)
  'season_1'      // Season ID
);

// Returns array of rewards:
// [
//   { rewardId: '...', type: 'xp', amount: 1000, ... },
//   { rewardId: '...', type: 'token', amount: 500, ... },
//   { rewardId: '...', type: 'cosmetic_nft', ... }
// ]
```

### Creating Cosmetic NFTs

```typescript
// Define a new cosmetic
const cosmetic = rewardMgr.createCosmeticNFT(
  'Master Aura',              // Name
  'Legendary aura effect',    // Description
  'aura',                     // Type: jersey|badge|border|effect|particles|aura
  'legendary',                // Rarity
  {
    primary: '#FFD700',       // Gold
    secondary: '#FFA500',     // Orange
    accent: '#FFFFFF'         // White
  },
  'season_1',                 // Season
  true                        // Exclusive flag
);

// Returns:
// {
//   cosmeticId: 'cosmetic_1704067200000',
//   name: 'Master Aura',
//   type: 'aura',
//   rarity: 'legendary',
//   colors: { ... },
//   season: 'season_1',
//   exclusive: true,
//   mintedDate: 1704067200000
// }
```

### Managing Inventory

```typescript
// Get player's cosmetics
const inventory = rewardMgr.getInventory('team_1');
// Returns: CosmeticNFT[]

// Add cosmetic to inventory
rewardMgr.addToInventory('team_1', cosmetic.cosmeticId);

// Get all cosmetics in system
const allCosmetics = rewardMgr.getAllCosmetics();
```

### NFT Metadata Generation (ERC-721)

```typescript
// Generate blockchain-ready metadata
const metadata = rewardMgr.generateCosmeticMetadata(
  cosmetic.cosmeticId,
  'team_1'
);

// Returns:
// {
//   name: 'Master Aura',
//   description: 'Legendary aura effect',
//   image: 'ipfs://...',
//   attributes: [
//     { trait_type: 'Type', value: 'aura' },
//     { trait_type: 'Rarity', value: 'legendary' },
//     { trait_type: 'Season', value: 'season_1' }
//   ],
//   properties: { ... }
// }
```

### Reward Claims

```typescript
// Get pending rewards
const pending = rewardMgr.getPendingClaims('team_1');

// Claim a reward (moves to inventory if cosmetic)
const claimed = rewardMgr.claimReward(claim.claimId);

// Get historical claimed rewards
const claimed = rewardMgr.getClaimedRewards('team_1');

// Get total season rewards
const total = rewardMgr.getTotalSeasonRewards('team_1', 'season_1');
// {
//   totalXP: 1500,
//   totalTokens: 750,
//   totalCosmetics: 3,
//   claims: [...]
// }
```

### Tier-Up Rewards

```typescript
// Award when player promotes to new tier
const tierReward = rewardMgr.awardTierUpRewards(
  'player_1',
  'player',
  'Player A',
  'legendary',       // New tier
  'season_1'
);

// Returns: Reward for tier promotion (cosmetic + tokens)
```

### Challenge Rewards

```typescript
// Award on challenge completion
const challengeReward = rewardMgr.awardChallengeReward(
  'challenge_daily_1',
  'player_1',
  'player',
  'Player A',
  'easy',           // Difficulty
  'season_1'
);

// Returns: Reward (XP + tokens based on difficulty)
```

---

## Challenge System

### Challenge Types

```typescript
interface Challenge {
  challengeId: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';        // Lifetime
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'wins' | 'goals' | 'assists' | 'rating' | 'clean_sheets' | 'variety' | 'consistency';
  target: number;                   // Goal to achieve
  reward: { xp: number; tokens: number };
  season?: string;
  createdDate: number;
}
```

### Creating Challenges

```typescript
import { ChallengeManager } from '@/lib/challengeSystem';

const challengeMgr = ChallengeManager.getInstance();

const challenge = challengeMgr.createChallenge(
  'Hat-trick',                      // Title
  'Score 3 goals in a match',      // Description
  'daily',                          // Type
  'hard',                           // Difficulty
  'goals',                          // Category
  3,                                // Target
  200,                              // XP reward
  50,                               // Token reward
  'season_1'                        // Season
);
```

### Assigning Challenges to Players

```typescript
// Assign challenge to player
const progress = challengeMgr.assignChallenge(
  'challenge_hat_trick',
  'player_1',
  'player',
  'Player A',
  'season_1'
);

// Progress starts at 0
// { progressId: '...', currentProgress: 0, targetProgress: 3, completed: false, ... }
```

### Updating Progress

```typescript
// Player scores a goal
challengeMgr.updateProgress('prog_challenge_1_player_1', 1);

// Progress: 1/3

// Player scores another goal
challengeMgr.updateProgress('prog_challenge_1_player_1', 1);

// Progress: 2/3

// Player scores hat-trick!
challengeMgr.updateProgress('prog_challenge_1_player_1', 1);

// Progress: 3/3 ✓ COMPLETED
```

### Claiming Challenge Rewards

```typescript
// Player claims the reward
const claimed = challengeMgr.claimChallenge('prog_challenge_1_player_1');

// Challenge is now claimed
// Integrate with RewardManager to add XP/tokens
```

### Querying Challenges

```typescript
// Get challenge
const challenge = challengeMgr.getChallenge('challenge_hat_trick');

// Get all challenges
const all = challengeMgr.getAllChallenges();

// Get active challenges for season
const active = challengeMgr.getActiveChallenges('season_1', 'daily');

// Get player's active challenges
const playerActive = challengeMgr.getActiveChallengesForPlayer(
  'player_1',
  'season_1',
  'daily'
);

// Get player's completed challenges
const completed = challengeMgr.getCompletedChallenges('player_1', 'season_1');

// Get claimable rewards
const claimable = challengeMgr.getClaimableChallenges('player_1', 'season_1');
```

### Challenge Statistics

```typescript
// Get player completion stats
const stats = challengeMgr.getCompletionStats('player_1', 'season_1');

// Returns:
// {
//   totalCompleted: 45,
//   dailyCompleted: 30,
//   weeklyCompleted: 15,
//   totalRewards: { xp: 5000, tokens: 1000 },
//   streakDays: 7
// }
```

### Challenge Leaderboard

```typescript
// Get top challenge completers
const leaderboard = challengeMgr.getCompletionLeaderboard(
  'season_1',
  'daily',          // Optional: filter by type
  50                // Limit
);

// Returns:
// [
//   {
//     entityId: 'player_1',
//     entityName: 'Player A',
//     completions: 45,
//     totalRewards: { xp: 5000, tokens: 1000 }
//   },
//   ...
// ]
```

### Default Challenges

The system comes with 8 pre-configured challenges:

**Daily:**
- First Win (1 win) - 50 XP, 10 tokens
- Hat-trick (3 goals) - 200 XP, 50 tokens
- Playmaker (2 assists) - 100 XP, 25 tokens
- Rating Master (8.5+ rating) - 100 XP, 25 tokens

**Weekly:**
- Week Warrior (5 wins) - 500 XP, 100 tokens
- Goal Scorer (10 goals) - 400 XP, 80 tokens
- Goal Keeper (3 clean sheets) - 500 XP, 100 tokens
- Consistency King (7 matches @ 7+ rating) - 600 XP, 150 tokens

---

## React Components

### RewardsAndChallenges Component

```typescript
import { RewardsAndChallenges } from '@/components/RewardsAndChallenges';

export function MyPage() {
  return (
    <RewardsAndChallenges
      entityId="team_1"
      entityType="team"
      entityName="Team A"
      season="season_1"
    />
  );
}
```

### Component Features

- **Rewards Tab**
  - Display pending rewards with claim buttons
  - Show claimed rewards history
  - Display cosmetic inventory (up to 8 shown)

- **Challenges Tab**
  - Separate daily and weekly sections
  - Progress bars for each challenge
  - Reward breakdown (XP + tokens)
  - Mark progress buttons
  - Completion indicator

- **Header**
  - Total completions counter
  - Current streak display
  - Flame icon for streaks

### Customization

```typescript
// Override default refresh interval (5 seconds)
// Edit the useEffect in RewardsAndChallenges.tsx

// Change colors by modifying Tailwind classes:
// - Blue for daily challenges
// - Indigo for weekly challenges
// - Yellow for pending rewards
// - Green for completed items

// Adjust grid layout for cosmetics:
// md:grid-cols-4 -> md:grid-cols-3 for 3 per row
```

---

## Integration Examples

### Full Season Workflow

```typescript
import { SeasonManager } from '@/lib/seasonManagement';
import { RewardManager } from '@/lib/rewardSystem';
import { ChallengeManager } from '@/lib/challengeSystem';
import { ProgressionManager } from '@/lib/progressionSystem';

// 1. Create and activate season
const seasonMgr = SeasonManager.getInstance();
const season = seasonMgr.createSeason(2, 'Spring 2026', 'spring', {
  resetLevel: false,
  resetTier: false,
  preserveXP: true,
  preserveXPPercentage: 15,
  resetMatches: true,
  preserveBadges: true,
  resetStreak: true,
});
seasonMgr.activateSeason(season.seasonId);

// 2. Create challenges for season
const challengeMgr = ChallengeManager.getInstance();
const dailyWins = challengeMgr.createChallenge(
  'Daily Grind',
  'Win 3 matches',
  'daily',
  'medium',
  'wins',
  3,
  150,
  30,
  season.seasonId
);

// 3. Assign challenges to players
const progressMgr = challengeMgr.assignChallenge(
  dailyWins.challengeId,
  'team_1',
  'team',
  'Team A',
  season.seasonId
);

// 4. During season: Update progress
// When Team A wins a match
challengeMgr.updateProgress(progressMgr!.progressId, 1);

// 5. End season: Create snapshots
seasonMgr.takeSnapshot(season.seasonId, 'team_1', 'team', 'Team A');

// 6. Award ranking rewards
const rewardMgr = RewardManager.getInstance();
const rewards = rewardMgr.awardRankingRewards(
  'team_1',
  'team',
  'Team A',
  7,  // Finished 7th
  season.seasonId
);

// 7. Execute reset
const result = seasonMgr.executeSeasonReset(season.seasonId);
```

### Match Result Integration

```typescript
// In your match completion handler

function completeMatch(matchId: string, results: MatchResult) {
  // ... existing match completion logic ...

  const challengeMgr = ChallengeManager.getInstance();
  const rewardMgr = RewardManager.getInstance();

  // Update challenge progress based on match results
  const challenges = challengeMgr.getActiveChallengesForPlayer(
    results.winnerTeamId,
    getCurrentSeason(),
    'daily'
  );

  for (const progress of challenges) {
    const challenge = challengeMgr.getChallenge(progress.challengeId);

    if (challenge?.category === 'wins') {
      challengeMgr.updateProgress(progress.progressId, 1);
    }
    if (challenge?.category === 'goals' && results.goalsScored) {
      challengeMgr.updateProgress(progress.progressId, results.goalsScored);
    }
    if (challenge?.category === 'rating' && results.rating >= 8.5) {
      challengeMgr.updateProgress(progress.progressId, 1);
    }
  }

  // Check if any challenges were completed
  const completed = challengeMgr.getClaimableChallenges(
    results.winnerTeamId,
    getCurrentSeason()
  );

  if (completed.length > 0) {
    // Notify user about claimable rewards
    showNotification(`${completed.length} challenges completed!`);
  }
}
```

---

## Data Persistence

All three systems use localStorage for automatic persistence:

```
localStorage['season_management']  - SeasonManager data
localStorage['reward_system']      - RewardManager data
localStorage['challenge_system']   - ChallengeManager data
```

Data is auto-saved on every write operation. No manual save required.

---

## Performance Considerations

- **Challenge Updates**: Use batching when updating multiple challenge progresses
- **Reward Claims**: Claim rewards in bulk to reduce storage writes
- **Leaderboards**: Cache results and invalidate on specific events
- **Cosmetic Metadata**: Generate metadata on-demand, don't pre-generate for all cosmetics

---

## Future Enhancements

- [x] Season reset with flexible rules
- [x] Ranking-based reward distribution
- [x] Cosmetic NFT system with ERC-721 metadata
- [x] Daily/weekly challenges with tracking
- [ ] Challenge seasons (seasonal rotations)
- [ ] Reward burning/crafting system
- [ ] Social sharing for achievements
- [ ] Challenge guides and tutorials
- [ ] Seasonal cosmetic drops
- [ ] Achievement badges (separate from cosmetics)

