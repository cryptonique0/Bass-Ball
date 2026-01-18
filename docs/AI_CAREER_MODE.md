# AI Career Mode: Play Against Realistic Opponents

## Vision

Instead of only playing ranked matches against humans, players can pursue a **career mode** where they manage a team progression through seasons, facing AI opponents generated from **real player behavior data**. This creates a single-player narrative arc that builds long-term investment while improving their game against diverse tactical styles.

The key: AI opponents aren't "difficult," they're **authentic**. They play like real pros do—same formations, same tendencies, same weaknesses.

---

## 1. AI Opponent Generation from Player Behavior Data

### 1.1 Player Profile Extraction

Every match produces behavioral data:

- **Formation preferences**: What % of time they use each formation?
- **Role tendencies**: How do they play GK vs CB vs RB vs CM vs ST?
- **Passing patterns**: Short/long distribution, directional bias, tempo?
- **Pressing behavior**: Do they press high or drop deep?
- **Set piece approach**: Corners/free kicks—do they go near post, far post, short?
- **Risk tolerance**: How often do they attempt risky passes vs safe possession?
- **Tactical adjustments**: How do they respond when losing? Adopting defensive or attacking changes?
- **Player movement patterns**: Where do they position themselves off-ball?

**Data Collection Method:**

```typescript
interface PlayerBehaviorProfile {
  playerId: string;
  seasonId: string;
  
  // Formation tendencies (% usage)
  formations: {
    "4-3-3": 0.35,
    "4-2-3-1": 0.30,
    "3-5-2": 0.20,
    "5-3-2": 0.15,
  };
  
  // Role-specific stats
  rolePerformance: {
    [role: string]: {
      playTime: number;         // minutes played
      successRate: number;      // % of actions succeeded
      riskTolerance: number;    // 0-100 scale (50 = balanced)
      passAccuracy: number;     // % of passes completed
      pressIntensity: number;   // 0-100 (0 = never press, 100 = always press)
    }
  };
  
  // Tactical patterns
  tacticalPatterns: {
    buildUpPlay: "short" | "long" | "mixed";
    defensiveShape: "compact" | "spread" | "highPress";
    counterattackFrequency: number;  // attacks/90 min
    setpieceTendency: "offensive" | "defensive" | "balanced";
  };
  
  // Seasonal trend (improving or declining?)
  trendVector: number;  // -1 to +1 (declining to improving)
}
```

### 1.2 AI Agent Construction

Create an AI opponent with the extracted profile:

```typescript
class AIOpponent {
  profile: PlayerBehaviorProfile;
  currentForm: number;  // 0-1 (affects performance variance)
  matchContext: {
    scoreline: string;     // 0-0, 1-0, etc
    timeElapsed: number;
    possession: number;    // %
  };

  // Simulate decision for next action
  decideFormation(): Formation {
    // Sample from player's formation distribution
    const rand = Math.random();
    let cumulative = 0;
    for (const [formation, probability] of Object.entries(this.profile.formations)) {
      cumulative += probability;
      if (rand < cumulative) return formation as Formation;
    }
  }

  decidePassTarget(): Player {
    // Based on role + tactical pattern + match context
    const riskTolerance = this.profile.rolePerformance[this.currentRole].riskTolerance;
    const tacticalBias = this.profile.tacticalPatterns.buildUpPlay;
    
    if (riskTolerance < 40 || tacticalBias === "short") {
      return this.selectNearestTeammate();  // Safe pass
    } else if (riskTolerance > 70 || tacticalBias === "long") {
      return this.selectForwardPass();      // Risky progression
    } else {
      return Math.random() > 0.5 ? 
        this.selectNearestTeammate() : 
        this.selectForwardPass();           // Mixed
    }
  }

  decidePressIntensity(): number {
    const intensity = this.profile.rolePerformance[this.currentRole].pressIntensity;
    const trailingByGoals = this.calculateGoalDeficit();
    
    // Increase pressing if losing
    if (trailingByGoals > 0) {
      return Math.min(100, intensity + (trailingByGoals * 15));
    }
    return intensity;
  }

  decideSetpieceTactic(): "offensive" | "defensive" | "balanced" {
    const tendency = this.profile.tacticalPatterns.setpieceTendency;
    
    // Adjust based on match state
    if (this.isWinning()) return "defensive";  // Defensive set pieces
    if (this.isLosing()) return "offensive";   // Aggressive set pieces
    return tendency;                           // Default tendency
  }
}
```

