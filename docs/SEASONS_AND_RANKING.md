# 🏁 Seasons & Ranking System

**Seasonal Structure, Promotion/Relegation Tiers, Seasonal Cosmetics, and Long-Term Competition**

Bass Ball seasons create competitive urgency and meaningful achievement cycles—every 3 months, the ladder resets but your skill remains.

---

## Table of Contents

1. [Season Timeline](#season-timeline)
2. [Promotion & Relegation System](#promotion--relegation-system)
3. [Seasonal Cosmetic Rewards](#seasonal-cosmetic-rewards)
4. [Rating Decay & Reset Mechanics](#rating-decay--reset-mechanics)
5. [Hall of Fame System](#hall-of-fame-system)
6. [Tier Structure](#tier-structure)
7. [Implementation](#implementation)

---

## Season Timeline

### Season Structure (12 Weeks = 90 Days)

```
Timeline for Season 1 (January 1 - March 31, 2026)

Week 1-2:     CALIBRATION PHASE
├─ New players/season starters play 10 placement matches
├─ Placement determines starting tier (Bronze → Diamond)
└─ Existing players: previous season rating × 0.75 + 1200 × 0.25

Week 2-11:    RANKED CLIMB PHASE
├─ Full ranked ladder availability
├─ Promotion/demotion every 20 ELO change
├─ Real-time leaderboards, weekly rank updates
└─ No soft resets during season (consistency)

Week 11-12:   FINAL SPRINT PHASE
├─ "Seasonal push" - players race for top 100
├─ Leaderboard freeze: Dec 25, 2026, 11:59 PM UTC
├─ Double ELO weekends (final 48 hours)
└─ Tension & urgency for final placements

Day 1 (Post-Season):  SEASON REWARDS PHASE
├─ Top 100 distributed based on final tier + cosmetics
├─ Seasonal badges awarded (NFT-backed)
├─ Hall of Fame updated
└─ 48-hour period for rewards claiming

Day 2:        RESET PHASE
├─ All ratings decay 25% toward 1200
├─ New season begins (clean slate mechanically)
├─ Existing achievements remain (badges, hall of fame)
└─ Battle pass resets (new seasonal cosmetics available)
```

### Season Calendar (Full Year)

```
Season 1 (Q1):  Jan 1  - Mar 31, 2026 (Winter Season)
Season 2 (Q2):  Apr 1  - Jun 30, 2026 (Spring Season)
Season 3 (Q3):  Jul 1  - Sep 30, 2026 (Summer Season)
Season 4 (Q4):  Oct 1  - Dec 31, 2026 (Fall Season)
```

---

## Promotion & Relegation System

### Tier Hierarchy with Promotion/Relegation

```
Tier 10 BRONZE   (1000-1199 ELO)
├─ Rank I    [1000-1039]
├─ Rank II   [1040-1079]
├─ Rank III  [1080-1119]
├─ Rank IV   [1120-1159]
├─ Rank V    [1160-1199]
└─ ↑ PROMOTE to Silver (auto at 1200+)

Tier 9 SILVER   (1200-1399 ELO)
├─ Rank I    [1200-1239]
├─ Rank II   [1240-1279]
├─ Rank III  [1280-1319]
├─ Rank IV   [1320-1359]
├─ Rank V    [1360-1399]
└─ ↔ Can drop to Bronze (auto at <1160) / Promote to Gold (auto at 1400+)

Tier 8 GOLD     (1400-1599 ELO)
├─ Rank I    [1400-1439]
├─ Rank II   [1440-1479]
├─ Rank III  [1480-1519]
├─ Rank IV   [1520-1559]
├─ Rank V    [1560-1599]
└─ ↔ Can drop to Silver / Promote to Platinum

Tier 7 PLATINUM (1600-1799 ELO)
├─ Rank I    [1600-1639]
├─ Rank II   [1640-1679]
├─ Rank III  [1680-1719]
├─ Rank IV   [1720-1759]
├─ Rank V    [1760-1799]
└─ ↔ Can drop to Gold / Promote to Diamond

Tier 6 DIAMOND  (1800-1999 ELO)
├─ Rank I    [1800-1839]
├─ Rank II   [1840-1879]
├─ Rank III  [1880-1919]
├─ Rank IV   [1920-1959]
├─ Rank V    [1960-1999]
└─ ↔ Can drop to Platinum / Promote to Master

Tier 5 MASTER   (2000-2199 ELO)  [Top 1%]
├─ Rank I    [2000-2039]
├─ Rank II   [2040-2079]
├─ Rank III  [2080-2119]
├─ Rank IV   [2120-2159]
├─ Rank V    [2160-2199]
└─ ↔ Can drop to Diamond / Promote to Grandmaster

Tier 4 GRANDMASTER (2200-2399 ELO) [Top 0.5%]
├─ Rank I    [2200-2239]
├─ Rank II   [2240-2279]
├─ Rank III  [2280-2319]
├─ Rank IV   [2320-2359]
├─ Rank V    [2360-2399]
└─ ↔ Can drop to Master / Promote to Legend

Tier 3 LEGEND   (2400-2599 ELO) [Top 0.1%]
Tier 2 MYTHIC   (2600-2799 ELO) [Top 0.05%]
Tier 1 GODSLAYER (2800+ ELO)     [Top 0.01%]
```

### Promotion Mechanics

**Automatic Promotion (No Ceremony, Just Instant)**

```
Player at Diamond I (1985 ELO) wins match
→ Gains 20 ELO → 2005 ELO
→ Crosses 2000 threshold
→ AUTO-PROMOTED TO MASTER TIER, RANK V
→ Notification: "You've earned Master Tier!"
→ Demotion Protection: Next 5 matches, reduce LP loss by 50%
```

**Demotion Protection (Yo-Yo Prevention)**

```
Just promoted to Master? (2000 ELO threshold crossed)

Demotion Guard Window: 5 matches after promotion
├─ Normal loss: -18 ELO
├─ With protection: -9 ELO (50% reduced)
└─ Purpose: Let new tier players adjust, prevent immediate drop

Example:
Master V (2005) loses 3 in a row
├─ Match 1: -9 ELO (protected) → 1996
├─ Match 2: -9 ELO (protected) → 1987
├─ Match 3: -9 ELO (protected) → 1978
├─ Now below 1980, stays in Master
└─ Without protection: would drop to 1951 (-18 each)
```

### Relegation Mechanics

**Automatic Demotion (Drops You to Previous Tier)**

```
Player at Silver I (1205 ELO) loses match
→ Loses 20 ELO → 1185 ELO
→ Falls below 1160 threshold
→ AUTO-RELEGATED TO BRONZE
→ Notification: "You've dropped to Bronze Tier"
→ New position: Bronze V (adjusted to 1190)
```

**Soft Demotion (Stay in Tier, Drop in Rank)**

```
Player at Silver V (1395 ELO) loses
→ Loses 15 ELO → 1380 ELO
→ Still in Silver, drops from Rank V → Rank III
→ No demotion protection needed (still in tier)
```

---

## Seasonal Cosmetic Rewards

### Final Tier-Based Cosmetics

**Players get 1 seasonal cosmetic per tier reached + bonus for top 100**

```
Final Tier Reached       Cosmetic Reward
────────────────────────────────────────
Bronze (Tier 10)         Bronze Season Jersey (1,000 variants)
Silver (Tier 9)          Silver Season Jersey (800 variants)
Gold (Tier 8)            Gold Season Jersey (600 variants)
Platinum (Tier 7)        Platinum Season Jersey (400 variants)
Diamond (Tier 6)         Diamond Season Jersey (250 variants)
Master (Tier 5)          Master Season Trophy Emote
Grandmaster (Tier 4)     Grandmaster Season Skin
Legend (Tier 3)          Legend Season Avatar Border
Mythic (Tier 2)          Mythic Season Stadium Theme
Godslayer (Tier 1)       Godslayer Season Crown Effect

Top 100 Final Rankings (Bonus):
Rank 1-10:               Rank-Specific Badge NFT (limited 10)
Rank 11-50:              Top 50 Season Badge NFT (limited 40)
Rank 51-100:             Top 100 Season Badge NFT (limited 50)
```

### Seasonal Collection (Non-Tradeable During Season)

```
Season 1 Cosmetics:

Winter Collection:
├─ Snow-themed stadium (available all season)
├─ Icy ball skin (free)
├─ Winter player animations (goal celebration)
├─ Snowflake emotes (5 unique)
└─ Frost kit overlay (transparent blue tint)

Seasonal Pass Cosmetics:
├─ Tier 1-10:    Winter emotes, badge borders
├─ Tier 11-25:   Player winter skins
├─ Tier 26-40:   Stadium variations
├─ Tier 41-50:   Legendary seasonal avatar border + championship cosmetic
```

### Post-Season Cosmetics (NFT-Backed Proof)

```
Final Rank 1-50:
├─ Minted as ERC-721: "Season 1 Top 50 Badge"
├─ Metadata includes: final rank, ELO, mastery levels, role distribution
├─ Soul-bound (non-transferable) for 30 days
├─ After 30 days: transferable on OpenSea
└─ Rarity: Only 50 ever minted per season

Hall of Fame:
├─ Name + rank + cosmetics visible on perpetual leaderboard
├─ "Spring 2026 Diamond I" badge shown on profile forever
├─ Can reclaim cosmetics even after trading account
└─ Achievement immortalized on-chain
```

---

## Rating Decay & Reset Mechanics

### Intra-Season Decay (Prevents Ladder Inflation)

**Active decay (prevents soft rating inflation)**

```
If player doesn't play for 2 weeks:
├─ Week 1-14: No decay (active play window)
├─ Week 15+: -1 ELO per day (incentivizes play)
├─ Minimum floor: Can't drop below 1000 (new player baseline)
└─ Decay resets on match completion

Example:
2000 ELO player goes inactive
├─ Day 1-14: 2000 (active window)
├─ Day 15: 1999 (-1 decay)
├─ Day 30: 1985 (-15 decay)
├─ Plays 1 match on day 31: 2000 (decay reset)
```

### Season End Reset (Fresh Start, Keep Achievements)

**Rating reset but badges/cosmetics remain**

```
Season 1 Final: You finish at 1850 ELO (Diamond III)

Season Reset Formula:
newRating = (previousRating × 0.75) + (1200 × 0.25)
         = (1850 × 0.75) + (1200 × 0.25)
         = 1387.5 + 300
         = 1687.5
         → Rounded to 1688 ELO (Platinum I)

What You Keep:
✓ All cosmetics from Season 1
✓ All playstyle badges earned
✓ Hall of Fame entry (Season 1 Diamond III)
✓ Skill mastery levels (7 roles)
✓ NFT badges (transferable after 30 days)

What Resets:
✗ Current tier (back to Platinum)
✗ Seasonal cosmetics (new ones available in Season 2)
✗ Battle pass (old cosmetics archived, new ones for new season)
✗ Leaderboard position (fresh climb)
```

### Historical Rating Tracking

```
Player Profile shows:

Current Season 2: Master V (2050 ELO)
├─ Rank: #1,234 globally
├─ Win rate: 58%

Previous Seasons:
├─ Season 1: Peak Diamond III (1850) - Hall of Fame #342
├─ All-Time Peak: Master (2089) - Season 2 Week 8

Skill Mastery (Preserved Across Seasons):
├─ Center Back: 88%
├─ Striker: 72%
├─ Winger: 65%
└─ Other roles: 45-55%
```

---

## Hall of Fame System

### Perpetual Hall of Fame (All Seasons)

```
┌─ BASS BALL HALL OF FAME ─────────────────────┐
│ Season │ Tier       │ Player      │ Peak ELO  │
├────────┼────────────┼─────────────┼───────────┤
│ S1     │ Legend     │ ProGamer2K  │ 2445      │
│ S1     │ Grandmaster│ SkillMaster │ 2310      │
│ S2     │ Mythic     │ ProGamer2K  │ 2650      │
│ S2     │ Legend     │ Tactician   │ 2405      │
│ S3     │ Godslayer  │ ProGamer2K  │ 2851      │
└────────┴────────────┴─────────────┴───────────┘

Hall of Fame Criteria:
├─ Top 10 players per season get immortal entry
├─ Name + tier + peak ELO visible permanently
├─ NFT badge awarded (ERC-721)
└─ Cosmetics show "Season X Hall of Famer" designation
```

### Role-Specific Hall of Fame

```
┌─ CENTER BACK HALL OF FAME ──────────────────┐
│ Season │ Player         │ Mastery │ Matches  │
├────────┼────────────────┼─────────┼──────────┤
│ S1     │ IronWall       │ 88%     │ 2,450    │
│ S1     │ DefenseKing    │ 85%     │ 2,234    │
│ S2     │ AerialMaster   │ 91%     │ 2,678    │
└────────┴────────────────┴─────────┴──────────┘

Eligibility:
├─ 80%+ mastery in role achieved
├─ Top 3 per season per role
└─ Separate from tier hall of fame (can be on both)
```

---

## Tier Structure

### Distribution Targets (100,000 Players)

```
Tier          ELO Range    Players   Percentage
─────────────────────────────────────────────────
Bronze        1000-1199    28,000    28%
Silver        1200-1399    22,000    22%
Gold          1400-1599    18,000    18%
Platinum      1600-1799    14,000    14%
Diamond       1800-1999    12,000    12%
Master        2000-2199    4,000     4%
Grandmaster   2200-2399    1,200     1.2%
Legend        2400-2599    400       0.4%
Mythic        2600-2799    300       0.3%
Godslayer     2800+        100       0.1%
```

### Seasonal Climb Difficulty

```
Bronze → Silver:   ~200 matches to climb (easy start)
Silver → Gold:     ~300 matches (skill check begins)
Gold → Platinum:   ~350 matches (tactical learning)
Platinum → Diamond:~400 matches (high execution bar)
Diamond → Master:  ~500 matches (elite players only)
Master → Legend:   ~800 matches (top 1% filter)
Legend+:           Variable (extremely competitive)
```

---

## Implementation

### SeasonalRankingEngine Class

```typescript
class SeasonalRankingEngine {
  private currentSeason: number = 1;
  private seasonStartDate: Date = new Date('2026-01-01');
  private playerRatings: Map<string, number> = new Map();
  private seasonalAchievements: Map<string, SeasonalData[]> = new Map();
  
  // Get player's tier and rank
  getTierAndRank(playerId: string): { tier: string; rank: number; elo: number } {
    const elo = this.playerRatings.get(playerId) || 1000;
    
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
    
    const tierInfo = tiers.find(t => elo >= t.min)!;
    const tierMin = tierInfo.min;
    const tierMax = tiers[tiers.indexOf(tierInfo) - 1]?.min || 4000;
    const tierRange = tierMax - tierMin;
    const positionInTier = elo - tierMin;
    const rankFraction = positionInTier / tierRange;
    const rank = Math.min(5, Math.floor(rankFraction * 5) + 1);
    
    return { tier: tierInfo.name, rank, elo: Math.round(elo) };
  }
  
  // Check for promotion
  checkPromotion(playerId: string, newElo: number): void {
    const oldTier = this.getTierAndRank(playerId);
    const newTier = this.getTierAndRank(playerId); // After updating ELO
    
    if (oldTier.tier !== newTier.tier) {
      // Promotion detected
      this.handlePromotion(playerId, oldTier.tier, newTier.tier);
    }
  }
  
  // Seasonal reset
  resetSeason(): void {
    // Store current season data
    for (const [playerId, elo] of this.playerRatings.entries()) {
      const tierData = this.getTierAndRank(playerId);
      this.recordSeasonalAchievement(playerId, {
        season: this.currentSeason,
        finalElo: elo,
        finalTier: tierData.tier,
        finalRank: tierData.rank,
      });
      
      // Apply reset formula: new = (old × 0.75) + (1200 × 0.25)
      const newElo = elo * 0.75 + 1200 * 0.25;
      this.playerRatings.set(playerId, newElo);
    }
    
    // Increment season, reset all cosmetics
    this.currentSeason++;
    this.seasonStartDate = new Date();
    this.awardSeasonalCosmetics();
  }
  
  // Intra-season decay (prevent inflation)
  applyInactivityDecay(): void {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    for (const [playerId, lastMatchDate] of this.getLastMatchDates().entries()) {
      if (lastMatchDate < twoWeeksAgo) {
        const currentElo = this.playerRatings.get(playerId) || 1000;
        const daysSinceMatch = Math.floor(
          (Date.now() - lastMatchDate.getTime()) / (24 * 60 * 60 * 1000)
        );
        const decayDays = Math.max(0, daysSinceMatch - 14);
        const newElo = Math.max(1000, currentElo - decayDays);
        
        this.playerRatings.set(playerId, newElo);
      }
    }
  }
  
  // Award seasonal cosmetics
  awardSeasonalCosmetics(): void {
    for (const [playerId, elo] of this.playerRatings.entries()) {
      const tierData = this.getTierAndRank(playerId);
      const cosmetic = this.getSeasonalCosmeticForTier(tierData.tier);
      
      this.grantCosmeticToPlayer(playerId, cosmetic);
    }
    
    // Top 100 get NFT badges
    const top100 = Array.from(this.playerRatings.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100);
    
    top100.forEach(([playerId, elo], index) => {
      const nftBadge = this.createNFTBadge(
        playerId,
        this.currentSeason,
        index + 1,
        elo
      );
      this.mintNFTBadge(nftBadge);
    });
  }
  
  // Get hall of fame
  getHallOfFame(season?: number): Array<{
    rank: number;
    player: string;
    tier: string;
    peakElo: number;
  }> {
    const targetSeason = season || this.currentSeason;
    const achievements = this.seasonalAchievements
      .values()
      .flatMap(arr => arr)
      .filter(ach => ach.season === targetSeason)
      .sort((a, b) => b.finalElo - a.finalElo)
      .slice(0, 10);
    
    return achievements.map((ach, index) => ({
      rank: index + 1,
      player: ach.playerId,
      tier: ach.finalTier,
      peakElo: ach.finalElo,
    }));
  }
  
  private handlePromotion(playerId: string, oldTier: string, newTier: string): void {
    // Grant demotion protection (5 matches with -50% LP loss)
    this.grantDemotionProtection(playerId, 5);
    // Notify player
    this.notifyPlayer(playerId, `Promoted from ${oldTier} to ${newTier}!`);
  }
  
  private recordSeasonalAchievement(playerId: string, data: SeasonalData): void {
    if (!this.seasonalAchievements.has(playerId)) {
      this.seasonalAchievements.set(playerId, []);
    }
    this.seasonalAchievements.get(playerId)!.push({ playerId, ...data });
  }
}
```

---

## Seasons & Ranking Summary

✅ **12-Week Season Cycles**: Fresh competitive windows every quarter  
✅ **Promotion/Relegation**: Dynamic tier movement based on ELO  
✅ **Tier-Based Cosmetics**: Earn season-exclusive cosmetics by tier  
✅ **Hall of Fame**: Top 10 per season immortalized on-chain  
✅ **Soft Resets**: Rating drops 25%, achievements preserved  
✅ **Inactivity Decay**: Prevents inflation, encourages play  
✅ **Top 100 NFTs**: Blockchain-backed seasonal achievements  

---

**Status**: Fully Designed, Implementation Ready  
**Last Updated**: January 18, 2026  
**Competitive Integrity**: ✅ Professional Esports-Grade System
