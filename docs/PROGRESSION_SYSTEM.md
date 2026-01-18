# 📈 Progression System: Skill-Based Growth

**Progression Without Pay-To-Win: Skill Mastery, Playstyle Badges, and Blockchain Verification**

Bass Ball progression is **purely skill-based**. You can't buy better passing; you can only earn it through repetition and precision. Every achievement is blockchain-verified and non-transferable.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Skill Mastery Tracking](#skill-mastery-tracking)
3. [Playstyle Badges](#playstyle-badges)
4. [Progression Mechanics](#progression-mechanics)
5. [Anti-Cheat Verification](#anti-cheat-verification)
6. [Leaderboard Integration](#leaderboard-integration)
7. [Implementation](#implementation)

---

## Philosophy

### Core Principles

**1. Skill, Not Money**
- No stat purchases
- No XP boosters
- No "pay to get better"
- Pure skill expression = progression

**2. Earn Through Repetition**
- 100 accurate passes = +1% passing mastery
- Not gifts or boosters
- Consistency is the only path

**3. Blockchain Verification**
- Every achievement hashed and on-chain
- Prevents cheating (server can't just grant badges)
- Publicly verifiable skill level

**4. Non-Transferable**
- Badges are soul-bound to player account
- Can't sell "press resistant" badge
- Tied to gameplay, not tradeable assets

**5. Meaningful** 
- Badges affect AI behavior (coach recognizes strengths)
- Visible to opponents (reputation system)
- Unlock special cosmetics (cosmetics-only, no stat bonus)

### What You CAN'T Buy

```
❌ Stat upgrades
❌ Passing accuracy boosters
❌ Defensive strength multipliers
❌ Speed improvements
❌ XP accelerators
❌ Achievement shortcuts
❌ Badge substitutes
```

### What You CAN Buy

```
✅ Cosmetics (team colors, player skins, celebrations)
✅ Battle pass cosmetics (cosmetics only)
✅ Custom team names (text only)
✅ Team badges (visual, non-functional)
```

---

## Skill Mastery Tracking

### Mastery Categories

Each player has **7 masteries**, one per role. You progress the mastery of the position you're playing:

```typescript
interface PlayerMastery {
  playerId: string;
  
  // Role-specific masteries (0-100%)
  masteryCB: number;        // Center back mastery
  masteryFB: number;        // Fullback mastery
  masteryDM: number;        // Defensive mid mastery
  masteryCM: number;        // Central mid mastery
  masteryAM: number;        // Attacking mid mastery
  masteryWinger: number;    // Winger mastery
  masteryStriker: number;   // Striker mastery
  
  // Overall mastery (average)
  overallMastery: number;   // Average across roles
  
  // Mastery details
  lastUpdated: number;      // Timestamp
  gamesPlayed: number;      // Total matches
  totalSkillPoints: number; // Cumulative earned
}
```

### Mastery Progression

Mastery gains are **skill-based and match-specific**:

```typescript
interface MasteryGain {
  // Performance factors (0-10 points per match)
  passingAccuracy: number;
  passesUnderPressure: number;
  defensiveTiming: number;
  shotPlacement: number;
  firstTouchQuality: number;
  
  // Match context matters
  playerLevel: number;      // Only gain from close matches
  opponentStrength: number; // Stronger opponents = more mastery
  performanceReward: number; // Bonus for exceptional play
  
  // Calculate mastery gain
  calculateGain(match: Match): number {
    let gain = 0;
    
    // Passing mastery (role-dependent)
    if (match.totalPasses > 20) {
      const accuracy = match.successfulPasses / match.totalPasses;
      gain += accuracy * 3;  // 0-3 points for passing
    }
    
    // Pressure mastery (all roles)
    if (match.passesUnderPressure > 0) {
      const underPressureAccuracy = match.successfulPassesUnderPressure 
                                  / match.passesUnderPressure;
      gain += underPressureAccuracy * 2;  // 0-2 points
    }
    
    // Defensive timing (defenders only)
    if (this.role.isDefender) {
      const tackleSuccessRate = match.successfulTackles / match.tackles;
      gain += tackleSuccessRate * 3;  // 0-3 points
    }
    
    // Shot placement (attackers only)
    if (this.role.isAttacker) {
      const shotAccuracy = match.shotAccuracy;  // 0-1
      gain += shotAccuracy * 4;  // 0-4 points for shooting
    }
    
    // Opponent strength bonus
    const opponentRating = match.opponentTeamAverageRating;
    if (opponentRating > this.playerRating) {
      const strengthBonus = Math.min(
        (opponentRating - this.playerRating) / 100,
        0.5  // Cap bonus at 50%
      );
      gain *= (1 + strengthBonus);
    }
    
    // Max 10 points per match
    return Math.min(gain, 10);
  }
}
```

### Mastery Requirements

**To reach 100% mastery:**
```
0-20%:   50 matches (entry level)
20-40%:  100 matches
40-60%:  150 matches
60-80%:  200 matches
80-100%: 250 matches (2,500+ total matches to max one role)

Total: ~2,500 high-quality matches to master a single role
```

**Example**: Counter Specialist badge requires:
- 100 successful counter-attacks
- 60%+ win rate in counter-attack scenarios
- 500 matches total (proves consistency, not luck)

---

## Playstyle Badges

### Badge System

**Badges are personality traits** earned through repeated behavior:

```typescript
interface PlaystyleBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  
  // Earning criteria (multiple, must meet all)
  requirements: BadgeRequirement[];
  
  // Effects (cosmetic + strategic)
  effects: {
    visual: string;           // Badge appears on profile
    tactical: string;         // Noted by AI/opponents
    cosmetic: string[];       // Unlocked skins
  };
  
  // Blockchain verification
  contractAddress: string;    // NFT contract if tradeable
  verified: boolean;          // On-chain verified
  earnedBy: Set<string>;      // Players who earned it
}
```

### Badge Categories

---

## **Defensive Badges**

### 1. Iron Wall (Defender)
**Earned by**: High tackle success rate + low goal concession

```
Requirements:
- 200+ tackles in 50 matches (4+ tackles per match average)
- 75%+ tackle success rate
- Allow < 1.5 goals per match (defensive efficiency)
- Must reach 70%+ CB or FB mastery

Impact:
- Opponents know you're a strong defender
- AI recognizes defensive expertise
- Unlock "Hardened Defense" cosmetic skin
```

### 2. Press Resistant (Any Role)
**Earned by**: High passing accuracy under pressure

```
Requirements:
- 500+ passes under pressure
- 80%+ pass accuracy under pressure (vs 70% normal)
- 100 matches minimum
- Defender must prove they can handle pressing

Impact:
- Opponents press less (respect for composure)
- Unlock "Calm Passing" celebration
- Better AI decision-making under pressure
```

### 3. Interception Master (Midfielder/Defender)
**Earned by**: Predicting opponent passes

```
Requirements:
- 50+ successful interceptions (actually read the play)
- 75%+ accurate positioning (not lucky)
- 150 matches minimum
- Must have 60%+ positioning stat (skill, not luck)

Impact:
- Shorter reaction time to opponent passes
- Unlock "Mind Reader" cosmetic
- AI considers you dangerous in transition
```

---

## **Offensive Badges**

### 4. Finishing Expert (Striker)
**Earned by**: High shot conversion rate

```
Requirements:
- 100+ shots on target
- 25%+ conversion rate (goals per shot)
- 80+ matches minimum
- Demonstrate consistency (not one-match luck)

Impact:
- Opponents respect shot threat
- Unlock "Lethal Finisher" celebration
- AI prioritizes creating chances for you
```

### 5. Dead Ball Specialist (Any Role)
**Earned by**: Set piece success

```
Requirements:
- 20+ set piece goals (free kicks, corners, penalties)
- 75%+ penalty conversion rate (15+ penalties taken)
- 150+ matches minimum
- Prove set piece mastery

Impact:
- Unlock "Perfect Curve" celebration
- Ball physics responds to your touch (placebo effect + visual polish)
- Unlock premium goal celebration
```

### 6. Counter Specialist (Attacking Mid/Winger)
**Earned by**: Win via quick transitions

```
Requirements:
- 100+ successful counter-attacks
- 60%+ counter-attack goal rate
- Win 60%+ matches where counter-attacks score
- 200+ matches (proves tactical understanding)

Impact:
- Better pace advantage in transitions
- Unlock "Lightning Strike" cosmetic
- Opponents see badge and adjust tactics
```

---

## **Midfield Badges**

### 7. Tempo Master (Central Midfielder)
**Earned by**: Controlled possession, accurate distribution

```
Requirements:
- 5000+ passes
- 85%+ passing accuracy
- 150+ matches minimum
- Average 30+ passes per match (ball in possession)

Impact:
- Ball travels faster off your feet (psychological/visual)
- Unlock "Precision Passer" skin
- AI trusts you with possession (better play)
```

### 8. Box-to-Box Dynamo (Central Midfielder)
**Earned by**: Offensive and defensive contribution

```
Requirements:
- 50+ goals from midfield
- 75+ tackles (defensive contribution)
- 75%+ passing accuracy
- 200+ matches (consistency)

Impact:
- Unlock "Complete Midfielder" cosmetic
- AI recognizes all-around capability
- Tactical versatility
```

---

## **Attacker Badges**

### 9. Dribble Master (Winger)
**Earned by**: Successful 1v1 duels via dribbling

```
Requirements:
- 100+ successful dribbles past opponents
- 70%+ dribble success rate
- 150+ matches minimum
- Prove you can beat defenders consistently

Impact:
- Ball control slightly improved (visual + AI behavior)
- Unlock "Silky Smooth" dribbling animation
- Defenders respect your skill
```

### 10. All-Around Threat (Striker)
**Earned by**: Balanced attacking

```
Requirements:
- 50+ goals
- 20+ assists (not selfish)
- 80%+ pass accuracy while attacking
- 200+ matches (versatility)

Impact:
- Unlock "Complete Striker" skin
- Opponents must respect both finish and creativity
```

---

## **Rarity System**

Badges have **rarity levels** based on difficulty:

| Rarity | Example | Requirements |
|--------|---------|--------------|
| **Common** | Press Resistant | 500 passes, 80% accuracy, 100 matches |
| **Uncommon** | Interception Master | 50 interceptions, 75% positioning, 150 matches |
| **Rare** | Tempo Master | 5000 passes, 85% accuracy, 150 matches |
| **Epic** | Counter Specialist | 100 counters, 60% goal rate, 200 matches |
| **Legendary** | Iron Wall + Tempo Master | Master 2+ roles to 80%+ mastery |

---

## Progression Mechanics

### Progression Curve

Player progression follows **skill curve, not money curve**:

```
Match 1:     Starting (0% mastery)
Match 50:    Competent (20% mastery)
Match 150:   Proficient (50% mastery)
Match 300:   Expert (75% mastery)
Match 500:   Master (90% mastery)
Match 2,500: Grandmaster (100% mastery)

Time to master one role: ~250-400 hours (100-200 matches/season)
```

### Mastery Visualization

Player profile shows:

```
┌─────────────────────────────────────┐
│ Player: John                         │
├─────────────────────────────────────┤
│ Overall Mastery: 65%               │
│                                    │
│ Role Masteries:                    │
│ • CB:      ████░░░░░░ 45%          │
│ • FB:      █████░░░░░ 52%          │
│ • DM:      ██████░░░░ 58%          │
│ • CM:      ████████░░ 78%          │
│ • AM:      █████░░░░░ 52%          │
│ • Winger:  ███████░░░ 70%          │
│ • Striker: ███░░░░░░░ 30%          │
│                                    │
│ Badges Earned: 8                   │
│ ✓ Press Resistant                  │
│ ✓ Tempo Master                     │
│ ✓ Counter Specialist               │
│ ✓ Interception Master              │
│                                    │
│ Cosmetics Unlocked:                │
│ • Precision Passer (skin)          │
│ • Lightning Strike (animation)     │
└─────────────────────────────────────┘
```

### Seasonal Resets

**Mastery resets every season** to keep progression fresh:

```
Current Season (S1): January - March
- Mastery earned: 65%
- Badges earned: 8
- Cosmetics unlocked: 5

Season End (March 31):
- Mastery resets to 0%
- Badges are archived (shown on "Hall of Fame" profile)
- Cosmetics remain unlocked (permanent)
- New season begins with fresh progression

Over time:
- Players who earn same badges multiple seasons = super experienced
- Hall of Fame shows: "Press Resistant (S1, S2, S3)" = 3 seasons
```

---

## Anti-Cheat Verification

### On-Chain Badge Verification

**Every badge is cryptographically verified**:

```typescript
interface BadgeProof {
  badgeId: string;
  playerId: string;
  
  // Evidence of earning
  matchIds: string[];        // Matches that earned badge
  skillStats: {
    tacklesSuccessful: number;
    tacklesTotal: number;
    successRate: number;
  };
  
  // Blockchain anchor
  contractAddress: string;    // Smart contract
  transactionHash: string;    // On-chain transaction
  blockhash: string;          // Block height when earned
  
  // Verification
  verify(): boolean {
    // 1. Fetch match data from IPFS
    const matchData = this.fetchMatchesFromIPFS();
    
    // 2. Recalculate stats
    const calculatedStats = this.calculateStats(matchData);
    
    // 3. Verify stats match on-chain proof
    if (calculatedStats.tacklesSuccessful !== this.skillStats.tacklesSuccessful) {
      return false;  // Stats tampered
    }
    
    // 4. Verify blockhash (prevents replay on different block)
    const blockAtTime = this.getBlockAtTimestamp(this.blockhash);
    if (blockAtTime.hash !== this.blockhash) {
      return false;  // Wrong block, likely cheated
    }
    
    return true;  // Badge is legitimate
  }
}
```

### Anti-Boosting Measures

**Prevent players from boosting each other:**

```typescript
interface AntiBoosting {
  // Same players can't farm together
  maxRepeatOpponents: number = 5;  // Can only play same opponent 5 times/season
  
  // Mastery only counts vs ranked opponents
  opponentMinimumRating: number = 1000;  // Only matches vs decent players count
  
  // Stat padding detection
  detectStatPadding(player: Player): boolean {
    // Example: 50 games, all vs same opponent, 95% win rate
    // Red flag! Likely boosting
    
    if (player.matches.length < 50) return false;  // Too few matches
    
    const uniqueOpponents = new Set(
      player.matches.map(m => m.opponent)
    ).size;
    
    // Less than 20% unique opponents = suspicious
    if (uniqueOpponents / player.matches.length < 0.2) {
      return true;  // Likely boosting
    }
    
    return false;
  }
  
  // Punishment: Revoke badges earned via boosting
  revokeIfBoosting(player: Player): void {
    if (this.detectStatPadding(player)) {
      // Remove all badges earned in last 50 matches
      const suspiciousMatches = player.matches.slice(-50);
      const suspiciousBadges = player.badges.filter(b =>
        suspiciousMatches.some(m => m.earnedBadge === b.id)
      );
      
      // Revoke badges
      for (const badge of suspiciousBadges) {
        this.revokeBadge(player.id, badge.id);
      }
    }
  }
}
```

### Dispute Resolution

**If player claims badge was earned unfairly:**

```typescript
interface BadgeDispute {
  claimerId: string;
  badgeId: string;
  claimReason: string;  // 'stat_padding' | 'server_error' | 'cheat_detected'
  
  // Submit evidence
  challengeBadge(): void {
    // 1. Fetch badge proof from blockchain
    const proof = this.getBadgeProof(this.badgeId);
    
    // 2. Verify proof on-chain (matches, stats, block height)
    if (!proof.verify()) {
      // Badge is fake! Revoke immediately
      this.revokeBadge(proof.playerId, proof.badgeId);
      return;
    }
    
    // 3. Check for stat padding
    if (this.detectStatPadding(proof.playerId)) {
      // Stat padding detected, revoke badge
      this.revokeBadge(proof.playerId, proof.badgeId);
      return;
    }
    
    // 4. If all checks pass, badge is legitimate
    // Dispute rejected
  }
}
```

---

## Leaderboard Integration

### Mastery Leaderboard

**Global ranking by mastery level**:

```
┌─ GLOBAL MASTERY LEADERBOARD ─────────┐
│ Rank │ Player      │ Mastery │ Badges │
├──────┼─────────────┼─────────┼────────┤
│  1   │ ProPlayer23 │ 98%     │ 42     │
│  2   │ SkillMaster │ 95%     │ 38     │
│  3   │ TheTactician│ 92%     │ 35     │
│  4   │ DeadBallKing│ 88%     │ 32     │
│  5   │ FastBreak   │ 85%     │ 28     │
│ ...  │ ...         │ ...     │ ...    │
└──────┴─────────────┴─────────┴────────┘
```

### Role-Specific Leaderboards

**Separate ranking per role**:

```
┌─ CENTER BACK MASTERY ──────────────────┐
│ Rank │ Player      │ CB Mastery │ Badges│
├──────┼─────────────┼────────────┼───────┤
│  1   │ DefenseKing │ 100%       │ 8     │
│  2   │ IronWall    │ 98%        │ 7     │
│  3   │ Interception│ 96%        │ 6     │
└──────┴─────────────┴────────────┴───────┘
```

### Badge-Specific Leaderboards

**Ranking by badge count**:

```
┌─ COUNTER SPECIALIST HALL OF FAME ──────┐
│ 1. CounterAttack89 - Earned S1, S2, S3 │
│ 2. FastBreak      - Earned S2, S3      │
│ 3. TheTactician   - Earned S1          │
└──────────────────────────────────────────┘
```

### Seasonal Rankings

**Resets each season, tracks consistency:**

```
S1 Leaderboard          S2 Leaderboard
1. ProPlayer23          1. TheTactician
2. SkillMaster          2. ProPlayer23
3. TheTactician         3. DeadBallKing

Player's History:
✓ Top 3 S1, Top 2 S2 → Consistent excellence
✓ Earned "Press Resistant" 3 consecutive seasons → Reliable defender
```

---

## Implementation

### SkillProgressionEngine Class

```typescript
class SkillProgressionEngine {
  private playerMasteries: Map<string, PlayerMastery> = new Map();
  private playerBadges: Map<string, PlaystyleBadge[]> = new Map();
  private matchHistory: Map<string, Match[]> = new Map();
  
  // Player completes a match
  recordMatchCompletion(match: Match): void {
    const homePlayer = match.homePlayer;
    const awayPlayer = match.awayPlayer;
    
    // Update masteries for both players
    this.updatePlayerMastery(homePlayer.id, homePlayer.role, match);
    this.updatePlayerMastery(awayPlayer.id, awayPlayer.role, match);
    
    // Check if any badges are earned
    this.checkBadgeEarning(homePlayer.id, match);
    this.checkBadgeEarning(awayPlayer.id, match);
    
    // Log to blockchain
    this.logProgressionToBlockchain(homePlayer.id, match);
    this.logProgressionToBlockchain(awayPlayer.id, match);
  }
  
  // Update mastery for specific role
  private updatePlayerMastery(
    playerId: string,
    role: PlayerRole,
    match: Match
  ): void {
    const mastery = this.getOrCreateMastery(playerId);
    const roleKey = `mastery${role}`;
    
    // Calculate skill points earned
    const skillPointsEarned = this.calculateSkillPoints(playerId, role, match);
    
    // Update role mastery
    const currentMastery = mastery[roleKey] || 0;
    const newMastery = Math.min(currentMastery + skillPointsEarned, 100);
    mastery[roleKey] = newMastery;
    
    // Update overall mastery (average)
    mastery.overallMastery = this.calculateAverageMastery(mastery);
    mastery.lastUpdated = Date.now();
    mastery.totalSkillPoints += skillPointsEarned;
  }
  
  private calculateSkillPoints(
    playerId: string,
    role: PlayerRole,
    match: Match
  ): number {
    let points = 0;
    
    // Passing accuracy (all roles)
    const passingAccuracy = match.getPlayerStatistic(playerId, 'passingAccuracy');
    if (passingAccuracy > 0.75) {
      points += 1 + (passingAccuracy - 0.75) * 2;  // 1-2 points
    }
    
    // Passes under pressure (all roles)
    const underPressureAccuracy = match.getPlayerStatistic(
      playerId,
      'underPressureAccuracy'
    );
    if (match.getPlayerStatistic(playerId, 'passesUnderPressure') > 0) {
      points += underPressureAccuracy * 1.5;  // 0-1.5 points
    }
    
    // Role-specific skills
    if (role.isDefender) {
      const tackleSuccess = match.getPlayerStatistic(playerId, 'tackleSuccessRate');
      points += tackleSuccess * 2;  // 0-2 points
    }
    
    if (role.isAttacker) {
      const shotAccuracy = match.getPlayerStatistic(playerId, 'shotAccuracy');
      points += shotAccuracy * 2;  // 0-2 points
    }
    
    // Opponent strength bonus
    const opponentRating = match.getOpponentAverageRating(playerId);
    const playerRating = this.getPlayerRating(playerId);
    if (opponentRating > playerRating) {
      const bonus = Math.min(
        (opponentRating - playerRating) / 100 * 0.5,
        0.5
      );
      points *= (1 + bonus);
    }
    
    // Cap at 10 points per match
    return Math.min(points, 10);
  }
  
  // Check if player earned any badges this match
  private checkBadgeEarning(playerId: string, match: Match): void {
    const badges = this.getAllBadges();
    
    for (const badge of badges) {
      // Check if player meets all badge requirements
      if (this.meetsRequirements(playerId, badge, match)) {
        this.awardBadge(playerId, badge, match);
      }
    }
  }
  
  private meetsRequirements(
    playerId: string,
    badge: PlaystyleBadge,
    match: Match
  ): boolean {
    // Check all requirements for badge
    for (const req of badge.requirements) {
      if (!this.meetsRequirement(playerId, req, match)) {
        return false;
      }
    }
    return true;
  }
  
  private awardBadge(
    playerId: string,
    badge: PlaystyleBadge,
    match: Match
  ): void {
    // Check if player already has badge
    const playerBadges = this.playerBadges.get(playerId) || [];
    if (playerBadges.some(b => b.id === badge.id)) {
      return;  // Already earned
    }
    
    // Award badge
    playerBadges.push(badge);
    this.playerBadges.set(playerId, playerBadges);
    
    // Log to blockchain (prove ownership)
    this.createBadgeProof({
      badgeId: badge.id,
      playerId,
      matchId: match.id,
      timestamp: Date.now(),
      evidence: this.gatherBadgeEvidence(playerId, badge, match),
    });
    
    // Unlock cosmetics tied to badge
    this.unlockBadgeCosmetics(playerId, badge);
  }
  
  // Get mastery leaderboard
  getMasteryLeaderboard(limit: number = 100): PlayerMastery[] {
    const allMasteries = Array.from(this.playerMasteries.values());
    return allMasteries
      .sort((a, b) => b.overallMastery - a.overallMastery)
      .slice(0, limit);
  }
  
  // Get role-specific leaderboard
  getRoleLeaderboard(role: PlayerRole, limit: number = 100): PlayerMastery[] {
    const allMasteries = Array.from(this.playerMasteries.values());
    const roleKey = `mastery${role}`;
    
    return allMasteries
      .sort((a, b) => b[roleKey] - a[roleKey])
      .slice(0, limit);
  }
  
  // Get badges earned this season
  getSeasonalBadgeLeaderboard(limit: number = 50): Array<{
    player: string;
    badges: PlaystyleBadge[];
  }> {
    const leaderboard = Array.from(this.playerBadges.entries())
      .filter(([_, badges]) => this.isCurrentSeason(badges))
      .map(([playerId, badges]) => ({ player: playerId, badges }))
      .sort((a, b) => b.badges.length - a.badges.length)
      .slice(0, limit);
    
    return leaderboard;
  }
}
```

---

## Progression Summary

✅ **Pure Skill-Based**: Progression via match performance, not money  
✅ **Blockchain-Verified**: All badges on-chain, disputes resolvable  
✅ **Anti-Cheat**: Stat padding detection, boosting prevention  
✅ **Meaningful**: Badges affect gameplay, unlock cosmetics, earn reputation  
✅ **Seasonal**: Fresh starts keep progression fresh, history tracks consistency  
✅ **Transparent**: Leaderboards show exactly who's best at what  

---

**Status**: Design Complete, Implementation Ready  
**Last Updated**: January 18, 2026  
**Anti-P2W Guarantee**: ✅ Enforced via Design