---

## 2. Difficulty Scaling and Player Matching

### 2.1 Dynamic Difficulty

AI opponents don't have fixed "easy/normal/hard" modes. Instead, difficulty emerges from **which real player profile they inherit**.

**Difficulty Tiers (by real player ranking):**

| Tier | ELO Range | Source | Behavior |
|------|-----------|--------|----------|
| **Amateur** | 800-1200 | Low-rank players | High error rates, predictable patterns, weak positioning |
| **Semi-Pro** | 1200-1600 | Ranked grinders | Consistent, fewer mistakes, tactical awareness |
| **Professional** | 1600-2000 | Top 10% players | Multi-layered tactics, adaptation, set piece mastery |
| **Elite** | 2000-2400 | Top 1% (pro competitors) | Perfect execution, game-reading, exploit-finding |
| **Mythical** | 2400+ | Hall of fame players | Pattern variation, psychological pressure, legacy tactics |

**Career Progression:**

```typescript
class CareerMode {
  player: Player;
  season: number;
  division: "League" | "Champions" | "Elite";
  opponents: AIOpponent[];

  // Generate next opponent based on difficulty curve
  generateNextOpponent(): AIOpponent {
    // Difficulty should match player's current skill
    const playerElo = this.player.getRankedElo();
    
    // Early season: easier opponents (build confidence)
    const earlySeasonBonus = this.getCurrentMatchday() < 10 ? -200 : 0;
    
    // Target difficulty slightly above player skill
    const targetElo = playerElo + 100 + earlySeasonBonus;
    
    // Sample real player profile near target difficulty
    const realPlayer = database.samplePlayerNearElo(targetElo);
    return new AIOpponent(realPlayer.behaviorProfile);
  }

  // Opponent pool grows as player improves
  getAvailableOpponents(): AIOpponent[] {
    const divisions = {
      "League": this.generateLeaguePlayers(),        // Tiers 1-3
      "Champions": this.generateChampionsPlayers(),  // Tiers 2-4
      "Elite": this.generateElitePlayers(),          // Tiers 3-5
    };
    return divisions[this.division];
  }
}
```

### 2.2 Form and Performance Variance

AI opponents don't play identically every match. They have form:

```typescript
interface AIOpponentForm {
  basePerformance: number;  // 0-1, from behavior profile
  currentForm: number;      // 0-1, fluctuates match-to-match
  matchHistory: {
    won: number;
    lost: number;
    streak: "winning" | "losing" | "neutral";
  };
  
  // Momentum affects decision quality
  getDecisionAccuracy(): number {
    // Hot streak → more confident, riskier decisions
    if (this.matchHistory.streak === "winning") {
      return this.basePerformance * 1.15 + 0.05;  // +15% better
    }
    // Cold streak → more cautious, conservative
    if (this.matchHistory.streak === "losing") {
      return this.basePerformance * 0.85;         // −15% worse
    }
    return this.basePerformance;
  }
}
```

---

## 3. Career Narrative and Progression

### 3.1 Multi-Season Arc

Instead of single matches, careers span **multiple seasons**:

```typescript
class CareerSeason {
  seasonNumber: number;
  matches: number = 38;          // Standard season length
  division: "League" | "Champions" | "Elite";
  opponent_pool: AIOpponent[];
  
  progressionTable: {
    position: number;             // 1st-20th place
    points: number;               // 3 per win, 1 per draw
    goalsDifference: number;
    goalsScoredAgainst: number;
  };

  // Promotion/Relegation
  getEndOfSeasonReward(): Reward {
    if (this.progressionTable.position <= 2) {
      return { promotion: "Champions", cosmetics: "promotion_badge" };
    }
    if (this.progressionTable.position <= 6) {
      return { cosmetics: "playoff_medal", skillPointBonus: 500 };
    }
    if (this.progressionTable.position >= 18) {
      return { relegation: "League", warning: true };
    }
    return { skillPoints: 100 };
  }

  // Mid-season events
  triggerMidSeasonEvent() {
    const rand = Math.random();
    if (rand < 0.3) {
      // Injury: temporary player reduction
      return { type: "injury", duration: 3, affectedRole: "random" };
    }
    if (rand < 0.6) {
      // Momentum: boost from winning streak
      return { type: "momentum", boost: 0.15, duration: 5 };
    }
    if (rand < 0.9) {
      // Tactical challenge: opponent forces style change
      return { type: "tactical_challenge", requiredFormation: "3-5-2" };
    }
    // Cup opportunity: bonus cosmetics
    return { type: "cup_match", cosmetics: "cup_medal" };
  }
}
```

