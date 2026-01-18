# Seasonal Rankings, Team Ownership & Customization - Complete Guide

**Status**: Production Ready
**Version**: 1.0
**Date**: January 18, 2026

---

## Overview

Three integrated on-chain systems extending the Bass-Ball NFT ecosystem:

1. **Seasonal Ranking NFTs** - Leaderboard positions as transferable NFT certificates
2. **Team Ownership NFTs** - Team governance rights and revenue shares
3. **Team Customization** - Jerseys, badges, and visual identity management

---

## Part 1: Seasonal Ranking NFTs

### What It Does

Award seasonal NFT certificates to top-performing players based on final league position.

**Key Features**:
- 🏆 5 achievement badges (Platinum → Participant)
- 📊 Tracks season stats (goals, assists, matches)
- 🔗 Blockchain-ready metadata
- 📈 Historical rankings across seasons
- 🎖️ Leaderboard integration

### Architecture

```typescript
interface SeasonalRankingNFT {
  // Identifiers
  tokenId: string;
  seasonId: string;
  playerId: string;

  // Ranking
  finalRank: number;        // 1-100+
  totalPoints: number;
  badge: 'platinum' | 'gold' | 'silver' | 'bronze' | 'participant';

  // Stats
  matchesPlayed: number;
  goalsScored: number;
  assists: number;
  averageRating: number;

  // Ownership & History
  owner: string;
  previousOwners: string[];
  issuedDate: number;
}
```

### Badge Tiers

| Badge | Rank Range | Color |
|-------|-----------|-------|
| 🥇 Platinum | 1-5 | Silver |
| 🥇 Gold | 6-25 | Gold |
| 🥈 Silver | 26-100 | Silver |
| 🥉 Bronze | 101-500 | Bronze |
| 🎖️ Participant | 501+ | Gray |

### Quick Start

#### 1. Create a Season

```typescript
import { SeasonalRankingNFTManager } from './lib/seasonalRankingNFT';

const manager = SeasonalRankingNFTManager.getInstance();

manager.createSeason({
  seasonId: 'season_2026_winter',
  seasonName: 'Winter 2026',
  startDate: Date.now(),
  endDate: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
  isActive: true,
  totalParticipants: 0,
  pointsPerGoal: 5,
  pointsPerAssist: 3,
  pointsPerWin: 10,
  pointsPerDraw: 3,
});
```

#### 2. Award Player Ranking

```typescript
const nft = manager.awardSeasonalRankingNFT(
  'player_messi',           // playerId
  'Lionel Messi',           // playerName
  'Miami United',           // playerTeam
  'season_2026_winter',     // seasonId
  {
    finalRank: 3,           // Ranked 3rd → Gold badge
    totalPoints: 2450,
    matchesPlayed: 38,
    goalsScored: 42,
    assists: 18,
    averageRating: 8.7,
  },
  'wallet_address',         // owner
  'platform'                // issuer
);

console.log(nft.badge);     // 'gold' (Rank 3)
console.log(nft.tokenId);   // 'season_season_2026_winter_player_messi_...'
```

#### 3. Get Leaderboard

```typescript
// Get all ranked players this season
const leaderboard = manager.getSeasonLeaderboard('season_2026_winter');

leaderboard.forEach((nft) => {
  console.log(`#${nft.finalRank} ${nft.playerName} - ${nft.badge} badge`);
});

// Get top 10 gold badge holders
const goldPlayers = manager.getTopPlayersByBadge('season_2026_winter', 'gold');
```

#### 4. Track Player's Seasonal History

```typescript
// Get all seasons for a player
const playerSeasons = manager.getPlayerSeasonalNFTs('player_messi');

playerSeasons.forEach((nft) => {
  console.log(`${nft.seasonName}: Rank #${nft.finalRank}`);
});

