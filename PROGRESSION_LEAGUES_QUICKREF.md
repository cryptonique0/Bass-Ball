# Progression & Leagues Quick Reference
## Essentials at a Glance

---

## File Locations

```
lib/progressionSystem.ts          (507 lines) → ProgressionManager
lib/leaguesAndDivisions.ts        (520 lines) → LeagueManager
components/ProgressionAndLeaguesUI.tsx (600+ lines) → UI components
components/TeamSelector.tsx       (ENHANCED) → Now shows progression & leagues
PROGRESSION_LEAGUES_COMPLETE.md   (Detailed guide)
```

---

## In 30 Seconds

### Progression
```typescript
const mgr = ProgressionManager.getInstance();

// Create
const prog = mgr.createProgression('player_1', 'player', 'John', 'wallet');

// Add XP
mgr.addXP(prog.progressionId, 100);

// Check
prog = mgr.getProgression(prog.progressionId);
console.log(`Level ${prog.currentLevel} ${prog.currentTier}`);
```

### Leagues
```typescript
const mgr = LeagueManager.getInstance();

// Create
const league = mgr.createLeague('EPL', 'England', 'owner', 'Top division');
const div = mgr.createDivision(league.leagueId, 'Premier', 1, 'elite', 20, 2, 2);

// Add team
mgr.addTeamToDivision(div.divisionId, 'team_1', 'Team A', 'owner');

// Record match
mgr.recordDivisionMatchResult(div.divisionId, 'team_1', 'team_2', 2, 1, 
  {rating: 8}, {rating: 6});

// View standings
const standings = mgr.getDivisionStandings(div.divisionId);
```

---

## Key Methods

### ProgressionManager

| Method | Returns | Use Case |
|--------|---------|----------|
| `createProgression()` | PlayerProgression | Create new player/team progression |
| `addXP()` | PlayerProgression | Award XP (auto levels up) |
| `recordMatchResult()` | PlayerProgression | Log match results with stats |
| `awardBadge()` | PlayerProgression | Unlock achievement badge |
| `completeMilestone()` | PlayerProgression | Complete objective (auto XP/badge) |
| `getProgression()` | PlayerProgression | Get by ID |
| `getProgressionByEntity()` | PlayerProgression | Get by player/team ID |
| `getTierLeaderboard()` | Array | Get top N by tier |
| `getOverallLeaderboard()` | Array | Get top N overall |
| `getAllBadges()` | ProgressionBadge[] | All available badges |
| `generateMetadata()` | JSON | ERC-721 metadata |

### LeagueManager

| Method | Returns | Use Case |
|--------|---------|----------|
| `createLeague()` | League | Create new league |
| `createDivision()` | Division | Add division to league |
| `addTeamToDivision()` | DivisionStanding | Enroll team |
| `recordDivisionMatchResult()` | boolean | Log match in division |
| `getDivisionStandings()` | DivisionStanding[] | Current standings |
| `getTeamStanding()` | DivisionStanding | Team's position |
| `executePromotionRelegation()` | boolean | End-of-season moves |
| `createSeason()` | LeagueSeason | Start new season |
| `updateSeasonLeaderboard()` | boolean | Finalize leaderboard |
| `generateDivisionMetadata()` | JSON | ERC-721 metadata |

---

## Data Flow Example

```
Match Completes (3-1 Home Win)
    ↓
[ProgressionManager]
  • Home team +100 XP (×1.5 multiplier if Diamond)
  • Away team +50 XP
  • Check: Any level ups? Tier ups? Milestones?
  • Award badges if applicable
    ↓
[LeagueManager]
  • Home standing: +3 points, goals tracked
  • Away standing: +0 points
  • Both get form update (W for home, L for away)
  • Recalculate standings
  • Check: Top 2 can be promoted? Bottom 2 relegated?
    ↓
[TeamSelector / UI]
  • Display updated level badge
  • Show new league position
  • Display new form
  • Update badges earned
```

---

## Tier System Cheat Sheet

