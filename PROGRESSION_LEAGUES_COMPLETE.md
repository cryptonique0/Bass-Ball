# Progression Systems & Leagues & Divisions
## Complete Implementation Guide

You asked for **Progression Systems** and **Leagues & Divisions**. Here's what you got:

---

## What You Received

### ✅ Complete Progression System (507 lines)
```
lib/progressionSystem.ts
├─ ProgressionManager class with:
│  ├─ XP & leveling system (levels 1-100)
│  ├─ 6-tier ranking (Bronze → Master)
│  ├─ Milestone tracking & achievements
│  ├─ Badge system with rarity levels
│  ├─ Automatic tier promotion
│  └─ localStorage persistence
├─ PlayerProgression interface with 30+ fields
├─ ProgressionMilestone system
├─ ProgressionBadge system
└─ ProgressionTierConfig for customization
```

### ✅ Complete Leagues & Divisions System (520+ lines)
```
lib/leaguesAndDivisions.ts
├─ LeagueManager class with:
│  ├─ Multi-league support
│  ├─ Multi-tier divisions
│  ├─ Automatic standings calculation
│  ├─ Promotion/relegation system
│  ├─ Season management
│  └─ localStorage persistence
├─ League interface
├─ Division interface
├─ DivisionStanding interface
├─ Season tracking
└─ Promotion/Relegation event history
```

### ✅ Production React Components (600+ lines)
```
components/ProgressionAndLeaguesUI.tsx
├─ ProgressBar component
├─ LevelBadge component
├─ AchievementBadge component
├─ ProgressionCard (main display)
├─ ProgressionLeaderboard
├─ DivisionStandings (table with formatting)
└─ LeagueSelector (dropdown/buttons)
```

---

## Quick Start

### 1. Import Managers

```typescript
import { ProgressionManager } from '@/lib/progressionSystem';
import { LeagueManager } from '@/lib/leaguesAndDivisions';

const progMgr = ProgressionManager.getInstance();
const leagueMgr = LeagueManager.getInstance();
```

### 2. Create Player Progression

```typescript
const progression = progMgr.createProgression(
  'player_123',      // Entity ID
  'player',          // Entity type
  'John Smith',      // Name
  'wallet_address'   // Owner
);

// progression starts at Level 1, Bronze tier, 0 XP
```

### 3. Record Match & Award XP

```typescript
// After a match
progMgr.recordMatchResult(progression.progressionId, true, {
  goalsScored: 2,
  assists: 1,
  rating: 8.5
});

// XP awarded: 100 × winning streak multiplier
// Progression checks: Level up? Tier up? Milestones completed?
```

### 4. Create League & Division

```typescript
// Create league
const league = leagueMgr.createLeague(
  'International Football League',
  'Global',
  'owner_wallet',
  'Multi-tier competitive league'
);

// Create divisions
const premierDiv = leagueMgr.createDivision(
  league.leagueId,
  'Premier Division',
  1,              // Tier 1 (top)
  'elite',        // Level
  20,             // Max 20 teams
  2,              // Promote top 2
  2               // Relegate bottom 2
);

const championshipDiv = leagueMgr.createDivision(
  league.leagueId,
  'Championship',
  2,              // Tier 2
  'professional',
  24,
  3,
  3
);
```

### 5. Add Teams to Division

```typescript
leagueMgr.addTeamToDivision(
  premierDiv.divisionId,
  'team_miami',
  'Miami United',
  'team_owner'
);

leagueMgr.addTeamToDivision(
  premierDiv.divisionId,
  'team_boston',
  'Boston City',
  'team_owner'
);
```

### 6. Record Match in Division

```typescript
leagueMgr.recordDivisionMatchResult(
  premierDiv.divisionId,
  'team_miami',    // Home team
  'team_boston',   // Away team
  3,               // Goals scored
  1,               // Goals conceded
  { rating: 8.2, topScorer: 'Player A' },
  { rating: 6.8, topScorer: 'Player B' }
);

// Standings auto-update:
// - Points: 3 for win, 1 for draw, 0 for loss
// - Goal difference calculated
// - Form tracking (last 5 matches)
// - Promotion/relegation odds updated
```

### 7. Get Standings

```typescript
const standings = leagueMgr.getDivisionStandings(premierDiv.divisionId);

// standings = [
//   { position: 1, teamName: 'Miami United', points: 12, ... },
//   { position: 2, teamName: 'Boston City', points: 9, ... },
//   ...
// ]
```