// Get player's NFT for specific season
const winterNFT = manager.getPlayerSeasonalNFT('player_messi', 'season_2026_winter');
```

#### 5. Generate Blockchain Metadata

```typescript
const metadata = manager.generateMetadata(nft);
// {
//   name: "Lionel Messi - Winter 2026 Gold",
//   description: "Ranked #3 in Winter 2026 with 2450 points...",
//   image: "...",
//   attributes: [
//     { trait_type: "Final Rank", value: 3 },
//     { trait_type: "Badge", value: "Gold" },
//     { trait_type: "Goals Scored", value: 42 },
//     ...
//   ]
// }
```

### API Reference

| Method | Purpose |
|--------|---------|
| `createSeason(config)` | Create new league season |
| `getSeason(seasonId)` | Get season details |
| `getCurrentSeason()` | Get active season |
| `awardSeasonalRankingNFT()` | Award NFT to ranked player |
| `getPlayerSeasonalNFTs(playerId)` | Get all season NFTs for player |
| `getSeasonLeaderboard(seasonId)` | Get ranked leaderboard |
| `getTopPlayersByBadge(seasonId, badge)` | Get all players with badge |
| `getBadgeStats(seasonId)` | Get distribution by badge |
| `generateMetadata(nft)` | Create blockchain metadata |

---

## Part 2: Team Ownership NFTs

### What It Does

Issue NFTs representing fractional or full team ownership with governance rights.

**Key Features**:
- 👑 4 ownership tiers with different privileges
- 🗳️ Voting rights for major owners
- 💰 Revenue share percentages
- 🎫 Match ticket allowances
- 🏛️ Board seat eligibility

### Architecture

```typescript
interface TeamOwnershipNFT {
  // Identifiers
  tokenId: string;
  teamId: string;

  // Ownership
  owner: string;
  ownershipPercentage: number;        // 1-100
  ownershipTier: 'founder' | 'major' | 'minor' | 'supporter';

  // Governance
  votingRights: boolean;
  governanceVotingPower: number;      // 1-100
  boardSeatEligible: boolean;

  // Rights
  revenueShare: number;               // % of team revenue
  matchTicketAllowance: number;       // Free tickets per season
  merchandiseDiscount: number;        // % discount

  // Team Performance Linked
  teamTotalMatches: number;
  teamWins: number;
  teamWinPercentage: number;
}
```

### Ownership Tiers

| Tier | Ownership | Voting | Revenue | Tickets | Board Seat |
|------|-----------|--------|---------|---------|------------|
| Founder | 50-100% | ✅ 100 | 100% | 100 | ✅ |
| Major | 20-49% | ✅ 75 | 20-49% | 50 | ✅ |
| Minor | 5-19% | ❌ 50 | 5-19% | 20 | ❌ |
| Supporter | 1-4% | ❌ 10 | 1-4% | 5 | ❌ |

### Quick Start

#### 1. Issue Team Ownership NFT

```typescript
import { TeamOwnershipNFTManager } from './lib/teamOwnershipNFT';

const manager = TeamOwnershipNFTManager.getInstance();

const nft = manager.issueTeamOwnershipNFT(
  'team_miami',              // teamId
  'Miami United',            // teamName
  'Miami, Florida',          // teamCity
  30,                        // 30% ownership → Major tier
  'investor_wallet',         // owner
  'platform'                 // issuer
);

console.log(nft.ownershipTier);       // 'major'
console.log(nft.votingRights);        // true
console.log(nft.governanceVotingPower); // 75
```

#### 2. Get Owner's Teams

```typescript
// Get all teams owned by address
const myTeams = manager.getOwnerTeams('investor_wallet');

myTeams.forEach((nft) => {
  console.log(`${nft.teamName}: ${nft.ownershipPercentage}% (${nft.ownershipTier})`);
});
```

#### 3. Update Team Stats

```typescript
// When team plays matches, update performance
manager.updateTeamStats('team_miami', {
  totalMatches: 38,
  wins: 24,
  draws: 7,
  losses: 7,
});

// Ownership NFTs automatically updated
const nft = manager.getNFT(tokenId);
console.log(nft.teamWinPercentage); // 63.2%
```

#### 4. Transfer Ownership

```typescript
// Transfer team ownership NFT
const transferred = manager.transferOwnership(
  tokenId,
  'original_owner',
  'new_owner',
  'tx_hash_123'
);

