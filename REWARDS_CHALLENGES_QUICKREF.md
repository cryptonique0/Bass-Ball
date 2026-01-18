# Rewards & Challenges - Quick Reference

## Quick Start

### Import Managers
```typescript
import { SeasonManager } from '@/lib/seasonManagement';
import { RewardManager } from '@/lib/rewardSystem';
import { ChallengeManager } from '@/lib/challengeSystem';
import { RewardsAndChallenges } from '@/components/RewardsAndChallenges';
```

### Use in Components
```typescript
<RewardsAndChallenges
  entityId="team_1"
  entityType="team"
  entityName="Team A"
  season="season_1"
/>
```

---

## Season Management Cheat Sheet

| Operation | Code |
|-----------|------|
| **Create Season** | `seasonMgr.createSeason(1, 'Winter', 'theme', resetRules)` |
| **Start Season** | `seasonMgr.activateSeason('season_1')` |
| **Archive Stats** | `seasonMgr.takeSnapshot('season_1', 'team_1', 'team', 'Team A')` |
| **Reset Season** | `seasonMgr.executeSeasonReset('season_1')` |
| **Get Snapshots** | `seasonMgr.getSeasonSnapshots('season_1')` |
| **Get Stats** | `seasonMgr.getSeasonStats('season_1')` |
| **Get All Seasons** | `seasonMgr.getAllSeasons()` |

### Reset Rules Object
```typescript
{
  resetLevel: boolean,           // Reset player level?
  resetTier: boolean,            // Reset tier?
  preserveXP: boolean,           // Keep some XP?
  preserveXPPercentage: number,  // Keep X%
  resetMatches: boolean,         // Reset match count?
  preserveBadges: boolean,       // Keep badges?
  resetStreak: boolean           // Reset streaks?
}
```

---

## Reward System Cheat Sheet

| Operation | Code |
|-----------|------|
| **Award by Rank** | `rewardMgr.awardRankingRewards(id, type, name, rank, season)` |
| **Create Cosmetic** | `rewardMgr.createCosmeticNFT(name, desc, type, rarity, colors, season, exclusive)` |
| **Add to Inventory** | `rewardMgr.addToInventory(entityId, cosmeticId)` |
| **Get Inventory** | `rewardMgr.getInventory(entityId)` |
| **Tier-Up Reward** | `rewardMgr.awardTierUpRewards(id, type, name, newTier, season)` |
| **Challenge Reward** | `rewardMgr.awardChallengeReward(challengeId, id, type, name, difficulty, season)` |
| **Get Pending** | `rewardMgr.getPendingClaims(entityId)` |
| **Claim Reward** | `rewardMgr.claimReward(claimId)` |
| **Get History** | `rewardMgr.getClaimedRewards(entityId)` |
| **NFT Metadata** | `rewardMgr.generateCosmeticMetadata(cosmeticId, entityId)` |

### Reward Tiers (by Rank)
```
Rank 1-5:   1000 XP + 500 tokens + exclusive NFT
Rank 6-10:   500 XP + 250 tokens + badge
Rank 11-25:  250 XP + 100 tokens + badge
Rank 26-50:  100 XP +  50 tokens
Rank 51-100:  50 XP +  25 tokens
```

### Cosmetic Types
- `jersey` - Character/team jersey
- `badge` - Achievement badge
- `border` - Profile border
- `effect` - Visual effect
- `particles` - Particle effect
- `aura` - Aura around character

### Rarity Levels
- `common` - Gray background
- `uncommon` - Green background
- `rare` - Blue background
- `epic` - Purple background
- `legendary` - Gold/Yellow background

---

## Challenge System Cheat Sheet

| Operation | Code |
|-----------|------|
| **Create Challenge** | `challengeMgr.createChallenge(title, desc, type, difficulty, category, target, xp, tokens, season)` |
| **Assign Challenge** | `challengeMgr.assignChallenge(challengeId, entityId, type, name, season)` |
| **Update Progress** | `challengeMgr.updateProgress(progressId, delta)` |
| **Claim Reward** | `challengeMgr.claimChallenge(progressId)` |
| **Get Active** | `challengeMgr.getActiveChallengesForPlayer(entityId, season, type?)` |
| **Get Completed** | `challengeMgr.getCompletedChallenges(entityId, season)` |
| **Get Claimable** | `challengeMgr.getClaimableChallenges(entityId, season)` |
| **Get Stats** | `challengeMgr.getCompletionStats(entityId, season)` |
| **Get Leaderboard** | `challengeMgr.getCompletionLeaderboard(season, type?, limit)` |
| **Get by Category** | `challengeMgr.getChallengesByCategory('wins')` |
| **Get by Difficulty** | `challengeMgr.getChallengesByDifficulty('hard')` |

### Challenge Types
- `daily` - Resets every 24 hours
- `weekly` - Resets every 7 days

### Challenge Difficulties
- `easy` - Basic objectives
- `medium` - Intermediate objectives
- `hard` - Advanced objectives

### Challenge Categories
- `wins` - Match wins
- `goals` - Goals scored
- `assists` - Assists recorded
- `rating` - Player rating
- `clean_sheets` - Matches without goals against
- `variety` - Different opponents/teams
- `consistency` - Multiple matches with requirements

---

## Component Usage Examples

### Basic Setup
```typescript
import { RewardsAndChallenges } from '@/components/RewardsAndChallenges';

export function Dashboard() {
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

### Get Current Season Dynamically
```typescript
import { LeagueManager } from '@/lib/leagueSystem';