### 3.2 Long-Term Progression

Career mode integrates with ranked progression:

```typescript
class CareerProgression {
  // Career matches improve real ranked ELO
  onCareerMatchComplete(result: "win" | "draw" | "loss") {
    const eloGain = this.calculateEloChange(result);
    
    // Career matches worth 50% ranked ELO
    // (ranked matches are "official," career is learning)
    this.player.adjustRankedElo(eloGain * 0.5);
    
    // But they build up career rank separately
    this.player.adjustCareerElo(eloGain * 1.5);
  }

  // Unlock narrative milestones
  checkNarrativeMilestones() {
    if (this.careerElo > 1500 && !this.unlockedMilestone("semi_pro")) {
      this.unlockMilestone({
        title: "Semi-Professional",
        description: "Reached 1500 career ELO",
        cosmetics: "semi_pro_kit",
        narrative: "You've proven yourself against consistent opponents. Bigger challenges await.",
      });
    }
    
    if (this.seasonsCompleted > 5 && !this.unlockedMilestone("veteran")) {
      this.unlockMilestone({
        title: "Five-Year Veteran",
        description: "Completed 5 full seasons",
        cosmetics: "veteran_badge",
        narrative: "Years of dedication. The game recognizes you.",
      });
    }

    if (this.totalCareerWins > 100 && !this.unlockedMilestone("century")) {
      this.unlockMilestone({
        title: "Century Club",
        description: "100 career match victories",
        cosmetics: "century_outfit",
        narrative: "A century of wins. Legend status approaching.",
      });
    }
  }
}
```

---

## 4. Transfer System and Team Building

### 4.1 Squad Roster Management

Players have a **career squad** that evolves season-to-season:

```typescript
class CareerSquad {
  seasonPlayers: {
    [season: number]: Player[]
  };

  // Squad value calculated from performance
  getSquadValue(): number {
    return this.currentSquad.reduce((sum, p) => sum + p.marketValue, 0);
  }

  // Budget for transfers (increases with success)
  getTransferBudget(): number {
    const basebudget = 1000000;  // $1M
    const leagueBudgetBonus = this.lastSeasonPosition <= 6 ? 500000 : 0;
    const rankingBonus = Math.floor(this.player.rankedElo / 10) * 10000;
    
    return basebudget + leagueBudgetBonus + rankingBonus;
  }

  // Transfer window: buy/sell players
  purchasePlayer(targetPlayer: Player): boolean {
    if (this.getTransferBudget() < targetPlayer.marketValue) {
      return false;  // Can't afford
    }
    this.currentSquad.push(targetPlayer);
    this.transferBudget -= targetPlayer.marketValue;
    return true;
  }

  // Squad loyalty: players leave if unhappy
  onEndOfSeason() {
    for (const player of this.currentSquad) {
      const satisfaction = this.calculatePlayerSatisfaction(player);
      
      if (satisfaction < 0.4) {
        // Player requests transfer
        this.currentSquad = this.currentSquad.filter(p => p.id !== player.id);
        console.log(`${player.name} left the club.`);
      }
    }
  }
}
```

### 4.2 Player Development

Squad players improve through matches:

```typescript
interface CareerSquadPlayer {
  basePlayer: Player;
  careerStats: {
    matchesPlayed: number;
    goalsScored: number;
    assists: number;
    cleanSheets: number;  // for defenders
  };
  
  // Development curve
  getCurrentSkillBonus(): number {
    const matchesPlayed = this.careerStats.matchesPlayed;
    
    // Learning curve: improves quickly at first, plateaus later
    if (matchesPlayed < 10) {
      return matchesPlayed * 2;  // +20% over 10 matches
    }
    if (matchesPlayed < 30) {
      return 20 + (matchesPlayed - 10);  // +10 more by match 30
    }
    return 30;  // Caps at +30 overall
  }

  // Match form
  getFormRating(): number {
    const last5Matches = this.careerStats.recentPerformance.slice(0, 5);
    const average = last5Matches.reduce((a, b) => a + b) / 5;
    return Math.max(0.5, Math.min(1.5, average));  // 0.5x to 1.5x form
  }
}
```

---

## 5. AI Tactical Adaptation

### 5.1 In-Match Adaptation

AI opponents adjust formation and tactics **during matches**:

```typescript
class AITacticalEngine {
  opponent: AIOpponent;
  
  // Every 15 minutes, reassess
  evaluateMatch() {
    const currentSituation = {
      scoreline: this.getScore(),
      possession: this.getPossession(),
      shotAccuracy: this.getAccuracy(),
      playerFatigue: this.analyzeFatigue(),
    };

    // If losing badly, push forward
    if (this.isLosingByMultipleGoals()) {
      this.opponent.switchFormation("4-2-4");  // More attacking
      this.opponent.increasePressingIntensity(+25);
    }

    // If winning, become defensive
    if (this.isWinningByMultipleGoals()) {
      this.opponent.switchFormation("5-3-2");  // Defensive
      this.opponent.dropDefensiveLine(-10);
    }

    // If opponent dominates, change approach
    if (this.opponent.possession < 30 && !this.isWinning()) {
      this.opponent.switchToCounterAttack();
      this.opponent.setTacticalInstruction("transition_speed", 0.9);
    }
  }

  // Learn opponent's weakness during match
  identifyOpponentWeakness() {
    const player = this.match.player;
    
    // Track: what tactics work against this opponent?
    if (player.recentWinStreak > 0) {
      return player.getLastSuccessfulTactic();
    }
    
    // Switch away from player's successful tactic
    const playerWeapon = player.getPreferredFormation();
    const counters = this.opponent.getTacticalCounters(playerWeapon);
    
    return counters[Math.floor(Math.random() * counters.length)];
  }
}
```

### 5.2 Opponent-Specific Scouting

Before each match, player gets **detailed scouting report**:

```typescript
interface ScoutingReport {
  opponentName: string;
  behaviorSummary: string;
  
  // Key tendencies
  formations: Formation[];
  passingStyle: "direct" | "possession" | "mixed";
  defensiveApproach: "aggressive" | "cautious" | "balanced";
  
  // Specific weaknesses
  weaknesses: {
    tactic: string;
    effectiveness: number;  // 0-100
    explanation: string;
  }[];

  // Set piece patterns
  cornerRoutines: string[];
  freeKickTendency: "short" | "long" | "varied";
  
  // Historical matchup
  headToHeadRecord: { wins: number, draws: number, losses: number };
  playerAdvantage: string;
  
  // Confidence rating
  predictedDifficulty: number;  // 1-10
  recommendedFormation: Formation;
}

// Example report:
const report: ScoutingReport = {
  opponentName: "Marco (ELO 1850)",
  behaviorSummary: "Aggressive CB who dominates through pressing and physical play",
  formations: ["4-2-3-1", "4-3-3"],
  passingStyle: "direct",
  defensiveApproach: "aggressive",
  weaknesses: [
    {
      tactic: "Quick through balls",
      effectiveness: 85,
      explanation: "Presses high, leaving space in behind"
    },
    {
      tactic: "Sideways movement in midfield",
      effectiveness: 70,
      explanation: "Struggles with lateral passes, overcommits to pressing"
    }
  ],
  cornerRoutines: ["Near post target", "Far post delivery"],
  freeKickTendency: "short",
  headToHeadRecord: { wins: 1, draws: 1, losses: 2 },
  playerAdvantage: "Slightly disadvantaged in direct play, but good at positioning",
  predictedDifficulty: 7,
  recommendedFormation: "4-3-3" // Wider midfield to exploit pressing gaps
};
```