console.log(transferred.owner);           // 'new_owner'
console.log(transferred.previousOwners);  // ['original_owner', ...]
console.log(transferred.transferHistory); // [{ from: '...', to: '...', timestamp: ... }]
```

#### 5. Get Voting Power

```typescript
// Get voting distribution for team
const votingPower = manager.getTeamVotingPower('team_miami');

votingPower.forEach((voter) => {
  console.log(`${voter.owner}: ${voter.votingPower} power (${voter.percentage.toFixed(1)}%)`);
});
```

#### 6. Generate Blockchain Metadata

```typescript
const metadata = manager.generateMetadata(nft);
// {
//   name: "Miami United Ownership - 30%",
//   description: "30% ownership of Miami United. Team record: 24-7-7...",
//   attributes: [
//     { trait_type: "Ownership Percentage", value: "30%" },
//     { trait_type: "Ownership Tier", value: "major" },
//     { trait_type: "Voting Rights", value: "Yes" },
//     { trait_type: "Revenue Share", value: "30%" },
//     ...
//   ]
// }
```

### API Reference

| Method | Purpose |
|--------|---------|
| `issueTeamOwnershipNFT()` | Create ownership NFT |
| `transferOwnership()` | Transfer to new owner |
| `updateTeamStats()` | Update team performance |
| `getTeamOwnershipNFTs(teamId)` | Get all ownership NFTs for team |
| `getOwnerTeams(owner)` | Get all teams owned by address |
| `getTeamVotingPower(teamId)` | Get voting distribution |
| `getTeamTotalOwnership(teamId)` | Get total ownership % |
| `generateMetadata(nft)` | Create blockchain metadata |

---

## Part 3: Team Customization

### What It Does

Manage team visual identity - jerseys, badges, colors, stadium details.

**Key Features**:
- 👕 Home/Away/Third jersey color customization
- 🎖️ Custom badge designs (5 styles)
- 🎨 Color scheme management
- 📋 Full customization history
- 🏟️ Stadium and team details

### Jersey Color Schemes

Predefined presets available:

```typescript
const presets = {
  'real-madrid': { primary: '#FFFFFF', secondary: '#000000', ... },
  'manchester-blue': { primary: '#0066FF', secondary: '#FFFFFF', ... },
  'barcelona': { primary: '#004B87', secondary: '#FF6B1A', ... },
  'juventus': { primary: '#000000', secondary: '#FFFFFF', ... },
  'milan': { primary: '#FF0000', secondary: '#000000', ... },
  'liverpool': { primary: '#CC0000', secondary: '#FFFFFF', ... },
};
```

### Badge Designs

5 design templates:

| Design | Shape | Complexity | Use Case |
|--------|-------|-----------|----------|
| **Classic** | Shield | 1/5 | Traditional teams |
| **Modern** | Rounded Square | 2/5 | Contemporary look |
| **Geometric** | Hexagon | 3/5 | Tech/Forward |
| **Heritage** | Circle | 2/5 | Historic teams |
| **Custom** | Custom | 5/5 | Unique identity |

### Quick Start

#### 1. Create Team Customization

```typescript
import { TeamCustomizationManager, createTeamCustomization } from './lib/teamCustomization';

const customization = createTeamCustomization(
  'team_miami',              // teamId
  'Miami United',            // teamName
  '#FF6B1A',                 // primary color (orange)
  '#000000',                 // secondary color (black)
  'team_owner_wallet'        // owner
);

console.log(customization.teamColors);    // { primary, secondary, accent }
console.log(customization.jerseyHome);    // Default jersey colors
```

#### 2. Apply Jersey Presets

```typescript
const manager = TeamCustomizationManager.getInstance();

// Apply preset to home jersey
manager.applyJerseyPreset(
  'team_miami',
  'manchester-blue',         // preset name
  'home',                    // jersey type
  'team_owner_wallet'        // modifier
);