export function Dashboard() {
  const leagueMgr = LeagueManager.getInstance();
  const currentSeason = leagueMgr.getCurrentSeason();

  return (
    <RewardsAndChallenges
      entityId="team_1"
      entityType="team"
      entityName="Team A"
      season={currentSeason}
    />
  );
}
```

---

## Integration Patterns

### After Match Completion
```typescript
function onMatchComplete(results: MatchResult) {
  const challengeMgr = ChallengeManager.getInstance();
  
  // Update all active daily challenges
  const challenges = challengeMgr.getActiveChallengesForPlayer(
    results.winnerId,
    currentSeason,
    'daily'
  );

  for (const prog of challenges) {
    const challenge = challengeMgr.getChallenge(prog.challengeId);
    
    if (challenge?.category === 'wins') {
      challengeMgr.updateProgress(prog.progressId, 1);
    }
    if (challenge?.category === 'goals' && results.goals > 0) {
      challengeMgr.updateProgress(prog.progressId, results.goals);
    }
  }
}
```

### End of Season
```typescript
function endSeason(seasonId: string) {
  const seasonMgr = SeasonManager.getInstance();
  const rewardMgr = RewardManager.getInstance();

  // Create snapshots for all teams
  const teams = getActiveDreamTeams();
  for (const team of teams) {
    seasonMgr.takeSnapshot(seasonId, team.id, 'team', team.name);
  }

  // Award ranking rewards
  const rankings = getSeasonRankings(seasonId);
  for (const [rank, team] of rankings.entries()) {
    rewardMgr.awardRankingRewards(
      team.id,
      'team',
      team.name,
      rank + 1,  // 1-indexed
      seasonId
    );
  }

  // Execute reset
  seasonMgr.executeSeasonReset(seasonId);
}
```

### Daily Challenge Reset
```typescript
function dailyReset(seasonId: string) {
  const challengeMgr = ChallengeManager.getInstance();
  
  // Expire old daily challenges
  const expired = challengeMgr.resetDailyChallenges(seasonId);
  
  console.log(`Reset ${expired} daily challenges`);

  // Optionally assign new daily challenges
  const dailies = challengeMgr.getAllChallenges('daily');
  const teams = getActiveDreamTeams();

  for (const team of teams) {
    for (const daily of dailies) {
      challengeMgr.assignChallenge(
        daily.challengeId,
        team.id,
        'team',
        team.name,
        seasonId
      );
    }
  }
}
```

---

## Data Model Reference

### Season Config
```typescript
interface SeasonConfig {
  seasonId: string;
  seasonNumber: number;
  seasonName: string;
  theme?: string;
  startDate: number;
  endDate: number;
  status: 'planning' | 'active' | 'ended' | 'archived';
  resetDate?: number;
  resetRules: ResetRules;
}
```

### Challenge Progress
```typescript
interface ChallengeProgress {
  progressId: string;
  challengeId: string;
  entityId: string;
  entityType: 'player' | 'team';
  entityName: string;
  currentProgress: number;
  targetProgress: number;
  completed: boolean;
  completedDate?: number;
  claimed: boolean;
  claimedDate?: number;
  season: string;
  startDate: number;
  expiryDate: number;
}
```

### Reward
```typescript
interface Reward {
  rewardId: string;
  type: 'xp' | 'token' | 'cosmetic_nft' | 'cosmetic' | 'badge';
  amount: number;
  description: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  source: 'season_end' | 'ranking_top10' | 'tier_promotion' | 'challenge';
  metadata?: Record<string, unknown>;
}
```

### Cosmetic NFT
```typescript
interface CosmeticNFT {
  cosmeticId: string;
  name: string;
  description: string;
  type: 'jersey' | 'badge' | 'border' | 'effect' | 'particles' | 'aura';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  colors: { primary: string; secondary: string; accent: string };
  season?: string;
  exclusive: boolean;
  mintedDate: number;
  tokenId?: string;
}
```

---

## Default Cosmetics

The system includes 7 pre-configured cosmetics:

1. **Silver Border** - Uncommon cosmetic border
2. **Gold Border** - Rare cosmetic border
3. **Platinum Border** - Epic cosmetic border
4. **Diamond Aura** - Epic aura effect
5. **Master Aura** - Legendary aura effect
6. **Top 10 Badge** - Gold rare badge
7. **Top 25 Badge** - Silver uncommon badge

---

## Performance Tips

- **Batch Updates**: Call `updateProgress()` multiple times in one function rather than spreading across multiple functions
- **Cache Results**: Cache leaderboard results and invalidate every 5-10 minutes
- **Lazy Load Cosmetics**: Only load cosmetics when viewing inventory
- **Limit History**: Only keep last 30 days of challenge history in active view

---

## Troubleshooting

### Challenge Not Updating
- Check `expiryDate` - challenge may have expired
- Verify `entityId` matches between challenge and progress
- Ensure season ID matches

### Rewards Not Appearing
- Check reward claim status with `getPendingClaims()`
- Verify reward source matches expected reward type
- Check season/entity IDs match

### Cosmetics Not Showing
- Verify cosmetic exists with `getAllCosmetics()`
- Check inventory with `getInventory(entityId)`
- Verify cosmetic was added with `addToInventory()`

### Reset Not Working
- Verify all player snapshots created with `takeSnapshot()`
- Check reset rules are properly configured
- Ensure season status is 'active' before reset