---

## 6. Career Rewards and Integration

### 6.1 Cosmetics from Career Progression

```typescript
interface CareerReward {
  type: "cosmetics" | "skillPoints" | "narrative" | "title";
  value: string;
}

const CAREER_REWARD_TABLE = {
  // Seasonal achievements
  seasonPosition1: { cosmetics: "gold_medal_kit" },
  seasonPosition2: { cosmetics: "silver_medal_kit" },
  seasonPosition3: { cosmetics: "bronze_medal_kit" },
  
  // Match-based rewards
  fiftyCareerWins: { title: "Club Legend", cosmetics: "legacy_badge" },
  hundredCareerWins: { cosmetics: "century_kit", skillPoints: 1000 },
  
  // Difficulty-based rewards
  defeatEliteTierOpponent: { cosmetics: "giant_slayer_emblem" },
  winAgainstMythicalOpponent: { cosmetics: "hall_of_fame_recognition", title: "Mythical Slayer" },
  
  // Consistency rewards
  seasonUndefeated: { cosmetics: "invincible_kit", skillPoints: 2000 },
  consecutivePromotions: { title: "Rising Star", cosmetics: "ascension_badge" },
};
```

### 6.2 Career Mode × Ranked Mode Synergy

Career matches impact ranked rating (at reduced rate), creating a progression loop:

```typescript
// Career wins → ranked improvement (50%)
careerWin: {
  rankedEloGain: 8,      // vs 16 for ranked match
  careerEloGain: 16,     // career-specific rating
  skillPointsGain: 50,
};

// Ranked wins → career difficulty increase
rankedWin: {
  careerOpponentDifficultyAdjustment: +50,  // next opponent slightly harder
};

// Both feed into cosmetics unlocks
cosmetics: {
  unlockedBy: ["careerMilestones", "rankedAchievements"],
  equalWeight: true,  // $2 cosmetic from career = $2 from ranked
};
```

---

## 7. Implementation Architecture

### 7.1 AI Opponent Class Structure

```typescript
class AIOpponent {
  id: string;
  baseProfile: PlayerBehaviorProfile;  // Real player data
  currentMatch: Match;
  
  private decisionEngine: DecisionEngine;
  private tacticalAdapter: TacticalAdapter;
  private formationController: FormationController;
  
  // Every tick (~100ms), make a decision
  async tick(gameState: GameState): Promise<AIAction> {
    // 1. Evaluate current situation
    const situation = this.analyzeSituation(gameState);
    
    // 2. Decide next action (pass, shoot, move, etc)
    const action = await this.decisionEngine.chooseAction(situation);
    
    // 3. Apply behavioral variance (not perfect execution)
    const varianceAdjustment = this.getExecutionVariance();
    
    // 4. Adapt if needed
    if (this.shouldAdaptTactics(gameState)) {
      this.tacticalAdapter.updateTactics();
    }
    
    return action;
  }

  // Deterministic, reproducible decisions
  private analyzeSituation(gameState: GameState) {
    return {
      ballPosition: gameState.ball.position,
      playerPositions: gameState.players,
      possession: this.getPossessionPercentage(),
      timeElapsed: gameState.time,
      scoreline: gameState.score,
      fatigue: gameState.playerFatigue,
      matchContext: gameState.context,
    };
  }

  // Execution quality varies by form and role
  private getExecutionVariance(): number {
    const baseAccuracy = this.baseProfile.rolePerformance[this.currentRole].successRate;
    const formModifier = this.currentForm.getFormRating();
    return baseAccuracy * formModifier;
  }
}
```

### 7.2 Database Schema