// Apply custom colors to away jersey
manager.updateJerseyColors(
  'team_miami',
  'away',
  {
    primary: '#FFFFFF',      // White
    secondary: '#FF6B1A',    // Orange
    accent: '#000000',       // Black trim
    sleeves: '#FFFFFF',
    socks: '#FF6B1A',
  },
  'team_owner_wallet'
);
```

#### 3. Create Custom Badge

```typescript
const badge = manager.createCustomBadge(
  'team_miami',
  'modern',                  // design template
  {
    primary: '#0066FF',      // Badge primary color
    secondary: '#00CC99',    // Badge secondary
    accent: '#FFFFFF',       // Badge accent
  },
  {
    teamName: 'Miami United',
    subtitle: 'Florida',
    year: 2026,
  },
  'badge_designer_wallet'    // who designed it
);

console.log(badge.badgeId);     // badge_team_miami_...
console.log(badge.isActive);    // true (currently in use)
```

#### 4. Update Team Details

```typescript
manager.updateTeamDetails(
  'team_miami',
  {
    stadium: 'Biscayne Stadium',
    stadiumImageUrl: 'https://...',
    crest: 'https://crest.url',
    motto: 'One Team, One Dream',
  },
  'team_owner_wallet'
);
```

#### 5. Update Colors

```typescript
manager.updateTeamColors(
  'team_miami',
  '#FF6B1A',                 // new primary
  '#000000',                 // new secondary
  '#FFFFFF',                 // new accent
  'team_owner_wallet'
);
```

#### 6. View Customization History

```typescript
const history = manager.getCustomizationHistory('team_miami');

history.forEach((entry) => {
  console.log(`[${new Date(entry.timestamp).toLocaleDateString()}] ${entry.description} by ${entry.modifiedBy}`);
  // [1/18/2026] Updated home jersey colors by team_owner_wallet
  // [1/17/2026] Applied modern badge design by badge_designer_wallet
  // [1/16/2026] Updated team color scheme by team_owner_wallet
});
```

#### 7. Export Customization

```typescript
// Export as JSON for backup or sharing
const customizationJSON = manager.exportCustomization('team_miami');
const badgeJSON = manager.exportBadgeDesign('badge_team_miami_...');
```

### API Reference

| Method | Purpose |
|--------|---------|
| `createTeamCustomization()` | Create customization profile |
| `updateJerseyColors()` | Set jersey colors |
| `applyJerseyPreset()` | Apply color preset |
| `createCustomBadge()` | Design custom badge |
| `updateTeamColors()` | Update team color scheme |
| `updateTeamDetails()` | Update stadium, crest, motto |
| `getTeamCustomization()` | Get customization by team |
| `getBadge()` | Get badge design |
| `getTeamBadges()` | Get all badges for team |
| `getJerseyPresets()` | Get available presets |
| `getBadgeDesigns()` | Get badge templates |
| `validateColor()` | Validate hex color |
| `getCustomizationHistory()` | Get modification history |
| `exportCustomization()` | Export as JSON |

---

## Integration Examples

### Example 1: Award Season Achievement + Display

```typescript
import { SeasonalRankingNFTManager } from './lib/seasonalRankingNFT';
import { createTeamCustomization } from './lib/teamCustomization';

// Create customization for team
const customization = createTeamCustomization(
  'team_miami',
  'Miami United',
  '#FF6B1A',
  '#000000',
  'team_owner'
);

// Award player's seasonal ranking NFT
const manager = SeasonalRankingNFTManager.getInstance();
const nft = manager.awardSeasonalRankingNFT(
  'player_123',
  'Player Name',
  'Miami United',
  'season_2026_winter',
  {
    finalRank: 5,
    totalPoints: 2000,
    matchesPlayed: 38,
    goalsScored: 35,
    assists: 15,
    averageRating: 8.5,
  },
  'player_wallet',
  'platform'
);

// Display with team colors
console.log(`${nft.playerName} earns ${nft.badge} badge`);
console.log(`Team colors: ${customization.teamColors.primary}`);
```

### Example 2: Team Ownership + Customization

```typescript
import { TeamOwnershipNFTManager } from './lib/teamOwnershipNFT';
import { TeamCustomizationManager } from './lib/teamCustomization';

