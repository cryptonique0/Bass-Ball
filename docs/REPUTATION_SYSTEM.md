# 👥 Reputation & Rivalry System

**Emotional Rivalry Tracking, Head-to-Head Stats, and Reputation Scoring**

Bass Ball's reputation system captures the **emotional core of football**: rivalries, vendettas, respect, and legendary matchups—separate from ELO rank. Players build reputations through rivalry history, not just wins.

---

## Table of Contents

1. [Reputation System Overview](#reputation-system-overview)
2. [Rival Tracking & Relationship](#rival-tracking--relationship)
3. [Head-to-Head Statistics](#head-to-head-statistics)
4. [Reputation Score & Tiers](#reputation-score--tiers)
5. [Rivalry Events & Challenges](#rivalry-events--challenges)
6. [Reputation Cosmetics & Rewards](#reputation-cosmetics--rewards)
7. [Historic Rivalries & Legacy](#historic-rivalries--legacy)
8. [Implementation](#implementation)

---

## Reputation System Overview

### What is Reputation?

**Reputation** is a separate metric from ELO rank. It measures:
- **Rivalry History**: How many times you've played specific opponents
- **Emotional Bonds**: Wins/losses against rivals, vendetta streaks
- **Respect Points**: Sportsmanship, close matches, come-from-behind wins
- **Legacy**: Legendary matchups, tournament victories together, shared history

```
┌────────────────────────────────────────────┐
│      REPUTATION vs RANKING                 │
├────────────────────────────────────────────┤
│                                            │
│ ELO RANK (Skill)                           │
│ ├─ Measures: Pure skill, wins/losses      │
│ ├─ Tier: Bronze → Godslayer               │
│ ├─ Purpose: Competitive matchmaking       │
│ └─ Volatility: Changes per match           │
│                                            │
│ REPUTATION (Emotion)                       │
│ ├─ Measures: Rivalry, sportsmanship       │
│ ├─ Tier: Newcomer → Legendary Rival       │
│ ├─ Purpose: Social bonding & narrative    │
│ └─ Stability: Reflects historic matchups  │
│                                            │
│ Example:                                   │
│ ├─ Player A: 1,500 ELO (Gold) vs          │
│ │            Reputation 8,500 (Rival)     │
│ │  → High skill, strong rivalry history   │
│                                            │
│ ├─ Player B: 1,800 ELO (Plat) vs          │
│ │            Reputation 1,200 (Newcomer)  │
│ │  → Higher skill, new to rivalries       │
│                                            │
└────────────────────────────────────────────┘
```

---

## Rival Tracking & Relationship

### Rival Definition

A **rival** is any player you've played against 3+ times. Rivals unlock:
- Head-to-head stats view
- Rival notifications (when they're playing)
- Challenge invitations
- Historic rivalry achievements

### Rival Relationship Status

```
RIVAL RELATIONSHIPS:

Newcomer Rival
├─ Matches vs you: 3-5
├─ Status: Fresh history
├─ Emoji: 👤
└─ Example: Just started playing against each other

Familiar Rival
├─ Matches vs you: 6-15
├─ Status: You know their playstyle
├─ Emoji: 🤝
└─ Example: Seen this player multiple times

Bitter Rival
├─ Matches vs you: 16-40
├─ Your record: Loss streak vs them
├─ Status: They consistently beat you
├─ Emoji: ⚔️
└─ Special: Losses count double in rivalry points

Nemesis
├─ Matches vs you: 40+
├─ Your record: Major deficit (win rate <40%)
├─ Status: This player is your kryptonite
├─ Emoji: 😤
└─ Bonus: Beating nemesis gives 3x reputation points

Greatest Rival
├─ Matches vs you: 20+
├─ Your record: Balanced (45-55% win rate)
├─ Status: Closest, most exciting matchups
├─ Emoji: 🏆
└─ Bonus: Every match counts as tournament-level intensity

Friendly Rival
├─ Matches vs you: 15+
├─ Your record: Strong lead (win rate >60%)
├─ Status: You dominate respectfully
├─ Emoji: 😊
└─ Bonus: Win streaks grant "merciful victor" prestige

Legend Rival (Lifetime Achievement)
├─ Matches vs you: 50+
├─ Status: Playing together for 6+ months
├─ Achievement: Unlock "Legend Showdown" cosmetics
├─ Emoji: ⭐
└─ Special: Names displayed as "vs [Legend Name]"
```

### Viewing Rival Relationships

```
RIVALS TAB (In Player Profile):

┌─────────────────────────────────────────────┐
│ YOUR RIVALS (27 total)                      │
│ [Bitter Rivals] [Greatest Rivals] [All]     │
├─────────────────────────────────────────────┤
│                                             │
│ ⚔️ BITTER RIVALS (6):                       │
│ 1. Ahmed (1,650 ELO)                        │
│    ├─ Matches: 23                           │
│    ├─ Your Record: 7-16 (-9)                │
│    ├─ Last Match: Mar 15 (Loss)             │
│    ├─ Streak: 3 losses in a row             │
│    └─ [View H2H] [Challenge] [Block]        │
│                                             │
│ 2. Sarah (1,550 ELO)                        │
│    ├─ Matches: 18                           │
│    ├─ Your Record: 5-13 (-8)                │
│    ├─ Last Match: Mar 10 (Loss)             │
│    └─ [View H2H] [Challenge] [Block]        │
│                                             │
│ 🏆 GREATEST RIVALS (4):                     │
│ 1. James (1,480 ELO)                        │
│    ├─ Matches: 21                           │
│    ├─ Your Record: 11-10 (+1)               │
│    ├─ Last 5: WLWLW (2-3 streak)           │
│    ├─ H2H: Incredibly balanced              │
│    └─ [View H2H] [Challenge] [Pin Rival]    │
│                                             │
│ 🤝 FAMILIAR RIVALS (12):                    │
│ ├─ David, Carlos, Maria, ...                │
│ └─ [Expand]                                 │
│                                             │
│ [Add to Favorites] [Mute Notifications]     │
│                                             │
└─────────────────────────────────────────────┘

Notification When Rival Plays:
├─ (Optional) Get notified: "Ahmed is playing now!"
├─ Can watch live if spectator mode enabled
├─ Can click to challenge: "Rematch?"
└─ Build tournament storylines
```

---

## Head-to-Head Statistics

### H2H Record View

```
HEAD-TO-HEAD RECORD: Ahmed vs You

┌─────────────────────────────────────────────┐
│ LIFETIME RECORD                             │
├─────────────────────────────────────────────┤
│                                             │
│ Matches: 23 | Your Wins: 7 | Their Wins: 16│
│ Win Rate: 30% vs 70%                        │
│ Draw Rate: 0% (No draws in H2H)             │
│                                             │
│ ┌──────────────────────────────┐            │
│ │ W W W L W L L L L W L L L L L L│            │
│ │ [Recent →]                   │            │
│ └──────────────────────────────┘            │
│                                             │
│ Current Streak: 3 losses                    │
│ Longest Streak: 4 wins (Apr 2025)           │
│ Average Score: 1.4 (You) vs 2.1 (Them)     │
│                                             │
│ [View All Matches] [View Stats]             │
│                                             │
└─────────────────────────────────────────────┘

PERFORMANCE BREAKDOWN (Detailed H2H):

┌─────────────────────────────────────────────┐
│ YOUR STATS vs AHMED                         │
├─────────────────────────────────────────────┤
│                                             │
│ Home vs Away:                               │
│ ├─ Home (vs their style): 4-8 (33%)        │
│ ├─ Away (vs their formation): 3-8 (27%)    │
│ └─ Inference: Struggle vs their tactics     │
│                                             │
│ Formation Matchups (You):                   │
│ ├─ 4-3-3: 2-2 (50%)                        │
│ ├─ 3-5-2: 1-5 (17%)  ← Bad matchup         │
│ ├─ 4-2-3-1: 4-9 (31%)                      │
│ └─ Best formation: 4-3-3                    │
│                                             │
│ Formation Matchups (Ahmed):                 │
│ ├─ 4-2-3-1: 7-2 (78%) ← Dominant         │
│ ├─ 4-3-3: 6-3 (67%)                        │
│ ├─ 3-5-2: 3-2 (60%)                        │
│ └─ Your defense struggles most vs 4-2-3-1  │
│                                             │
│ Player Role Performance (vs Ahmed):         │
│ ├─ When you play CM: 3-7 (30%)             │
│ ├─ When you play CB: 2-5 (29%)             │
│ ├─ When you play ST: 2-4 (33%)             │
│ └─ Best role: ST (but small sample)        │
│                                             │
│ Time of Day:                                │
│ ├─ Morning (6-12 AM): 2-4 (33%)            │
│ ├─ Afternoon (12-6 PM): 3-8 (27%)          │
│ ├─ Evening (6-12 PM): 2-4 (33%)            │
│ └─ No clear pattern                        │
│                                             │
│ Monthly Breakdown:                          │
│ ├─ Jan 2025: 1-2                           │
│ ├─ Feb 2025: 1-3                           │
│ ├─ Mar 2025: 2-5                           │
│ ├─ Apr 2025: 2-3                           │
│ └─ May 2025: 1-3 (Most recent)             │
│                                             │
│ [Deep Dive Analysis] [Download CSV]         │
│                                             │
└─────────────────────────────────────────────┘

Last 5 Matches Detail:

Match 1 (Mar 15, 2:02 PM):
├─ Score: 1-2 (Loss)
├─ Your Formation: 4-3-3
├─ Their Formation: 4-2-3-1
├─ Your Goal: 34th min (counter-attack)
├─ Their Goals: 12th, 67th (defensive errors)
├─ Key Stat: Possession 42% vs 58%
└─ [Watch Replay]

Match 2 (Mar 08, 1:45 PM):
├─ Score: 1-2 (Loss)
├─ Your Formation: 3-5-2
├─ Their Formation: 4-3-3
├─ Possession: 38% vs 62%
└─ [Watch Replay]

... 3 more matches
```

### Rivalry Predictions

```
H2H PREDICTION ENGINE:

Based on your last 10 matches vs Ahmed:
├─ Your estimated win rate: 28%
├─ Confidence level: High (10 matches sampled)
├─ Key factor: They beat your 3-5-2 formation
├─ Your strength: Counter-attacking ST role
├─ Their strength: 4-2-3-1 midfield control
└─ Odds: 2:7 (Ahmed favored)

Recommendation:
├─ Try 4-3-3 formation (better matchup, 50% vs 31%)
├─ Play in the morning (no pattern, but try different time)
├─ Focus ST role (33% vs 30% other roles)
└─ Exploit their high line with counter-attacks

Historical Upset (You've Won Before):
├─ Best Match: Apprıl 2025 (4-game win streak)
├─ Formation Used: 4-3-3
├─ Key: Won the midfield battle
└─ Replay: [Available for study]
```

---

## Reputation Score & Tiers

### Reputation Calculation

```
REPUTATION POINTS FORMULA:

reputation_points = Σ(match_weight × relationship_modifier × playstyle_bonus)

Match Weight (by relationship type):
├─ Bitter Rival: 2.0x (losses count double)
├─ Nemesis: 3.0x (beating them = legendary)
├─ Greatest Rival: 2.5x (intensity bonus)
├─ Friendly Rival: 1.5x (wins respected)
├─ Familiar: 1.0x (baseline)
└─ Newcomer: 0.5x (building history)

Playstyle Bonus:
├─ Close match (1-goal margin): +2.0x rep
├─ Upset win (vs higher ELO): +3.0x rep
├─ Comeback win (0-down → win): +4.0x rep
├─ Shutout (0 conceded): +1.5x rep
├─ Tournament setting: +2.0x rep
├─ Community tourney: +3.0x rep
└─ Sportsmanship (no fouls in 90 min): +0.5x rep

Example Calculation:
────────────────────────────────────────
Match: Beat Nemesis (3.0x) in close game (2.0x)
Base rep: +5 points
Total: 5 × 3.0 × 2.0 = +30 reputation points

Match: Lose to Friendly Rival (1.5x)
Base rep: -2 points (loss, but friendly)
Total: -2 × 1.5 = -3 reputation points

Monthly Total Reputation Gain: +847 points
```

### Reputation Tiers

```
REPUTATION TIER PROGRESSION:

Tier         Points Range  Status                Cosmetics
──────────────────────────────────────────────────────────
Newcomer     0-500        New to rivalries       Badge
Rising       501-1,500    Building history       Badge + Icon
Respected    1,501-3,500  Known name             Badge + Icon + Title
Notable      3,501-6,000  Local star             ↓ (adds cosmetics)
Infamous     6,001-9,000  Famous rivalries       ↓
Legendary    9,001-15,000 Iconic player          ↓
Mythical     15,001+      All-time great         ↓ + Special cosmetics

Example Cosmetics Per Tier:

Respected (1,500+ rep):
├─ "Respected Rival" badge (show on profile)
├─ Teal team accent color
└─ +$0.50 cosmetic unlock

Notable (3,500+ rep):
├─ "Notable" title before name
├─ Exclusive jersey (with "Notable" tag)
├─ Arena entrance animation (special walk-on)
└─ +$1.00 cosmetic unlock

Legendary (9,000+ rep):
├─ "Legendary" title (gold text)
├─ Hall of Fame badge (permanent profile)
├─ Signature celebration unlock
├─ Stadium intro with applause
└─ +$5.00 cosmetic unlock (free monthly)

Mythical (15,000+ rep):
├─ "Mythical Rival" title (animated gold)
├─ Exclusive skin (Mythical edition)
├─ Custom goal horn (personal audio)
├─ Name displayed as "[Your Name] - Mythical"
├─ Monthly cosmetics gift ($20 value)
└─ Appear on "All-Time Rivalries" leaderboard
```

---

## Rivalry Events & Challenges

### Challenge System

```
CHALLENGE A RIVAL:

┌──────────────────────────────────────────┐
│ CHALLENGE DIALOG                         │
├──────────────────────────────────────────┤
│                                          │
│ Challenge: Ahmed (1,650 ELO)             │
│                                          │
│ Your Record: 7-16 (30%)                  │
│ Last Match: Mar 15 (You Lost)            │
│                                          │
│ Challenge Type:                          │
│ ◉ Standard 1v1 Match (no rank change)   │
│ ○ Ranked Match (ELO on line)            │
│ ○ Tournament Qualifier (if tourney soon)│
│                                          │
│ Wager (Optional):                        │
│ ○ None (friendly)                       │
│ ○ Cosmetics bet ($5 value)              │
│ ○ Reputation stake (×1.5 rep if win)   │
│                                          │
│ Message (Optional):                      │
│ "Time for a rematch—let's settle this!" │
│                                          │
│ [Send Challenge] [Cancel]                │
│                                          │
└──────────────────────────────────────────┘

Challenge States:

Pending:
├─ Sent to opponent
├─ Expires in 7 days if not accepted
├─ Can withdraw anytime
└─ "Challenge sent to Ahmed"

Accepted:
├─ Both players confirm
├─ Match queued in next 24 hours
├─ Notification: "Ahmed accepted your challenge!"
└─ Rivalry story begins building

Rejected:
├─ Opponent declines
├─ No penalty
├─ Can challenge again after 7 days
└─ "Ahmed declined your challenge"

Expired:
├─ 7 days with no response
├─ Auto-expires, can re-challenge
└─ "Challenge expired. Challenge again?"
```

### Rivalry Story Events

```
RIVALRY EVENTS:

When you play enough against a rival, story moments trigger:

🔥 REVENGE NARRATIVE:
├─ Condition: 4 losses in a row vs rival
├─ Triggered: On next match vs them
├─ Message: "Time for revenge..."
├─ Reward: 2x reputation if you win
├─ UI: Red banner "REVENGE MATCH" during game
└─ Cosmetics: Unlock "Vengeance Seeker" badge

🏆 TOURNAMENT RIVALRY:
├─ Condition: Face rival in tournament (both auto-qualify)
├─ Triggered: Tournament bracket announcement
├─ Message: "[Player Name] vs [Rival Name] - FOR GLORY!"
├─ Reward: 3x reputation for tournament victory
└─ Cosmetics: "Tournament Rival" badge, special jersey

⭐ EPIC COMEBACK:
├─ Condition: Beat rival after 0-goal down at halftime
├─ Triggered: On match end
├─ Message: "LEGENDARY COMEBACK!"
├─ Reward: 4x reputation, special "Comeback King" badge
└─ Cosmetics: Celebration animation unlock

😤 NEMESIS SLAYER:
├─ Condition: Beat nemesis (40+ matches, <40% win rate) after 5-loss streak
├─ Triggered: On match end
├─ Message: "You've defeated your nemesis!"
├─ Reward: 5x reputation, permanent "Nemesis Slayer" title
└─ Cosmetics: Exclusive "Nemesis Slayer" skin unlock

🎭 RESPECTFUL RIVALRY:
├─ Condition: 30 matches vs rival with no red cards (both players)
├─ Triggered: Auto-unlock
├─ Message: "You and [Rival] have a respectful rivalry"
├─ Reward: Unlock "Respectful Rival" cosmetics
└─ Special: Both players get notification + cosmetics

⚔️ HEATED CONFLICT:
├─ Condition: Multiple red cards in same rivalry (any match)
├─ Triggered: On 5th red card against rival
├─ Message: "Your rivalry is getting heated!"
├─ Reward: -1x reputation modifier (rivalry built on tension)
└─ Warning: Can lead to "Toxic Rival" status (hidden)
```

---

## Reputation Cosmetics & Rewards

### Reputation-Only Cosmetics

```
COSMETICS UNLOCK BY REPUTATION TIER:

500 Points (Newcomer):
├─ Newcomer Badge (shows on profile)
└─ Cost: Free (automatic)

1,500 Points (Rising Rival):
├─ Rising Rival Badge
├─ Team Color Accent (secondary color on jersey)
└─ Cost: Free (automatic)

3,500 Points (Respected):
├─ "Respected" title (before name in matches)
├─ Respected Rival Jersey (special team skin)
├─ Arena Entrance Animation (custom walk-on)
├─ Cost: Free (automatic)
└─ Value: Equivalent to $1.00 cosmetics

6,000 Points (Notable):
├─ "Notable" title (gold text)
├─ Notable Rival Skin (exclusive appearance)
├─ Goal Celebration Unlock (unique animation)
├─ Trophy Display (on profile)
├─ Cost: Free (automatic)
└─ Value: Equivalent to $3.00 cosmetics

9,000 Points (Legendary):
├─ "Legendary" title (animated, gold)
├─ Legendary Skin (iconic appearance)
├─ Custom Goal Horn (personal audio/celebration)
├─ Hall of Fame Display (on profile & website)
├─ Monthly Cosmetics Gift (+$5 value/month)
├─ Cost: Free (automatic)
└─ Total Value: Equivalent to $20.00 cosmetics/month

15,000 Points (Mythical):
├─ "Mythical Rival" title (animated, glowing)
├─ Mythical Exclusive Skin (limited edition)
├─ Signature Celebration (named after player)
├─ Custom Stadium Intro (personalized music/effects)
├─ Monthly Premium Cosmetics ($20 value/month)
├─ Name in "All-Time Rivalries" Hall of Fame
├─ Cost: Free (automatic)
└─ Total Value: Equivalent to $50.00 cosmetics/month
```

---

## Historic Rivalries & Legacy

### Greatest Rivalries Hall of Fame

```
ALL-TIME GREATEST RIVALRIES:

┌────────────────────────────────────────────┐
│ LEGENDARY RIVALRIES (All-Time)             │
├────────────────────────────────────────────┤
│                                            │
│ #1 Ahmed vs Sarah                          │
│ ├─ Matches: 187 (over 18 months)           │
│ ├─ Record: 98-89 (Ahmed lead)              │
│ ├─ Status: Still Active                    │
│ ├─ Peak Intensity: Season 2 Finals          │
│ └─ [View All Matches] [Watch Highlights]   │
│                                            │
│ #2 ProGamer vs SkillMaster                 │
│ ├─ Matches: 164                            │
│ ├─ Record: 82-82 (Perfectly Balanced!)    │
│ ├─ Status: Retired players (legacy)        │
│ ├─ Iconic Moment: Season 1 Championship    │
│ └─ [View All Matches] [Documentary]        │
│                                            │
│ #3 YourName vs Nemesis                     │
│ ├─ Matches: 156                            │
│ ├─ Record: 120-36 (You dominate)           │
│ ├─ Status: Epic turnaround (9-loss streak) │
│ └─ [View All Matches] [Story]              │
│                                            │
│ ... Top 50 rivalries displayed             │
│                                            │
└────────────────────────────────────────────┘

Rivalry Timeline (Sample):

Season 1 (Months 1-3):
├─ Ahmed vs Sarah: Introduced matchmaking
├─ First encounter: Sarah wins 2-1
└─ Beginning of legendary rivalry

Season 2 (Months 4-6):
├─ 45 matches between them
├─ Sarah takes lead (28-17)
├─ Finals: Ahmed beats Sarah (4-3) for championship
└─ Revenge narrative begins

Season 3 (Months 7-9):
├─ 62 matches between them
├─ Record evens out (45-45 season total)
├─ Regional tournaments with head-to-head
└─ Rivalry reaches peak intensity

Season 4+ (Months 10+):
├─ 80+ additional matches
├─ Legendary status achieved
├─ NFT championship trophy minted
└─ Hall of fame locked in (permanent record)
```

### Rivalry NFTs

```
RIVALRY ACHIEVEMENT NFTs:

Epic Rivalry NFT (Tier 1):
├─ Unlocked at: 50 matches vs same rival
├─ Proof: H2H record stored on-chain
├─ Metadata: Player names, record, memorable moments
├─ Tradeable: Yes (limited supply)
├─ Value: Cosmetics only (no stat impact)
└─ Example: "Ahmed vs Sarah: 50 Matches (Season 1)"

Legendary Rivalry NFT (Tier 2):
├─ Unlocked at: 100 matches vs same rival
├─ Proof: Full replay archive linked
├─ Metadata: Championship moments, comebacks, records
├─ Tradeable: Yes (very rare)
├─ Value: Cosmetics only
└─ Example: "Ahmed vs Sarah: 100 Matches (Legendary)"

Mythical Showdown NFT (Tier 3):
├─ Unlocked at: 150+ matches vs same rival
├─ Proof: Tournament victories together, peak moments
├─ Metadata: Hall of fame biography
├─ Tradeable: No (soul-bound, legacy only)
├─ Value: Cosmetics + prestige
└─ Displayed: Public profile, marketplace (view-only)
```

---

## Implementation

### ReputationSystem Class

```typescript
class ReputationSystem {
  private playerReputation: Map<string, number> = new Map();
  private rivalships: Map<string, Rivalry> = new Map();
  private reputationTiers: Map<string, string> = new Map();
  private headToHeadRecords: Map<string, H2HRecord> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  
  // Create rival relationship
  addRival(player1Id: string, player2Id: string): Rivalry {
    const rivalKey = this.generateRivalKey(player1Id, player2Id);
    
    // Check if already rivals
    let rivalry = this.rivalships.get(rivalKey);
    if (rivalry) {
      rivalry.matchCount++;
      return rivalry;
    }
    
    // Create new rivalry
    rivalry = {
      player1Id,
      player2Id,
      matchCount: 1,
      player1Wins: 0,
      player2Wins: 0,
      draws: 0,
      createdAt: new Date(),
      status: 'newcomer',
      lastMatch: new Date(),
      matchHistory: [],
    };
    
    this.rivalships.set(rivalKey, rivalry);
    return rivalry;
  }
  
  // Record match result for rivalry
  recordRivalryMatch(
    player1Id: string,
    player2Id: string,
    result: 'player1' | 'player2' | 'draw',
    matchData: MatchData
  ): void {
    const rivalKey = this.generateRivalKey(player1Id, player2Id);
    const rivalry = this.rivalships.get(rivalKey);
    if (!rivalry) return;
    
    // Update record
    if (result === 'player1') rivalry.player1Wins++;
    else if (result === 'player2') rivalry.player2Wins++;
    else rivalry.draws++;
    
    rivalry.lastMatch = new Date();
    rivalry.matchHistory.push({
      date: new Date(),
      result,
      score: matchData.score,
      formations: matchData.formations,
      duration: matchData.duration,
    });
    
    // Calculate reputation change
    const repChange = this.calculateReputationChange(
      rivalry,
      result === 'player1' ? player1Id : player2Id,
      matchData
    );
    
    // Award reputation
    if (result === 'player1') {
      this.addReputation(player1Id, repChange);
    } else if (result === 'player2') {
      this.addReputation(player2Id, repChange);
    }
    
    // Update rivalry status
    this.updateRivalryStatus(rivalKey);
    
    // Check for rivalry events
    this.checkRivalryEvents(rivalKey, result);
  }
  
  // Get head-to-head stats
  getHeadToHead(player1Id: string, player2Id: string): H2HRecord {
    const rivalKey = this.generateRivalKey(player1Id, player2Id);
    const rivalry = this.rivalships.get(rivalKey);
    
    if (!rivalry) {
      return {
        matchCount: 0,
        player1Wins: 0,
        player2Wins: 0,
        draws: 0,
        player1WinRate: 0,
        player2WinRate: 0,
        matchHistory: [],
      };
    }
    
    const record: H2HRecord = {
      matchCount: rivalry.matchCount,
      player1Wins: rivalry.player1Wins,
      player2Wins: rivalry.player2Wins,
      draws: rivalry.draws,
      player1WinRate: rivalry.player1Wins / rivalry.matchCount,
      player2WinRate: rivalry.player2Wins / rivalry.matchCount,
      matchHistory: rivalry.matchHistory,
    };
    
    return record;
  }
  
  // Get all rivals for player
  getPlayerRivals(playerId: string): Rival[] {
    const rivals: Rival[] = [];
    
    for (const [key, rivalry] of this.rivalships) {
      if (!key.includes(playerId)) continue;
      
      const otherPlayerId = key.replace(playerId, '').replace(':', '');
      const record = this.getHeadToHead(playerId, otherPlayerId);
      const status = this.getRivalryStatus(record);
      const reputation = this.playerReputation.get(playerId) || 0;
      
      rivals.push({
        rivalId: otherPlayerId,
        matchCount: record.matchCount,
        winRate: record.player1WinRate,
        status,
        lastMatch: rivalry.lastMatch,
        reputation,
      });
    }
    
    // Sort by match count (most matches = strongest rivalry)
    return rivals.sort((a, b) => b.matchCount - a.matchCount);
  }
  
  // Calculate reputation change
  private calculateReputationChange(
    rivalry: Rivalry,
    winnerId: string,
    matchData: MatchData
  ): number {
    let baseRep = 5; // Base reputation for a win
    
    // Multiplier by relationship type
    const winRate = rivalry.player1Wins / rivalry.matchCount;
    let relationshipMult = 1.0;
    
    if (winRate < 0.4) {
      relationshipMult = 3.0; // Nemesis (beating someone you rarely beat)
    } else if (winRate < 0.45) {
      relationshipMult = 2.5; // Greatest rival (balanced)
    } else if (winRate < 0.5) {
      relationshipMult = 2.0; // Bitter rival
    } else if (winRate < 0.6) {
      relationshipMult = 1.5; // Friendly rival
    } else {
      relationshipMult = 1.0; // Familiar
    }
    
    // Playstyle bonuses
    let playstyleBonus = 1.0;
    
    if (matchData.score.margin <= 1) {
      playstyleBonus *= 2.0; // Close match
    }
    
    if (matchData.isUpset) {
      playstyleBonus *= 3.0; // Beat higher ELO
    }
    
    if (matchData.isComeback) {
      playstyleBonus *= 4.0; // Came from behind
    }
    
    if (matchData.isTournament) {
      playstyleBonus *= 2.0; // Tournament setting
    }
    
    const totalRep = baseRep * relationshipMult * playstyleBonus;
    return Math.round(totalRep);
  }
  
  // Add reputation to player
  private addReputation(playerId: string, amount: number): void {
    const current = this.playerReputation.get(playerId) || 0;
    const newReputation = Math.max(0, current + amount);
    this.playerReputation.set(playerId, newReputation);
    
    // Update tier
    this.updatePlayerTier(playerId, newReputation);
  }
  
  // Get reputation tier
  private updatePlayerTier(playerId: string, reputation: number): void {
    let tier = 'Newcomer';
    
    if (reputation >= 15000) tier = 'Mythical';
    else if (reputation >= 9000) tier = 'Legendary';
    else if (reputation >= 6000) tier = 'Infamous';
    else if (reputation >= 3500) tier = 'Notable';
    else if (reputation >= 1500) tier = 'Respected';
    else if (reputation >= 500) tier = 'Rising';
    
    this.reputationTiers.set(playerId, tier);
  }
  
  // Check for rivalry events
  private checkRivalryEvents(
    rivalKey: string,
    result: 'player1' | 'player2' | 'draw'
  ): void {
    const rivalry = this.rivalships.get(rivalKey);
    if (!rivalry) return;
    
    const winnerId = result === 'player1' ? rivalry.player1Id : rivalry.player2Id;
    
    // Check for revenge narrative
    const recentMatches = rivalry.matchHistory.slice(-4);
    const recentWins = recentMatches.filter(
      m => (m.result === 'player1' && winnerId === rivalry.player1Id) ||
           (m.result === 'player2' && winnerId === rivalry.player2Id)
    ).length;
    
    if (recentMatches.length === 4 && recentWins === 0 && result !== 'draw') {
      this.triggerRivalryEvent(winnerId, 'REVENGE_NARRATIVE');
    }
    
    // Check for comebacks
    if (rivalry.matchHistory.length > 0) {
      const lastMatch = rivalry.matchHistory[rivalry.matchHistory.length - 1];
      if (lastMatch.score[1] === 0 && lastMatch.result !== 'draw') {
        this.triggerRivalryEvent(winnerId, 'EPIC_COMEBACK');
      }
    }
  }
  
  private triggerRivalryEvent(playerId: string, eventType: string): void {
    // Unlock cosmetics, badge, or special UI
    this.awardRivalryCosmetic(playerId, eventType);
  }
  
  private awardRivalryCosmetic(playerId: string, cosmeticType: string): void {
    // Award cosmetics based on event
    // (Integration with cosmetics system)
  }
  
  // Challenge system
  createChallenge(
    challengerId: string,
    defenderId: string,
    type: 'friendly' | 'ranked' | 'tournament'
  ): Challenge {
    const challengeId = this.generateChallengeId();
    
    const challenge: Challenge = {
      id: challengeId,
      challengerId,
      defenderId,
      type,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      message: '',
    };
    
    this.challenges.set(challengeId, challenge);
    return challenge;
  }
  
  // Accept challenge
  acceptChallenge(
    challengeId: string,
    defenderId: string
  ): void {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.defenderId !== defenderId) {
      throw new Error('Challenge not found or invalid defender');
    }
    
    challenge.status = 'accepted';
    // Queue match between players
  }
  
  // Decline challenge
  declineChallenge(
    challengeId: string,
    defenderId: string
  ): void {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.defenderId !== defenderId) {
      throw new Error('Challenge not found or invalid defender');
    }
    
    challenge.status = 'declined';
  }
  
  // Get reputation stats
  getReputationStats(playerId: string): ReputationStats {
    const reputation = this.playerReputation.get(playerId) || 0;
    const tier = this.reputationTiers.get(playerId) || 'Newcomer';
    const rivals = this.getPlayerRivals(playerId);
    
    return {
      reputation,
      tier,
      totalRivals: rivals.length,
      greatestRivals: rivals.filter(r => r.status === 'greatest'),
      bitterRivals: rivals.filter(r => r.status === 'bitter'),
      winRate: this.calculateOverallWinRate(playerId),
    };
  }
}
```

---

## Reputation System Summary

✅ **Rival Tracking**: Automatic rival detection (3+ matches), relationship status displays  
✅ **Head-to-Head Stats**: Lifetime records, formation matchups, role performance, temporal analysis  
✅ **Reputation Score**: Separate from ELO, earned through rivalry & emotion, tiers from Newcomer → Mythical  
✅ **Rivalry Events**: Revenge narratives, comebacks, nemesis slaying, sportsmanship recognition  
✅ **Cosmetics & Rewards**: Cosmetics unlocked by reputation tier ($1-$50 value per month at highest tier)  
✅ **Challenge System**: Send challenges with optional wagers, accept/decline/expire mechanics  
✅ **Hall of Fame**: All-time greatest rivalries, historic matchups, NFT trophies  
✅ **Emotional Layer**: Builds on skill (ELO) with narrative, rivalry storylines, legendary status  

---

**Status**: Fully Designed, Implementation Ready  
**Last Updated**: January 18, 2026  
**Emotional Engagement**: ✅ Rivalry & Reputation System