```
Bronze      Lvl 1+    0 XP      1.0x multiplier
Silver      Lvl 20+   5k XP     1.1x multiplier → Silver badge
Gold        Lvl 40+   15k XP    1.2x multiplier → NFT + 100 tokens
Platinum    Lvl 60+   30k XP    1.35x multiplier → NFT + 250 tokens
Diamond     Lvl 80+   50k XP    1.5x multiplier → NFT + 500 tokens
Master      Lvl 100+  75k XP    2.0x multiplier → NFT + 1k tokens + aura
```

---

## Progression Milestone Triggers

| Milestone | Requirement | Reward | Tier |
|-----------|-------------|--------|------|
| First Steps | 10 wins | 500 XP | Bronze |
| Rising Star | 50 wins | 2000 XP + ⭐ | Silver |
| Veteran | 100 wins | 5000 XP + 🏆 | Gold |
| Marksman | 25 goals | 750 XP + 🎯 | Silver |
| Playmaker | 15 assists | 500 XP + 🎪 | Bronze |
| Reliable | 50% consistency | 1000 XP + ✅ | Silver |

---

## Division Standings Sort

```
#1  Points Desc
    ↓ Goal Difference Desc
    ↓ Goals For Desc
    ↓ Name (A-Z)
```

**Example:**
```
Pos  Team          Pts  GD  GF
1    Man City      21   +12  28
2    Liverpool     21   +8   25   ← Same points, but worse GD
3    Arsenal       18   +5   20
```

---

## Promotion/Relegation Probability

**Based on Position:**
```
Position 1:     ✅ 90% (guaranteed)
Position 2:     ✅ 80%
Position 3-4:   ⚠️ 40-70%
Position 5+:    ❌ 0%
...
Position N-2:   ⚠️ 40-70%
Position N-1:   ❌ 80%
Position N:     ❌ 90% (guaranteed)
```

---

## Widget Components

### ProgressionCard
```typescript
<ProgressionCard progression={progression} />
// Shows: Level badge, XP bar, tier progress, stats grid, next tier info, badges
```

### ProgressionLeaderboard
```typescript
<ProgressionLeaderboard progressions={progs} limit={20} />
// Shows: Ranked table with level, tier, XP, matches, win rate
```

### DivisionStandings
```typescript
<DivisionStandings standings={standings} division={division} />
// Shows: Table with position, team, P/W/D/L, GF/GA/GD, Points, form
```

### LevelBadge
```typescript
<LevelBadge level={15} tier="gold" size="lg" />
// Shows: Circular badge with level and tier color
```

### AchievementBadge
```typescript
<AchievementBadge badge={badge} unlocked={true} />
// Shows: Icon + name with rarity color border
```

### LeagueSelector
```typescript
<LeagueSelector leagues={leagues} selectedLeagueId={id} onSelectLeague={handler} />
// Shows: List of leagues with buttons
```

---

## Common Tasks

### Create Player Progression
```typescript
const mgr = ProgressionManager.getInstance();
const prog = mgr.createProgression('p1', 'player', 'Alice', wallet);
// Returns: PlayerProgression with Level 1, Bronze, 0 XP
```

### Record Win After Match
```typescript
mgr.recordMatchResult(prog.progressionId, true, {
  goalsScored: 2,
  assists: 1,
  rating: 8.5
});
// Adds 100 XP × win streak multiplier
```

### Level Up
```typescript
mgr.addXP(prog.progressionId, 5000); // Adds 5000 XP

prog = mgr.getProgression(prog.progressionId);
if (prog.currentLevel > oldLevel) {
  // LEVEL UP! ✨
}
```

### Check Tier Requirements
```typescript
const nextTier = mgr.getNextTierRequirements(prog.progressionId);
console.log(`Need Level ${nextTier.minLevel}, ${nextTier.minTotalXP} XP`);
```

### Create Multi-Tier League
```typescript
const league = mgr.createLeague('Global Cup', null, owner, 'description');

// Tier 1 - Elite
const elite = mgr.createDivision(league.leagueId, 'Elite', 1, 'elite', 20, 2, 2);

// Tier 2 - Professional
const pro = mgr.createDivision(league.leagueId, 'Professional', 2, 'professional', 30, 3, 3);

// Tier 3 - Amateur
const amateur = mgr.createDivision(league.leagueId, 'Amateur', 3, 'amateur', 50, 5, 5);

league.promotionRules = [
  { divisionId: pro.divisionId, promoteTo: elite.divisionId, count: 2 },
  { divisionId: amateur.divisionId, promoteTo: pro.divisionId, count: 3 }
];

league.relegationRules = [
  { divisionId: elite.divisionId, relegateTo: pro.divisionId, count: 2 },
  { divisionId: pro.divisionId, relegateTo: amateur.divisionId, count: 3 }
];
```