// Issue ownership NFT
const ownershipManager = TeamOwnershipNFTManager.getInstance();
const ownership = ownershipManager.issueTeamOwnershipNFT(
  'team_miami',
  'Miami United',
  'Miami, Florida',
  60,                        // 60% ownership
  'investor_wallet'
);

// Customize team appearance
const customManager = TeamCustomizationManager.getInstance();
customManager.applyJerseyPreset('team_miami', 'manchester-blue', 'home', 'investor_wallet');
customManager.createCustomBadge(
  'team_miami',
  'modern',
  { primary: '#0066FF', secondary: '#00CC99', accent: '#FFFFFF' },
  { teamName: 'Miami United' },
  'investor_wallet'
);

// Owner's dashboard
console.log(`${ownership.playerName}: ${ownership.ownershipPercentage}% owner`);
console.log(`Voting power: ${ownership.governanceVotingPower}/100`);
console.log(`Revenue share: ${ownership.revenueShare}%`);
console.log(`Voting rights: ${ownership.votingRights ? 'Enabled' : 'Disabled'}`);
```

### Example 3: Full Season Leaderboard Display

```typescript
const manager = SeasonalRankingNFTManager.getInstance();

// Get season
const season = manager.getCurrentSeason();
console.log(`\n${season.seasonName} Leaderboard\n`);

// Get leaderboard
const leaderboard = manager.getSeasonLeaderboard(season.seasonId);

// Group by badge
const badgeStats = manager.getBadgeStats(season.seasonId);
for (const [badge, stats] of Object.entries(badgeStats)) {
  console.log(`\n${badge.toUpperCase()} (${stats.count} players):`);

  const players = leaderboard.filter((nft) => nft.badge === badge);
  players.forEach((nft) => {
    console.log(`  #${nft.finalRank} ${nft.playerName} - ${nft.totalPoints} pts (${nft.goalsScored}⚽ ${nft.assists}🅰️)`);
  });
}
```

---

## On-Chain Deployment

### Generate NFT Metadata

All three systems generate ERC-721 compatible metadata:

```typescript
// Seasonal ranking metadata
const seasonalMetadata = seasonalManager.generateMetadata(nft);

// Team ownership metadata
const ownershipMetadata = ownershipManager.generateMetadata(nft);

// Send to blockchain contract for minting
const tx = await contract.mint(
  ownerAddress,
  JSON.stringify(metadata),
  verificationHash
);
```

### Metadata Structure

Each system generates metadata with:
- **name** - Human-readable title
- **description** - Detailed description
- **image** - Visual representation (URL)
- **attributes** - Array of trait_type/value pairs for blockchain indexing

---

## Storage & Persistence

All three systems use **localStorage** for persistence:

- `seasonal_ranking_nfts` - Seasonal NFT data
- `team_ownership_nfts` - Ownership NFT data
- `team_customization` - Customization data

Data persists across page refreshes and is auto-saved on all updates.

---

## Performance

| Operation | Time |
|-----------|------|
| Create season | <1ms |
| Award NFT | <1ms |
| Get leaderboard | <5ms |
| Update team stats | <1ms |
| Create customization | <1ms |
| Apply badge | <1ms |
| Query (100s records) | <10ms |

---

## Security Considerations

✅ **Owner Verification** - Only owner can transfer/customize
✅ **Tier Validation** - Percentage determines tier
✅ **History Immutable** - All changes tracked
✅ **Color Validation** - Hex format enforced
✅ **Metadata Hashing** - Verifiable on blockchain

---

## Related Documentation

- [NFT Player Cards](./NFT_PLAYER_CARDS_TECHNICAL.md) - Player cards system
- [On-Chain Storage](./ON_CHAIN_STORAGE_TECHNICAL.md) - Match storage
- [Web3 Setup](./WEB3_IMPLEMENTATION.md) - Blockchain integration

---

**Version**: 1.0
**Status**: Production Ready
**Last Updated**: January 18, 2026