### 8. Check Progression

```typescript
const prog = progMgr.getProgression(progression.progressionId);

console.log(`Level: ${prog.currentLevel}`);           // e.g., 15
console.log(`Tier: ${prog.currentTier}`);             // e.g., 'gold'
console.log(`Total XP: ${prog.totalXP}`);             // e.g., 25,450
console.log(`Win Rate: ${prog.winRate.toFixed(1)}%`); // e.g., 67.3%
console.log(`Badges: ${prog.achievedBadges.length}`); // e.g., 5
```

---

## Progression System Details

### XP & Leveling

```
Level 1:  1,000 XP required
Level 2:  1,100 XP required
Level 3:  1,200 XP required
...
Level 100: 10,900 XP required

Total XP for Level 100: ~560,000 XP
```

**XP Sources:**
- Match win: 100 XP (× win streak multiplier)
- Match loss: 50 XP
- Milestone completion: 500-5,000 XP
- Tier promotion: bonus XP rewards

**Tier Multipliers:**
```
Bronze:     1.0x XP (baseline)
Silver:     1.1x XP
Gold:       1.2x XP
Platinum:   1.35x XP
Diamond:    1.5x XP
Master:     2.0x XP (highest earner!)
```

### Tier System

```
Bronze      Level 1+,    0 XP required
Silver      Level 20+,   5,000 XP required   → Silver badge unlock
Gold        Level 40+,   15,000 XP required  → NFT reward + 100 tokens
Platinum    Level 60+,   30,000 XP required  → NFT reward + 250 tokens
Diamond     Level 80+,   50,000 XP required  → NFT reward + 500 tokens
Master      Level 100+,  75,000 XP required  → NFT reward + 1,000 tokens + aura
```

### Automatic Achievement Badges

**Performance Badges:**
- 🎯 Marksman (25 goals scored)
- 🎪 Playmaker (15 assists)
- ✅ Reliable (50% consistency)

**Milestone Badges:**
- ⭐ Rising Star (50 wins)
- 🏆 Veteran (100 wins)

**Tier Badges:**
- 🥈 Silver Tier (reach Silver)
- 🥇 Gold Tier (reach Gold)
- etc.

### Milestones

Pre-configured milestones (extensible):
```
Wins:       10, 50, 100, 500, 1000
Goals:      25, 100, 500
Assists:    15, 50, 250
Consistency: 50%, 75%, 90%
```

Each milestone awards:
- XP bonus (500-5,000)
- Optional badge unlock
- Tracked in progression.milestonesCompleted

---

## Leagues & Divisions Details

### Division Standings Calculation

**Points Formula:**
```
Points = (Wins × 3) + (Draws × 1) + (Losses × 0)
```

**Standing Sort Order:**
```
1. Points (descending)
2. Goal Difference (descending)
3. Goals For (descending)
4. Team Name (alphabetical)
```

**Form Tracking:**
```
currentForm = ['W', 'L', 'W', 'W', 'D']  // Last 5 matches
Displayed as: WLWWD
```

### Promotion & Relegation

**Automatic Odds Calculation:**
```
Position 1:  90% promotion odds (guaranteed)
Position 2:  80% promotion odds
Position 3:  70% promotion odds
...
Position N-2: 70% relegation odds
Position N-1: 80% relegation odds
Position N:   90% relegation odds (guaranteed)
```

**Execution:**
```typescript
// After season ends, execute:
leagueMgr.executePromotionRelegation(
  seasonId,
  premierDiv.divisionId,
  championshipDiv.divisionId
);

// Teams move:
// - Top 2 from Championship → Premier (stats reset)
// - Bottom 2 from Premier → Championship (stats reset)
```

**Results:**
```
// Promotion event created
{
  eventId: 'promo_season_2026_w1_team_miami',
  season: 'season_2026_w1',
  date: 1700000000,
  fromDivision: 'div_championship',
  toDivision: 'div_premier',
  teams: ['team_miami'],
  type: 'promotion'
}
```

### Season Management

```typescript
// Create season
const season = leagueMgr.createSeason(
  league.leagueId,
  1,
  'Winter 2026'
);

// Season status: 'upcoming' → 'active' → 'completed'

// Update leaderboard after season
leagueMgr.updateSeasonLeaderboard(season.seasonId);

// Leaderboard combines all divisions:
// Position 1: Team from Premier Div, 1st place
// Position 2: Team from Premier Div, 2nd place
// ...
// Position 21: Team from Championship Div, 1st place
// etc.
```