### End Season & Promote/Relegate
```typescript
const mgr = LeagueManager.getInstance();
const season = mgr.createSeason(league.leagueId, 1, 'Winter 2026');

// After season ends:
mgr.updateSeasonLeaderboard(season.seasonId);

// Execute moves
mgr.executePromotionRelegation(season.seasonId, professional.divisionId, elite.divisionId);
mgr.executePromotionRelegation(season.seasonId, amateur.divisionId, professional.divisionId);

// Teams are now in new divisions with reset stats
```

### Get Team's League Info
```typescript
const allLeagues = leagueMgr.getAllLeagues();

for (const league of allLeagues) {
  for (const division of league.divisions) {
    const standing = leagueMgr.getTeamStanding(division.divisionId, 'team_1');
    if (standing) {
      console.log(`${standing.teamName} in ${division.name}: #${standing.position} with ${standing.points}pts`);
      return;
    }
  }
}
```

---

## Testing / Development

### Create Test Progression
```typescript
const mgr = ProgressionManager.getInstance();
const prog = mgr.createProgression('test_1', 'player', 'Test Player', 'test');

// Simulate 50 wins at Silver tier
for (let i = 0; i < 50; i++) {
  mgr.recordMatchResult(prog.progressionId, true, { 
    goalsScored: Math.random() * 3, 
    assists: Math.random() * 2, 
    rating: 6 + Math.random() * 3 
  });
}

const final = mgr.getProgression(prog.progressionId);
console.log(`Final: Level ${final.currentLevel}, ${final.currentTier}, ${final.totalXP} XP`);
```

### Create Test Division
```typescript
const leagueMgr = LeagueManager.getInstance();
const league = leagueMgr.createLeague('Test League', null, 'owner', 'test');
const div = leagueMgr.createDivision(league.leagueId, 'Test Div', 1, 'elite', 4, 1, 1);

// Add 4 teams
for (let i = 1; i <= 4; i++) {
  leagueMgr.addTeamToDivision(div.divisionId, `team_${i}`, `Team ${i}`, 'owner');
}

// Simulate season
for (let round = 0; round < 3; round++) {
  leagueMgr.recordDivisionMatchResult(div.divisionId, 'team_1', 'team_2', 2, 1, {rating:8}, {rating:6});
  leagueMgr.recordDivisionMatchResult(div.divisionId, 'team_3', 'team_4', 1, 1, {rating:7}, {rating:7});
}

const standings = leagueMgr.getDivisionStandings(div.divisionId);
standings.forEach(s => console.log(`${s.position}. ${s.teamName}: ${s.points}pts`));
```

---

## Integration Checklist

- [ ] Import managers in components
- [ ] Create progression when player/team joins
- [ ] Log XP after each match
- [ ] Create league structure
- [ ] Add teams to divisions
- [ ] Log division matches
- [ ] Execute promotion/relegation at season end
- [ ] Display ProgressionCard in dashboard
- [ ] Display DivisionStandings in league view
- [ ] Display leaderboards
- [ ] (Optional) Persist to database
- [ ] (Optional) Create NFTs from metadata
- [ ] (Optional) Deploy blockchain contracts

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Data lost on refresh | Use database integration (see complete guide) |
| Team not in standings | Use `addTeamToDivision()` first |
| Progression not advancing | Check XP amount, may need more for level up |
| Promotion not working | Execute `executePromotionRelegation()` manually |
| Stats not updating | Call `recordMatchResult()` or `recordDivisionMatchResult()` |
| Badges not appearing | Use `awardBadge()` or complete milestone |

---

## Support

Full guide: **PROGRESSION_LEAGUES_COMPLETE.md**
Code examples: **PROGRESSION_LEAGUES_EXAMPLES.md** (coming next)
Database schema: **PROGRESSION_LEAGUES_DATABASE.md** (coming next)

**Ready to build!** 🚀
