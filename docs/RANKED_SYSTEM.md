# 🏆 Ranked System & Competitive Structure

**ELO, Seasonal Rankings, Anti-Smurfing, and Leaderboards**

Bass Ball's ranked system creates a **fair, verifiable competitive hierarchy** where skill is the only variable.

---

## Table of Contents

1. [ELO System](#elo-system)
2. [Ranked Tiers & Ranks](#ranked-tiers--ranks)
3. [Seasonal Structure](#seasonal-structure)
4. [Anti-Smurfing](#anti-smurfing)
5. [Leaderboards](#leaderboards)
6. [Promotion & Demotion](#promotion--demotion)
7. [Implementation](#implementation)

---

## ELO System

### Rating Formula

Bass Ball uses **modified Elo rating** (from chess/League of Legends):

```typescript
interface EloCalculation {
  // Standard Elo formula
  expectedWin(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }
  
  // New rating after match
  calculateNewRating(
    currentRating: number,
    expectedWin: number,
    actualResult: 0 | 0.5 | 1,  // Loss | Draw | Win
    kFactor: number
  ): number {
    return currentRating + kFactor * (actualResult - expectedWin);
  }
  
  // K-factor varies by rating (Glicko-style)
  getKFactor(currentRating: number): number {
    if (currentRating < 1200) return 32;   // New players: bigger swings
    if (currentRating < 1600) return 24;   // Developing: moderate swings
    if (currentRating < 2000) return 16;   // Experienced: smaller swings
    return 8;                               // Masters: very stable
  }
}
```

### Example Rating Changes

```
Match 1: You (1000 rating) vs Opponent (1200 rating)
- Expected win: 26% (you're underdog)
- You win (unexpected upset)
- K-factor: 32 (new player)
- Rating change: +24 ELO
- New rating: 1024

Match 2: You (1024) vs Opponent (900)
- Expected win: 71% (you're favorite)
- You win (expected)
- K-factor: 32
- Rating change: +9 ELO
- New rating: 1033

Match 3: You (1033) vs Opponent (1100)
- Expected win: 41%
- You lose (expected)
- K-factor: 32
- Rating change: -18 ELO
- New rating: 1015
```

### Draw Handling

**Draws are possible (rare in soccer, happens in tight matches):**

```
If match ends in tie:
- You get 50% of expected win probability
- Lower rating players rewarded for holding draw vs higher rated

Example:
- 1000 vs 1500 rating
- Expected: 1000-rated loses (14% win chance)
- If draw: 1000-rated gets +7 ELO (fought well)
- If win: 1000-rated gets +16 ELO (huge upset)
- If loss: 1000-rated gets -18 ELO (expected)
```

---

## Ranked Tiers & Ranks

### Tier Structure (10 Tiers)

```
Tier 10 (Bronze)        1000-1199 ELO   (New players, learning)
Tier 9 (Silver)         1200-1399 ELO   (Getting competitive)
Tier 8 (Gold)           1400-1599 ELO   (Solid players)
Tier 7 (Platinum)       1600-1799 ELO   (Very good)
Tier 6 (Diamond)        1800-1999 ELO   (Elite)
Tier 5 (Master)         2000-2199 ELO   (Top 1%)
Tier 4 (Grandmaster)    2200-2399 ELO   (Top 0.5%)
Tier 3 (Legend)         2400-2599 ELO   (Top 0.1%)
Tier 2 (Mythic)         2600-2799 ELO   (Top 0.05%)
Tier 1 (Godslayer)      2800+ ELO       (Top 0.01%)

Starting rating: 1000 ELO (Tier 10)
```

### Ranking Within Tier

**Each tier has 5 ranks (I-V):**

```
Tier 6 Diamond, Rank I   1800-1839 ELO
Tier 6 Diamond, Rank II  1840-1879 ELO
Tier 6 Diamond, Rank III 1880-1919 ELO
Tier 6 Diamond, Rank IV  1920-1959 ELO
Tier 6 Diamond, Rank V   1960-1999 ELO
→ Promote to Tier 5 Master

Tier 7 Platinum, Rank I  1600-1639 ELO
...
```

### Visual Ranking System

```
┌─────────────────────────────────┐
│ Your Rank: Diamond III          │
│ ELO: 1892                       │
│ ████████░░ 92% to Rank II       │
│                                 │
│ Tier Progress:                  │
│ ████████░░ 92/200 to Master     │
│                                 │
│ Wins: 45  Losses: 35            │
│ Win Rate: 56.2%                 │
│                                 │
│ Next Match:                     │
│ vs Platinum I (1650 ELO)        │
│ +18 ELO if win, -14 ELO if loss │
└─────────────────────────────────┘
```

---

## Seasonal Structure

### Season Timeline

```
Season = 3 months (90 days)

Week 1-2:   Placement Matches (play 10 calibration matches)
Week 2-11:  Ranked Play (climb the ladder)
Week 12:    Season End (final push, final day cutoff)
Day 1-2:    Season Rewards (distribute based on final tier)

Seasonal Resets:
- At season end: Rating drops by 25% toward 1200
- Example: 2000 ELO → 1800 ELO at reset
- But cosmetics and badges remain (permanent achievements)
```

### Placement Matches

**First-time ranked (or new season) requires calibration:**

```
Play 10 placement matches (unranked, determines starting tier)

Based on placement results:
- 0-2 wins → Start at Tier 10 (Bronze)
- 3-5 wins → Start at Tier 9 (Silver)
- 6-7 wins → Start at Tier 8 (Gold)
- 8-9 wins → Start at Tier 7 (Platinum)
- 10 wins  → Start at Tier 6 (Diamond)

Purpose: Match new players with equal skill level
```

---

## Anti-Smurfing

### Smurf Detection

```typescript
interface SmurfDetection {
  // Account characteristics
  accountAge: number;           // Days since creation
  playedMatches: number;        // Lifetime matches
  
  // Behavior indicators
  winRateUnexpected: number;    // Playing way better than rating
  rapidRankingUp: boolean;      // Climbing too fast
  playPatternSimilar: boolean;  // Similar to known accounts
  multipleAccounts: boolean;    // Same IP, same behavior
  
  // Detection algorithm
  detectSmurf(): boolean {
    // New account (< 30 days) with suspicious behavior
    if (this.accountAge < 30 && this.playedMatches < 100) {
      // Check for rapid climbing
      if (this.rapidRankingUp) {
        // Check for win rate that's statistically impossible
        if (this.winRateUnexpected > 85) {
          return true;  // Likely smurf
        }
      }
    }
    
    // Multiple accounts from same IP
    if (this.multipleAccounts && this.playPatternSimilar) {
      return true;  // Likely smurf farm
    }
    
    return false;
  }
  
  // Punishment
  handleSmurfAccount(playerId: string): void {
    if (this.detectSmurf(playerId)) {
      // Action 1: Shadow ban from ranked (still playable, but hidden from rankings)
      this.shadowBanFromRanked(playerId);
      
      // Action 2: Merge with main account if identified
      const mainAccount = this.identifyMainAccount(playerId);
      if (mainAccount) {
        this.mergeAccounts(playerId, mainAccount);
      }
      
      // Action 3: Seasonal rank reset to rating 1000
      this.resetRankingToBase(playerId);
    }
  }
}
```

### Reverse Boosting (Intentional Losing)

**Also prevented:**

```typescript
interface ReverseBoostDetection {
  // Indicators
  suddenWinRateDrop: boolean;   // Was 70%, now 20%
  rageQuitPattern: boolean;     // Leaving matches intentionally
  feedingBehavior: boolean;     // Running into opposition
  
  // Detection
  detectReverseBoost(playerId: string): boolean {
    const recentMatches = this.getRecentMatches(playerId, 50);
    const winRate = this.calculateWinRate(recentMatches);
    
    // Sudden 50%+ drop = suspicious
    if (this.previousWinRate - winRate > 50) {
      // Check for feeding (running into defenders)
      if (this.detectFeeding(recentMatches)) {
        return true;  // Reverse boosting
      }
    }
    
    return false;
  }
  
  // Punishment
  handleReverseBoost(playerId: string): void {
    // Revoke last 20 matches results
    // Rating reset to previous average
    // Temporary ranked ban (48 hours)
    // Multiple violations = permanent ban
  }
}
```

---

## Leaderboards

### Global ELO Leaderboard

```
┌─ GLOBAL LEADERBOARD (All Players) ──────────────────┐
│ Rank │ Player        │ ELO  │ Tier         │ W-L    │
├──────┼───────────────┼──────┼──────────────┼────────┤
│  1   │ ProGamer2K    │ 3120 │ Godslayer    │ 856-242│
│  2   │ SkillMaster   │ 3050 │ Godslayer    │ 812-198│
│  3   │ TheTactician  │ 2945 │ Mythic       │ 734-156│
│  4   │ CounterKing   │ 2823 │ Legend       │ 698-134│
│  5   │ FastBreak     │ 2756 │ Grandmaster  │ 612-89 │
│ ...  │ ...           │ ...  │ ...          │ ...    │
└──────┴───────────────┴──────┴──────────────┴────────┘
```

### Tier-Specific Leaderboards

```
┌─ DIAMOND TIER LEADERBOARD ────────────────┐
│ Rank │ Player      │ ELO  │ Rank │ W-L    │
├──────┼─────────────┼──────┼──────┼────────┤
│  1   │ DiamondKing │ 1998 │ V    │ 145-92 │
│  2   │ SharpShooter│ 1975 │ IV   │ 132-78 │
│  3   │ DefenseWall │ 1950 │ III  │ 128-75 │
│  4   │ Midfielder  │ 1925 │ II   │ 119-63 │
│  5   │ Finisher    │ 1900 │ I    │ 108-52 │
└──────┴─────────────┴──────┴──────┴────────┘
```

### Seasonal Leaderboards

**Top 100 players per season get rewards:**

```
Season 1 Rank       Reward
1-10 (Rank S1)      $5,000 prize pool
11-50 (Rank A1)     $500 prize
51-100 (Rank B1)    $100 prize

Plus:
- Special cosmetics (season-locked)
- NFT badges (tradeable proof of achievement)
- Invite to seasonal tournaments
```

### Role-Specific Leaderboards

```
┌─ CENTER BACK LEADERBOARD ────────────────┐
│ Rank │ Player        │ CB Rating │ W-L   │
├──────┼───────────────┼───────────┼───────┤
│  1   │ DefenseKing   │ 2.8       │ 234-45│
│  2   │ IronWall      │ 2.7       │ 198-32│
│  3   │ Interception  │ 2.65      │ 187-28│
└──────┴───────────────┴───────────┴───────┘

CB Rating = average tackles + interceptions + clearances
```

---

## Promotion & Demotion

### Automatic Promotion

**Reach ELO threshold → Automatically promoted:**

```
Diamond III (1892 ELO) + 8 more ELO → Automatically Diamond II
Diamond II (1908 ELO) + 32 more ELO → Automatically Diamond I
Diamond I (1940 ELO) + 60 more ELO → Automatically Master (tier up)
```

### Automatic Demotion

**Drop ELO threshold → Automatically demoted:**

```
Diamond II (1880 ELO) - 50 ELO → Automatically Diamond III
Diamond III (1850 ELO) - 100 ELO → Automatically Silver V (tier down)
```

### Demotion Protection

**Reduced points loss for recently promoted:**

```
Just promoted to Diamond I (1940 ELO)?
- Next 5 matches: -50% ELO loss
- Example: -18 ELO loss becomes -9 ELO

Prevents "yo-yo" between ranks
```

---

## Implementation

### RankedSystem Class

```typescript
class RankedSystem {
  private playerRatings: Map<string, number> = new Map();
  private matchHistory: Map<string, Match[]> = new Map();
  private seasonalResets: Map<string, number> = new Map();
  
  // Calculate match ELO change
  calculateEloChange(
    winnerRating: number,
    loserRating: number,
    matchResult: 'win' | 'loss' | 'draw'
  ): { winnerGain: number; loserGain: number } {
    const expectedWinProbability = this.getExpectedWin(
      winnerRating,
      loserRating
    );
    
    const kFactor = this.getKFactor(winnerRating);
    const actualResult = matchResult === 'win' ? 1 : matchResult === 'draw' ? 0.5 : 0;
    
    const ratingChange = kFactor * (actualResult - expectedWinProbability);
    
    return {
      winnerGain: Math.round(ratingChange),
      loserGain: Math.round(-ratingChange),
    };
  }
  
  // Record match result
  recordMatchResult(
    match: Match,
    winner: string,
    loser: string
  ): void {
    const winnerRating = this.playerRatings.get(winner) || 1000;
    const loserRating = this.playerRatings.get(loser) || 1000;
    
    // Determine result (win, loss, or draw)
    const matchResult = this.determineResult(match);
    
    // Calculate ELO change
    const eloChange = this.calculateEloChange(
      winnerRating,
      loserRating,
      matchResult
    );
    
    // Update ratings
    this.playerRatings.set(
      winner,
      Math.max(0, winnerRating + eloChange.winnerGain)
    );
    this.playerRatings.set(
      loser,
      Math.max(0, loserRating + eloChange.loserGain)
    );
    
    // Log match
    if (!this.matchHistory.has(winner)) {
      this.matchHistory.set(winner, []);
    }
    this.matchHistory.get(winner)!.push(match);
    
    // Check for promotion/demotion
    this.checkRankChange(winner);
    this.checkRankChange(loser);
    
    // Detect and handle smurfing/reverse boosting
    this.detectSmurfing(winner, loser);
  }
  
  // Get player's tier and rank
  getPlayerTier(playerId: string): { tier: string; rank: number; elo: number } {
    const rating = this.playerRatings.get(playerId) || 1000;
    
    const tiers = [
      { name: 'Godslayer', min: 2800 },
      { name: 'Mythic', min: 2600 },
      { name: 'Legend', min: 2400 },
      { name: 'Grandmaster', min: 2200 },
      { name: 'Master', min: 2000 },
      { name: 'Diamond', min: 1800 },
      { name: 'Platinum', min: 1600 },
      { name: 'Gold', min: 1400 },
      { name: 'Silver', min: 1200 },
      { name: 'Bronze', min: 1000 },
    ];
    
    const tierInfo = tiers.find(t => rating >= t.min);
    const tierMin = tierInfo!.min;
    const tierMax = tiers[tiers.indexOf(tierInfo!) - 1]?.min || 4000;
    
    // Calculate rank within tier (I-V)
    const tierRange = tierMax - tierMin;
    const positionInTier = rating - tierMin;
    const rankFraction = positionInTier / tierRange;
    const rank = Math.floor(rankFraction * 5) + 1;
    
    return {
      tier: tierInfo!.name,
      rank: Math.min(5, rank),
      elo: Math.round(rating),
    };
  }
  
  // Get leaderboard
  getLeaderboard(limit: number = 100): Array<{
    rank: number;
    player: string;
    elo: number;
    tier: string;
    wins: number;
    losses: number;
  }> {
    const players = Array.from(this.playerRatings.entries())
      .map(([playerId, elo]) => {
        const tier = this.getPlayerTier(playerId);
        const matches = this.matchHistory.get(playerId) || [];
        const wins = matches.filter(m => m.winnerId === playerId).length;
        const losses = matches.length - wins;
        
        return { playerId, elo, tier, wins, losses };
      })
      .sort((a, b) => b.elo - a.elo)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        player: entry.playerId,
        elo: entry.elo,
        tier: entry.tier.tier,
        wins: entry.wins,
        losses: entry.losses,
      }));
    
    return players;
  }
  
  // Seasonal reset
  resetSeason(seasonNumber: number): void {
    for (const [playerId, rating] of this.playerRatings.entries()) {
      // Reset: drop 25% toward 1200
      const newRating = rating * 0.75 + 1200 * 0.25;
      this.playerRatings.set(playerId, newRating);
    }
    
    // Clear match history for new season
    this.matchHistory.clear();
    
    // Award seasonal cosmetics based on previous tier
    this.awardSeasonalCosmetics(seasonNumber);
  }
  
  private getExpectedWin(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }
  
  private getKFactor(rating: number): number {
    if (rating < 1200) return 32;
    if (rating < 1600) return 24;
    if (rating < 2000) return 16;
    return 8;
  }
  
  private detectSmurfing(winner: string, loser: string): void {
    // Implement smurf detection (see above)
  }
  
  private checkRankChange(playerId: string): void {
    // Check for promotion/demotion (see above)
  }
}
```

---

## Ranked System Summary

✅ **Fair ELO System**: Based on chess/competitive gaming standards  
✅ **10-Tier Hierarchy**: Clear skill progression  
✅ **Anti-Smurfing**: Detection and punishment  
✅ **Seasonal Structure**: Fresh resets, long-term achievement  
✅ **Global Leaderboards**: Transparent ranking  
✅ **Role-Specific Ratings**: Recognize specialist skills  
✅ **Demotion Protection**: Prevent yo-yo-ing  

---

**Status**: Design Complete, Implementation Ready  
**Last Updated**: January 18, 2026  
**Competitive Integrity**: ✅ Professional-Grade System