---

## API Reference

### ProgressionManager Methods

```typescript
// Create & Manage
createProgression(entityId, type, name, owner): PlayerProgression
addXP(progressionId, amount, source): PlayerProgression
recordMatchResult(progressionId, won, stats): PlayerProgression
awardBadge(progressionId, badgeId): PlayerProgression
completeMilestone(progressionId, milestoneId): PlayerProgression

// Query
getProgression(progressionId): PlayerProgression
getProgressionByEntity(entityId): PlayerProgression
getProgressionsForOwner(owner): PlayerProgression[]
getTierLeaderboard(tier): PlayerProgression[]
getOverallLeaderboard(limit): PlayerProgression[]
getNextTierRequirements(progressionId): ProgressionTierConfig

// Data
getBadge(badgeId): ProgressionBadge
getAllBadges(): ProgressionBadge[]
getMilestone(milestoneId): ProgressionMilestone
getAllMilestones(): ProgressionMilestone[]
generateMetadata(progressionId): NFT metadata JSON
```

### LeagueManager Methods

```typescript
// League Management
createLeague(name, country, owner, description): League
getLeague(leagueId): League
getAllLeagues(): League[]

// Division Management
createDivision(leagueId, name, tier, level, maxTeams, promo, relego): Division
getDivision(divisionId): Division
getDivisionsInLeague(leagueId): Division[]
addTeamToDivision(divisionId, teamId, teamName, owner): DivisionStanding

// Match Results
recordDivisionMatchResult(divisionId, homeId, awayId, homeGoals, awayGoals, homeStats, awayStats): boolean

// Standings
getDivisionStandings(divisionId): DivisionStanding[]
getTeamStanding(divisionId, teamId): DivisionStanding
getTeamsInDivision(divisionId): DivisionStanding[]

// Promotion/Relegation
calculatePromotionRelegation(fromDiv, toDiv): { promoted, relegated }
executePromotionRelegation(seasonId, fromDiv, toDiv): boolean
getPromotionHistory(seasonId): PromotionRelegaltion[]

// Seasons
createSeason(leagueId, number, name): LeagueSeason
getSeason(seasonId): LeagueSeason
updateSeasonLeaderboard(seasonId): boolean

// Metadata
generateDivisionMetadata(divisionId): NFT metadata JSON
```

---

## Usage in React Components

### Display Progression Card

```typescript
import { ProgressionCard, ProgressionManager } from '@/components/ProgressionAndLeaguesUI';
import { ProgressionManager as ProgMgr } from '@/lib/progressionSystem';

export function MyProgressionDisplay() {
  const progMgr = ProgMgr.getInstance();
  const [progression, setProgression] = useState<PlayerProgression | null>(null);

  useEffect(() => {
    const prog = progMgr.getProgressionByEntity('player_123');
    setProgression(prog);
  }, []);

  if (!progression) return <div>Loading...</div>;

  return <ProgressionCard progression={progression} />;
}
```

### Display Division Standings

```typescript
import { DivisionStandings, LeagueManager } from '@/components/ProgressionAndLeaguesUI';

export function MyDivisionStandings() {
  const leagueMgr = LeagueManager.getInstance();
  const [standings, setStandings] = useState<DivisionStanding[]>([]);

  useEffect(() => {
    const stands = leagueMgr.getDivisionStandings('div_premier');
    setStandings(stands);
  }, []);

  const division = leagueMgr.getDivision('div_premier');

  return <DivisionStandings standings={standings} division={division} />;
}
```

### Display Progression Leaderboard

```typescript
import { ProgressionLeaderboard } from '@/components/ProgressionAndLeaguesUI';

export function MyLeaderboard() {
  const progMgr = ProgressionManager.getInstance();
  const [leaderboard, setLeaderboard] = useState<PlayerProgression[]>([]);

  useEffect(() => {
    const leaders = progMgr.getOverallLeaderboard(20);
    setLeaderboard(leaders);
  }, []);

  return <ProgressionLeaderboard progressions={leaderboard} limit={20} />;
}
```

---

## Real-World Example Flow

### Scenario: Season Progression