```sql
-- Store real player behavior profiles
CREATE TABLE player_behavior_profiles (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  season_id INTEGER,
  
  -- Formation tendencies (JSON)
  formations JSONB,
  
  -- Role-specific performance
  role_performance JSONB,
  
  -- Tactical patterns
  tactical_patterns JSONB,
  
  -- Trend vector
  trend_vector FLOAT,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Track career progression
CREATE TABLE career_seasons (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES users(id),
  season_number INTEGER,
  division VARCHAR(20),
  
  matches_played INTEGER,
  matches_won INTEGER,
  matches_drawn INTEGER,
  matches_lost INTEGER,
  
  goals_for INTEGER,
  goals_against INTEGER,
  final_position INTEGER,
  
  cosmetics_earned JSONB,
  skill_points_earned INTEGER,
  
  created_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- Match records (career mode)
CREATE TABLE career_matches (
  id UUID PRIMARY KEY,
  career_season_id UUID REFERENCES career_seasons(id),
  player_id UUID REFERENCES users(id),
  opponent_profile_id UUID REFERENCES player_behavior_profiles(id),
  
  result VARCHAR(10),  -- 'win', 'draw', 'loss'
  goals_for INTEGER,
  goals_against INTEGER,
  
  replay_hash VARCHAR(256),  -- for verification
  
  created_at TIMESTAMP
);
```

---

## 8. Why This Matters

**Career mode transforms Bass Ball from a ranked-only game into a complete single-player narrative:**

1. **Learning Tool**: Players improve by facing diverse real opponent styles
2. **Long-term Hook**: Seasons provide multi-month engagement arcs
3. **Competitive Pipeline**: Career success → ranked confidence → faster ELO growth
4. **Content Creator Gold**: Season 1 → Season 10 journey is watchable content
5. **Cosmetics Unlock**: Career rewards feel earned, not P2W

**The Konami Effect**: PES/eFootball has Master League. Every casual player grinds it. The best players use it as preparation for online. Bass Ball needs this too.

---

## 9. Optional: Hall of Fame

Legendary career runs are immortalized:

```typescript
interface HallOfFameEntry {
  player: User;
  season: number;
  division: string;
  finalPosition: number;
  
  undefeatedRecord?: boolean;
  mythicalOpponentDefeats: number;
  totalCareerWins: number;
  
  seasonTitle: string;  // "The Invincibles," "David's Glory," etc
  cosmetics: string[];  // Career kit, trophy, monument
  
  description: string;  // Automatically generated narrative
  // "In Season 7, Marcus defied the odds, defeating 3 Elite-tier 
  //  opponents in a single cup run, cementing his legacy."
  
  nftTrophy?: NFT;  // Optional: commemorative NFT
}

// Hall of Fame is publicly visible
app.get("/halloffame", (req, res) => {
  const topSeasons = db.query(`
    SELECT * FROM career_seasons 
    WHERE final_position <= 2
    ORDER BY season_number DESC
    LIMIT 100
  `);
  
  return res.json(topSeasons);
});
```

---

## 10. Roadmap

### Phase 1: Basic Career Mode (Months 1-2)
- [ ] Extract player behavior profiles from ranked matches
- [ ] Build AI opponent generation system
- [ ] Single season (38 matches) implementation
- [ ] Basic cosmetics rewards

### Phase 2: Career Narrative (Months 3-4)
- [ ] Multi-season progression (5+ seasons playable)
- [ ] Promotion/relegation system
- [ ] Mid-season events (injuries, momentum, etc)
- [ ] Transfer system and squad management

### Phase 3: Tactical Depth (Months 5-6)
- [ ] Opponent-specific scouting reports
- [ ] In-match tactical adaptation
- [ ] Career match → ranked ELO integration
- [ ] Difficulty scaling based on player skill

### Phase 4: Long-Term Content (Months 7+)
- [ ] Hall of Fame system
- [ ] Career milestones and narrative unlocks
- [ ] Seasonal cosmetics (new kits each season)
- [ ] Content creator integrations (streamable careers)

---

## Conclusion

Career mode against realistic AI opponents is the **missing single-player pillar** of Bass Ball. It creates:

- **Learning progression** (casual → competitive)
- **Long-term engagement** (seasons span months)
- **Cosmetics momentum** (earn, don't buy)
- **Content generation** (24-episode career series)

By 2027, when all systems are live, a new player's journey should be:

1. Tutorial (2 hours)
2. Career Mode Season 1 (8-10 hours) ← **you are here**
3. Climb ranked ladder (ongoing)
4. Discover clubs, join communities
5. Master disputes and custom rules
6. Become ranked-legend and content creator

This is the **Konami playbook**, applied to Web3.

