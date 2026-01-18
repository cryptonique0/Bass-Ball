# Seasonal Rankings, Team Ownership & Customization - Quick Reference

**Quick Links**: [Full Docs](./SEASONAL_RANKINGS_OWNERSHIP_CUSTOMIZATION.md) | [Seasonal NFTs](#seasonal-rankings-nfts) | [Team Ownership](#team-ownership-nfts) | [Customization](#team-customization)

---

## Seasonal Ranking NFTs

### Create & Award

```typescript
import { SeasonalRankingNFTManager } from './lib/seasonalRankingNFT';

const mgr = SeasonalRankingNFTManager.getInstance();

// Create season
mgr.createSeason({
  seasonId: 'season_2026_winter',
  seasonName: 'Winter 2026',
  startDate: Date.now(),
  endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
  isActive: true,
  totalParticipants: 0,
  pointsPerGoal: 5,
  pointsPerAssist: 3,
  pointsPerWin: 10,
  pointsPerDraw: 3,
});

// Award ranking
const nft = mgr.awardSeasonalRankingNFT(
  'player_1',
  'Player Name',
  'Team Name',
  'season_2026_winter',
  {
    finalRank: 3,           // → Gold badge
    totalPoints: 2450,
    matchesPlayed: 38,
    goalsScored: 42,
    assists: 18,
    averageRating: 8.7,
  },
  'owner_wallet',
  'platform'
);
```

### Get Leaderboard

```typescript
// All players
const board = mgr.getSeasonLeaderboard('season_2026_winter');

// By badge
const gold = mgr.getTopPlayersByBadge('season_2026_winter', 'gold');

// Player's history
const history = mgr.getPlayerSeasonalNFTs('player_1');
```

### Badge Mapping

```
Rank 1-5      → Platinum 🥇
Rank 6-25     → Gold 🥇
Rank 26-100   → Silver 🥈
Rank 101-500  → Bronze 🥉
Rank 501+     → Participant 🎖️
```

### Metadata

```typescript
const metadata = mgr.generateMetadata(nft);
// Generates ERC-721 standard metadata for blockchain
```

---

## Team Ownership NFTs

### Issue & Transfer

```typescript
import { TeamOwnershipNFTManager } from './lib/teamOwnershipNFT';

const mgr = TeamOwnershipNFTManager.getInstance();

// Issue ownership
const nft = mgr.issueTeamOwnershipNFT(
  'team_id',
  'Team Name',
  'City',
  30,                      // 30% → Major tier
  'owner_wallet',
  'platform'
);

// Transfer
const transferred = mgr.transferOwnership(
  tokenId,
  'from_owner',
  'to_owner',
  'tx_hash'
);
```

### Tier System

```
50-100% → Founder    ✅ Voting, 100% revenue, 100 tickets
20-49%  → Major      ✅ Voting, 20-49% revenue, 50 tickets
5-19%   → Minor      ❌ No voting, 5-19% revenue, 20 tickets
1-4%    → Supporter  ❌ No voting, 1-4% revenue, 5 tickets
```

### Queries

```typescript
// Get teams owned
const teams = mgr.getOwnerTeams('owner_wallet');

// Voting distribution
const voting = mgr.getTeamVotingPower('team_id');

// Update stats
mgr.updateTeamStats('team_id', {
  totalMatches: 38,
  wins: 24,
  draws: 7,
  losses: 7,
});
```

---

## Team Customization

### Create & Customize

```typescript
import { TeamCustomizationManager } from './lib/teamCustomization';

const mgr = TeamCustomizationManager.getInstance();

// Create
const custom = mgr.getTeamCustomization('team_id');

// Or create if doesn't exist
createTeamCustomization('team_id', 'Team Name', '#FF6B1A', '#000000', 'owner');
```

### Jersey Colors

```typescript
// Apply preset
mgr.applyJerseyPreset('team_id', 'real-madrid', 'home', 'owner');

// Or custom colors
mgr.updateJerseyColors('team_id', 'home', {
  primary: '#FFFFFF',
  secondary: '#000000',
  accent: '#FFD700',
  sleeves: '#FFFFFF',
  socks: '#FFFFFF',
}, 'owner');
```

### Available Presets

```
real-madrid       → White/Black
manchester-blue   → Blue/White
barcelona         → Blue/Orange
juventus          → Black/White
milan             → Red/Black
liverpool         → Red/White
```

### Custom Badges

```typescript
// Design options: classic, modern, geometric, heritage, custom
const badge = mgr.createCustomBadge(
  'team_id',
  'modern',                // design
  {
    primary: '#0066FF',
    secondary: '#00CC99',
    accent: '#FFFFFF',
  },
  { teamName: 'Team', subtitle: 'City', year: 2026 },
  'designer_wallet'
);
```

### Team Details

```typescript
mgr.updateTeamDetails('team_id', {
  stadium: 'Stadium Name',
  stadiumImageUrl: 'https://...',
  crest: 'https://...',
  motto: 'Team Motto',
}, 'owner');

// View history
const history = mgr.getCustomizationHistory('team_id');
```

---

## All Methods Reference

### Seasonal Ranking NFT Manager

| Method | Returns |
|--------|---------|
| `createSeason(config)` | `SeasonConfig` |
| `getSeason(seasonId)` | `SeasonConfig \| undefined` |
| `getAllSeasons()` | `SeasonConfig[]` |
| `getCurrentSeason()` | `SeasonConfig \| undefined` |
| `awardSeasonalRankingNFT(...)` | `SeasonalRankingNFT` |
| `getNFT(tokenId)` | `SeasonalRankingNFT \| undefined` |
| `getPlayerSeasonalNFTs(playerId)` | `SeasonalRankingNFT[]` |
| `getPlayerSeasonalNFT(playerId, seasonId)` | `SeasonalRankingNFT \| undefined` |
| `getSeasonalNFTs(seasonId)` | `SeasonalRankingNFT[]` |
| `getNFTsByBadge(badge)` | `SeasonalRankingNFT[]` |
| `getSeasonLeaderboard(seasonId)` | `SeasonalRankingNFT[]` |
| `getTopPlayersByBadge(seasonId, badge)` | `SeasonalRankingNFT[]` |
| `getBadgeStats(seasonId)` | `Record<string, {count, topRank}>` |
| `generateMetadata(nft)` | `Object` |
| `exportNFT(tokenId)` | `string` |
| `getAllNFTs()` | `SeasonalRankingNFT[]` |

### Team Ownership NFT Manager

| Method | Returns |
|--------|---------|
| `issueTeamOwnershipNFT(...)` | `TeamOwnershipNFT` |
| `transferOwnership(tokenId, from, to)` | `TeamOwnershipNFT` |
| `updateTeamStats(teamId, stats)` | `void` |
| `updateOwnershipYears(tokenId, years)` | `TeamOwnershipNFT` |
| `getNFT(tokenId)` | `TeamOwnershipNFT \| undefined` |
| `getTeamOwnershipNFTs(teamId)` | `TeamOwnershipNFT[]` |
| `getTeamCurrentOwner(teamId)` | `TeamOwnershipNFT \| undefined` |
| `getOwnerTeams(owner)` | `TeamOwnershipNFT[]` |
| `getNFTsByTier(tier)` | `TeamOwnershipNFT[]` |
| `getTeamTotalOwnership(teamId)` | `number` |
| `getTeamVotingPower(teamId)` | `Array<{owner, votingPower, percentage}>` |
| `generateMetadata(nft)` | `Object` |
| `exportNFT(tokenId)` | `string` |
| `getAllNFTs()` | `TeamOwnershipNFT[]` |

### Team Customization Manager

| Method | Returns |
|--------|---------|
| `createTeamCustomization(...)` | `TeamCustomization` |
| `updateJerseyColors(teamId, type, colors, by)` | `TeamCustomization` |
| `applyJerseyPreset(teamId, preset, type, by)` | `TeamCustomization` |
| `createCustomBadge(teamId, design, colors, text, by)` | `CustomBadge` |
| `updateTeamColors(teamId, primary, secondary, accent, by)` | `TeamCustomization` |
| `updateTeamDetails(teamId, details, by)` | `TeamCustomization` |
| `getTeamCustomization(teamId)` | `TeamCustomization \| undefined` |
| `getBadge(badgeId)` | `CustomBadge \| undefined` |
| `getTeamBadges(teamId)` | `CustomBadge[]` |
| `getJerseyPresets()` | `Record<string, JerseyColors>` |
| `getBadgeDesigns()` | `Record<string, any>` |
| `validateColor(color)` | `boolean` |
| `getCustomizationHistory(teamId)` | `CustomizationHistory[]` |
| `exportCustomization(teamId)` | `string` |
| `exportBadgeDesign(badgeId)` | `string` |
| `getAllCustomizations()` | `TeamCustomization[]` |
| `getAllBadges()` | `CustomBadge[]` |

---

## Usage Examples

### Example 1: Full Season Award Flow

```typescript
// Create season
const mgr = SeasonalRankingNFTManager.getInstance();
mgr.createSeason({ seasonId: 's1', seasonName: 'Winter 2026', ... });

// Award top player
mgr.awardSeasonalRankingNFT('p1', 'Messi', 'Miami', 's1', {
  finalRank: 3, totalPoints: 2450, matchesPlayed: 38,
  goalsScored: 42, assists: 18, averageRating: 8.7,
}, 'wallet1', 'platform');

// Get leaderboard
const board = mgr.getSeasonLeaderboard('s1');
board.forEach(nft => console.log(`#${nft.finalRank} ${nft.playerName}`));
```

### Example 2: Team Ownership & Governance

```typescript
const mgr = TeamOwnershipNFTManager.getInstance();

// Owner buys 60%
mgr.issueTeamOwnershipNFT('team1', 'Miami', 'FL', 60, 'wallet1');

// Get voting power
const voting = mgr.getTeamVotingPower('team1');
// [ { owner: 'wallet1', votingPower: 100, percentage: 100 } ]
```

### Example 3: Team Branding

```typescript
const mgr = TeamCustomizationManager.getInstance();

// Create customization
createTeamCustomization('team1', 'Miami United', '#FF6B1A', '#000000', 'owner');

// Apply jersey preset
mgr.applyJerseyPreset('team1', 'manchester-blue', 'home', 'owner');

// Design badge
mgr.createCustomBadge('team1', 'modern', {
  primary: '#0066FF', secondary: '#00CC99', accent: '#FFFFFF'
}, { teamName: 'Miami United' }, 'owner');

// Get all customizations
const custom = mgr.getTeamCustomization('team1');
console.log(custom.jerseyHome.primary);     // '#0066FF' (from preset)
console.log(custom.currentBadge.design);    // 'modern'
```

---

## Storage Keys

```javascript
// localStorage keys used:
'seasonal_ranking_nfts'      // Seasonal ranking data
'team_ownership_nfts'        // Team ownership data
'team_customization'         // Team customization data
```

---

## Common Patterns

### Get a player's complete profile

```typescript
const seasonalMgr = SeasonalRankingNFTManager.getInstance();
const customMgr = TeamCustomizationManager.getInstance();

const playerSeasons = seasonalMgr.getPlayerSeasonalNFTs('player_1');
const teamCustom = customMgr.getTeamCustomization(playerSeasons[0].playerTeam);

console.log('Player seasons:', playerSeasons.map(nft => nft.badge));
console.log('Team colors:', teamCustom.teamColors);
```

### Export all seasonal data

```typescript
const mgr = SeasonalRankingNFTManager.getInstance();
const allNFTs = mgr.getAllNFTs();
const metadata = allNFTs.map(nft => mgr.generateMetadata(nft));
```

### Validate customization

```typescript
const mgr = TeamCustomizationManager.getInstance();
const isValidColor = mgr.validateColor('#FF6B1A'); // true
const isInvalidColor = mgr.validateColor('red');   // false
```

---

**See Full Docs**: [SEASONAL_RANKINGS_OWNERSHIP_CUSTOMIZATION.md](./SEASONAL_RANKINGS_OWNERSHIP_CUSTOMIZATION.md)

**Version**: 1.0
**Date**: January 18, 2026