```
Week 1:
├─ Player joins progression (Level 1, Bronze)
├─ Plays match 1: Wins
│  └─ Awards 100 XP (Level 1 → 1 level, still Level 1)
├─ Plays match 2: Wins (streak: 2)
│  └─ Awards 200 XP (×2 multiplier)
└─ Plays match 3: Wins (streak: 3)
   └─ Awards 300 XP (×3 multiplier)
   └─ Total: 600 XP this week
   └─ Progress to Level 2 (need ~1,100)

Week 2:
├─ Player plays 5 more matches, wins 3
│  └─ Cumulative: 1,200 XP, Level 2 reached!
│  └─ Check: Any milestones completed?
└─ Current streak: 3 (carries over from Week 1, then lost match 4)

Week 8:
├─ Player at Level 15, 8,500 XP, Bronze tier
├─ Completes milestone: "10 Wins"
│  └─ Awards 500 XP + Star badge
├─ Reaches Silver tier requirement (20 levels + 5,000 XP)
│  └─ TIER UP! Silver tier reached!
│  └─ New XP multiplier: 1.1x (was 1.0x)
│  └─ Awards Silver badge
└─ Silver tier unlocks cosmetics: [silver-frame]

Division Side:
├─ Team: Miami United, Premier Division
├─ Week 1: Plays 2 matches, wins both
│  └─ Standings: Position 1, 6 points
├─ Week 2: Loses 1, wins 1, draws 1
│  └─ Form: DLWW (last 4 matches)
│  └─ Standings: Position 3, 10 points
└─ After 10 weeks (season ends):
   ├─ Miami: 1st place, 28 points
   ├─ PROMOTION to Tier 2!
   └─ Stats reset for next season
```

---

## Integration with Existing Systems

### With Seasonal Rankings NFT

```typescript
// When season ends, award seasonal ranking NFT:
const seasonalMgr = SeasonalRankingNFTManager.getInstance();
const progMgr = ProgressionManager.getInstance();

const progression = progMgr.getProgression(progressionId);

seasonalMgr.awardSeasonalRankingNFT(
  progression.entityId,
  progression.entityName,
  'team_name',
  'season_2026_w1',
  {
    finalRank: 5,
    totalPoints: progression.totalXP,
    matchesPlayed: progression.matchesPlayed,
    goalsScored: progression.goalsScored,
    assists: progression.assists,
    averageRating: progression.averageRating,
  },
  'wallet_address'
);
```

### With Team Customization

```typescript
// Apply league-specific jersey colors:
const customMgr = TeamCustomizationManager.getInstance();

// Get team's division
const standing = leagueMgr.getTeamStanding(divisionId, teamId);

// Apply tier-specific cosmetics
if (standing.position === 1) {
  // Leader gets special badge
  customMgr.createCustomBadge(teamId, {
    name: 'Division Leader',
    designTemplate: 'modern',
    primaryColor: '#FFD700',
  });
}
```

---

## Storage & Persistence

Both systems use **localStorage** automatically:

```typescript
// Data saved automatically on:
// - createProgression()
// - addXP()
// - recordMatchResult()
// - awardBadge()
// - createDivision()
// - recordDivisionMatchResult()
// - executePromotionRelegation()

// Load automatically on:
// - ProgressionManager.getInstance()
// - LeagueManager.getInstance()
```

**Storage Keys:**
- `progression_system` (ProgressionManager data)
- `league_system` (LeagueManager data)

**Size Estimates:**
- Per player: ~500 bytes
- Per division with 20 teams: ~2 KB
- Per season: ~1 KB

---

## Next Steps

1. **Database Integration** (Optional)
   - Use provided schema to persist to PostgreSQL
   - API endpoints for match reporting

2. **Blockchain NFTs** (Optional)
   - Use `generateMetadata()` for IPFS upload
   - Deploy contracts for seasonal/tier NFTs

3. **Automation** (Optional)
   - Cron job for end-of-season promotion
   - Auto-season creation
   - Leaderboard refresh timers

4. **Frontend Integration** (Now)
   - Use components in your dashboard
   - Display in TeamSelector (shown next)
   - Real-time updates

---

## Questions?

See documentation:
- **Quick Reference**: PROGRESSION_LEAGUES_QUICKREF.md
- **Schema & Database**: PROGRESSION_LEAGUES_DATABASE.md
- **Implementation Examples**: PROGRESSION_LEAGUES_EXAMPLES.md

**You're ready to build!** 🚀
