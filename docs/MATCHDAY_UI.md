# 🎬 Match Day UI/UX System

**Broadcast-Level Match Presentation, Tactical Views, Player Condition Indicators, and In-Match Decisions**

Bass Ball's match day UI is designed like a sports broadcast: information-dense but intuitive, tactical but accessible, competitive but fair.

---

## Table of Contents

1. [Pre-Match Lineup Screen](#pre-match-lineup-screen)
2. [Tactical Board View](#tactical-board-view)
3. [Player Condition Indicators](#player-condition-indicators)
4. [In-Match Substitution UI](#in-match-substitution-ui)
5. [Injury & Fatigue Alerts](#injury--fatigue-alerts)
6. [Match Statistics Dashboard](#match-statistics-dashboard)
7. [Post-Match Results Screen](#post-match-results-screen)
8. [Implementation](#implementation)

---

## Pre-Match Lineup Screen

### Team Overview (Before Match Starts)

**Screen Layout: 100% Width, Mobile-Optimized**

```
┌────────────────────────────────────────────────────┐
│ ⚙️ MATCH SETUP                                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  YOUR TEAM              vs      OPPONENT TEAM      │
│  ┌──────────────────┐            ┌──────────────┐  │
│  │  Formation: 4-3-3│            │  Formation: │  │
│  │                  │            │  Opponent is│  │
│  │      ⚫⚫⚫⚫     │            │  adaptive   │  │
│  │    ⚫  ⚫  ⚫     │            │             │  │
│  │      ⚫  ⚫      │            │  (AI plays  │  │
│  │        ⚫       │            │  realistically)
│  │                  │            │             │  │
│  └──────────────────┘            └──────────────┘  │
│                                                    │
│ 📊 YOUR SQUAD STATS:                              │
│ ├─ Avg Mastery: 68%                               │
│ ├─ Team Chemistry: 85% (played 45 matches)         │
│ ├─ Formation Bonus: +3% passing accuracy (4-3-3)  │
│ └─ Formation Match: vs opponent 4-2-3-1 (balanced)│
│                                                    │
│ 🎯 TACTICAL PRESET:                               │
│ ├─ Pressing: Medium (balanced aggression)         │
│ ├─ Line Height: Mid (balanced defense)            │
│ ├─ Play Style: Balanced Build-Up                  │
│ └─ [✓] Lock In  [⚙️] Edit                           │
│                                                    │
│ ⏱️ MATCH STARTS IN: 00:15                          │
│ [▶️ START MATCH NOW]  [👁️ SCOUT OPPONENT]           │
└────────────────────────────────────────────────────┘
```

### Player Lineup Card

**Each Player Shows Key Stat For Their Role**

```
┌─────────────────────────────────┐
│ #4 JOHN SILVA (CB)              │ ← Player name, number, role
│                                 │
│ ████░░░░░░ 89 DEF              │ ← Defense rating (role-specific)
│ ███░░░░░░░ 78 POS              │ ← Positioning
│ ██░░░░░░░░ 65 AER              │ ← Aerial (for CBs)
│ ░░░░░░░░░░ 45 DRI              │ ← Dribbling (irrelevant for CB)
│                                 │
│ Mastery: 72%   [Green indicator]│ ← How good at CB role
│ Fitness: 100%  [Full bar]       │ ← Ready to play
│ Form: ⬆️ Hot   [3 wins]         │ ← Recent performance
│                                 │
│ Recent Stat: 4 tackles/match    │ ← What they're good at
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ #10 MARCUS WILSON (ST)          │
│                                 │
│ ████████░░ 91 FIN              │ ← Finishing (role-specific)
│ ███░░░░░░░ 68 POS              │ ← Positioning
│ ████████░░ 85 PRS              │ ← Press resistance
│ ████████░░ 87 DRI              │ ← Dribbling
│                                 │
│ Mastery: 84%   [Green indicator]│
│ Fitness: 89%   [Slight fatigue] │
│ Form: → Steady [2 goals]        │
│                                 │
│ Recent Stat: 28% conversion     │ ← Goals per shots
└─────────────────────────────────┘
```

### Formation Visualizer (Touch/Click to Adjust)

```
YOUR FORMATION: 4-3-3 (Selected)

         ⚪
      ⚫  ⚫  ⚪
    ⚪  ⚪  ⚪  ⚫
   ⚪  ⚪  ⚪  ⚪

LEGEND:
⚫ = Out of Position (high risk)
⚪ = Optimal Position
⚪ = Adequate Position

TAP PLAYER CARD to see:
- Position strengths/weaknesses
- Formation bonus/penalty
- Swap suggestions
- Role alternatives (hybrid play)
```

---

## Tactical Board View

### Live Tactical Display (During Match)

**Toggle Between: Standard View → Tactical Board**

```
┌────────────────────────────────────────────────┐
│ 🎬 LIVE MATCH: Min 23                          │
│ YOUR TEAM (Blue) 0-1 OPPONENT (Red)            │
├────────────────────────────────────────────────┤
│                                                │
│           ⚫                                    │  YOUR GK
│                                                │
│      ⚫      ⚫      ⚫      ⚫                    │  YOUR DEFENSE (4)
│                                                │
│           ⚫      ⚫      ⚫                      │  YOUR MIDFIELD (3)
│                                                │
│              ⚫  ⚫  ⚫                           │  YOUR ATTACK (3)
│
│              ╔═══════════════════════╗          │
│              ║ BALL POSITION         ║          │  BALL IN PLAY
│              ║ Possession: 45% (You) ║          │  (shows possession %)
│              ╚═══════════════════════╝          │
│
│           🔴     🔴     🔴     🔴               │  OPPONENT DEFENSE (4)
│                                                │
│               🔴     🔴     🔴                  │  OPPONENT MIDFIELD (3)
│                                                │
│                   🔴 🔴 🔴                      │  OPPONENT ATTACK (3)
│                                                │
│           🔴                                    │  OPPONENT GK
│                                                │
├────────────────────────────────────────────────┤
│ 📊 MATCH STATS:                                │
│ Shots: You 4, Opponent 6                       │
│ Passing Accuracy: You 81%, Opponent 75%        │
│ Tackles: You 8, Opponent 12                    │
│ Possession: 45% (You), 55% (Them)              │
└────────────────────────────────────────────────┘
```

### Heat Map View (Player Movement)

```
PRESSING INTENSITY MAP

              Cold        Warm        Hot
              ▓░░░░░░░░░░░░░░░░░░░▓

YOUR TEAM:
         ░░░░░░░░░░░░░░░░░░░░
      ▓▓▓▓▓░░░░░░░░░░░░▓▓▓▓▓  ← High pressing on wings
    ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░▓
   ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░▓▓▓▓
      ▓▓▓▓▓░░░░░░░░░░░░▓▓▓▓

Insight: Your left side (⚪ LB Marcus) is pressing heavy
         Opponent's right winger (🔴 #7) is dominating
         → Consider adjusting left fullback positioning
```

---

## Player Condition Indicators

### Real-Time Condition Display (Sidebar)

```
┌──────────────────────────────┐
│ YOUR SQUAD - REAL TIME       │
├──────────────────────────────┤
│                              │
│ #4 JOHN (CB)    ████░░░░░░  │ ← Fitness 68%
│                  Yellow: Tiring
│ #1 ALEX (GK)    ██████████  │ ← Fitness 100%
│                  Green: Fresh
│ #23 MIKE (FB)   █████░░░░░░ │ ← Fitness 55%
│                  Orange: Very tired
│ #10 MARCUS (ST) ███░░░░░░░░ │ ← Fitness 35%
│                  Red: Critical fatigue
│                  ⚠️ Consider substitution
│ #8 DAVID (CM)   ██████████  │ ← Fitness 100%
│                  Green: Fresh
│                              │
│ [SORT: Fitness] [Filter: Tiring+]
└──────────────────────────────┘
```

### Detailed Player Status Tooltip

**Click any player card to see:**

```
┌─────────────────────────────────┐
│ #10 MARCUS WILSON (ST)          │
│ Position: Striker               │
├─────────────────────────────────┤
│                                 │
│ 📊 CURRENT STATS (This Match):  │
│ ├─ Shots: 4 (2 on target)       │
│ ├─ Goals: 1                     │
│ ├─ Passes: 18/24 (75%)          │
│ ├─ Tackles: 1                   │
│ ├─ Key Passes: 2                │
│ └─ Distance Covered: 8.2 km     │
│                                 │
│ 💪 CONDITION:                   │
│ ├─ Fitness: ███░░ 35% (TIRED)  │
│ ├─ Injury Risk: 🟡 15% (Normal)│
│ ├─ Form: ⬆️ Hot (1 goal)        │
│ └─ Morale: 😐 Neutral           │
│                                 │
│ ⚠️ RECOMMENDATIONS:             │
│ ├─ High fatigue level           │
│ ├─ Not pressing, play defensive │
│ ├─ Consider substitution soon   │
│ └─ Still clinical in box        │
│                                 │
│ [⏱️ SUB OUT]  [💪 PUSH MORE]      │
└─────────────────────────────────┘
```

---

## In-Match Substitution UI

### Substitution Menu (Called When You Press SUB)

```
┌────────────────────────────────────────────────┐
│ ⏱️ SUBSTITUTION (Min 54)                        │
│ REMAINING: 2 subs out of 5 available            │
├────────────────────────────────────────────────┤
│                                                │
│ PLAYER TO REMOVE:  #10 MARCUS WILSON (ST)      │
│ Current Fitness: 35% (Very tired)              │
│ Current Stat: 1 goal, 2 key passes             │
│                                                │
│ ─────────────────────────────────────────      │
│                                                │
│ PLAYERS AVAILABLE TO REPLACE:                  │
│                                                │
│ [ OPTION 1 - Direct Replacement ]              │
│   #19 JAMES (ST, Fresh)                        │
│   └─ Fitness: 100%, Mastery: 76%, Ready        │
│                                                │
│ [ OPTION 2 - Formation Change ]                │
│   Swap 4-3-3 → 4-4-2 (2 subs needed)            │
│   #19 JAMES (ST) + #15 CARLOS (RW→CM)           │
│   └─ New balance: more defensive               │
│                                                │
│ [ OPTION 3 - Tactical Change ]                 │
│   Remove striker, add midfielder               │
│   #21 RYAN (CM, Fresh)                         │
│   └─ Shifts to 4-4-2 defensive                 │
│                                                │
│ [✓ CONFIRM]  [✕ CANCEL]                        │
└────────────────────────────────────────────────┘
```

### Substitution Animation

```
Visual Flow:
1. Leaving player animation:
   - Walks to sideline
   - Receives ovation (crowd noise)
   - Shows match stat summary (floating text)

2. Entering player animation:
   - Runs onto pitch
   - Takes position
   - Receives team greeting

3. UI Update:
   - Player card updates in squad list
   - Condition bar resets to 100%
   - Substitution counter decrements
   - Player appears on tactical board
```

---

## Injury & Fatigue Alerts

### Injury Alert (Real-Time Popup)

**Appears when player injury occurs:**

```
┌─────────────────────────────┐
│ ⚠️  INJURY ALERT            │
├─────────────────────────────┤
│                             │
│ #7 DAVID TORRES (LW)        │
│ Injury: Hamstring Strain    │
│                             │
│ Severity: MODERATE          │
│ ├─ 50% fitness loss         │
│ ├─ Can continue (risky)     │
│ └─ ~10 min recovery likely  │
│                             │
│ RECOMMENDATION:             │
│ → Substitute immediately    │
│                             │
│ [⏱️ SUB OUT]  [Continue Playing]
└─────────────────────────────┘
```

### Fatigue Warning System

```
Fatigue Thresholds:

GREEN (100-75%):    "Fresh & Ready"
                    ✓ Optimal performance
                    ✓ No risk of injury

YELLOW (74-50%):    "Getting Tired"
                    ⚠️ Performance -5%
                    ⚠️ Injury risk +5%
                    → Consider rotation

ORANGE (49-25%):    "Very Tired"
                    ⚠️ Performance -15%
                    ⚠️ Injury risk +20%
                    → Should substitute

RED (24-0%):        "Exhausted"
                    ⚠️ Performance -30%
                    ⚠️ Injury risk +40%
                    → MUST substitute
                    ⚠️ Auto-removed if 0%
```

### Recovery Mechanics During Match

```
Fatigue Decay During Play:
├─ Passive: -1% fitness per 2 minutes
├─ Running (normal): -1.5% per 2 minutes
├─ Sprinting: -3% per 2 minutes
├─ Pressing hard: -2.5% per 2 minutes
└─ Walking back: -0.5% per 2 minutes

Fitness Recovery:
├─ On bench (per 2 min): +2% (rest well)
├─ Tactical substitution: +50% instant boost
└─ Half-time break: +15% (all players)

Example:
- Min 0: Marcus at 100%
- Min 23 (all sprinting): Down to 77%
- Min 35: Substituted out → 77%
- Min 45: Half-time break → 92%
- Min 67: Back on → Starts at 92%
```

---

## Match Statistics Dashboard

### Real-Time Stats (Visible Anytime)

```
┌────────────────────────────────────────┐
│ 🏟️ LIVE STATS - Minute 67             │
├────────────────────────────────────────┤
│                                        │
│ POSSESSION:                            │
│ You: ███████░░ 47%                     │
│ Opp: ██████░░░ 53%                     │
│                                        │
│ SHOTS:                                 │
│ You: 6 (4 on target) • Opp: 8 (5)     │
│                                        │
│ PASSING ACCURACY:                      │
│ You: 82% (114/139) • Opp: 76% (98/129)│
│                                        │
│ TACKLES:                               │
│ You: 12 • Opp: 15                      │
│                                        │
│ INTERCEPTIONS:                         │
│ You: 5 • Opp: 7                        │
│                                        │
│ FOULS COMMITTED:                       │
│ You: 2 • Opp: 3                        │
│                                        │
│ BALL RECOVERY:                         │
│ You: 45% • Opp: 55%                    │
│                                        │
│ DANGEROUS PLAYS:                       │
│ You: 3 counter-attacks • Opp: 2       │
│                                        │
│ [More Stats] [Player Breakdown]        │
└────────────────────────────────────────┘
```

### Player-by-Player Breakdown

```
INDIVIDUAL STATS - TOP PERFORMERS

YOUR TEAM:
┌─ #8 David (CM):    Passes 34/38 (89%), Tackles 4, Interceptions 3
├─ #10 Marcus (ST):  Shots 4 (2 on target), 1 goal, 2 key passes
├─ #4 John (CB):     Tackles 5, Interceptions 2, Clearances 6
└─ #15 Carlos (RM):  Dribbles 6/8 (75%), Crosses 4 (50% accurate)

OPPONENT TEAM:
┌─ #9 Striker:       Shots 6 (4 on target), 2 goals
├─ #5 CB:            Tackles 7, Clearances 8
├─ #6 CDM:           Interceptions 4, Ball Recovery 8
└─ #11 LW:           Dribbles 8/11 (73%), Key Passes 3
```

---

## Post-Match Results Screen

### Match Summary (After Final Whistle)

```
┌─────────────────────────────────────────────────┐
│ 🏁 FINAL RESULT                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│           YOU: 2                                │
│                 vs                              │
│        OPPONENT: 1                              │
│                                                 │
│ ✓ VICTORY!                                      │
│ 📊 ELO: +18  (1892 → 1910)                      │
│ 🏅 Rank: Diamond III → Diamond II (progressing)│
│                                                 │
├─────────────────────────────────────────────────┤
│ MATCH HIGHLIGHTS:                              │
│                                                 │
│ ⚽ Goal 1: Min 23  #10 Marcus  (Header)        │
│ ⚽ Goal 2: Min 58  #15 Carlos  (Right foot)   │
│ 🥅 Goal 3: Min 71  #9 Opponent (Penalty)       │
│                                                 │
│ 🏆 BEST PLAYER (YOUR TEAM):                    │
│    #10 MARCUS - 1 goal, 2 key passes, 4 shots  │
│                                                 │
│ 📈 MASTERY GAINS:                              │
│    CB Mastery: +1.2% (victory bonus)            │
│    ST Mastery: +2.5% (scored goal)              │
│    CM Mastery: +1.8% (controlled tempo)         │
│                                                 │
│ 💎 LOOT EARNED:                                │
│    ├─ 50 XP (match completion)                 │
│    ├─ 15 XP (victory)                          │
│    ├─ 8 XP (mastery gains)                     │
│    └─ Total: 73 XP toward next cosmetic tier   │
│                                                 │
│ 📊 FULL MATCH STATS:                           │
│    [VIEW DETAILED STATS]                       │
│                                                 │
│ 🎬 REPLAY:                                     │
│    [SAVE REPLAY] [SHARE TO FARCASTER]           │
│                                                 │
│ [◀ MAIN MENU] [🎮 NEXT MATCH]                   │
└─────────────────────────────────────────────────┘
```

### Post-Match Player Stats Sheet

```
┌─────────────────────────────────────────────────┐
│ PLAYER PERFORMANCE SHEET                        │
├─────────────────────────────────────────────────┤
│                                                 │
│ #10 MARCUS WILSON (ST)                          │
│                                                 │
│ Goals: 1           | Assists: 0                 │
│ Shots: 4/6 (67%)   | On Target: 2 (50%)        │
│ Passes: 18/24 (75%)| Key Passes: 2             │
│ Tackles: 1         | Interceptions: 0          │
│ Distance: 9.3 km   | Sprints: 23               │
│                                                 │
│ PERFORMANCE RATING: 7.8/10 (Very Good)         │
│ ├─ Finishing: 8.5 (excellent)                  │
│ ├─ Movement: 7.2 (good)                        │
│ ├─ Passing: 6.8 (acceptable)                   │
│ └─ Defense: 5.0 (lacking)                      │
│                                                 │
│ MASTERY BREAKDOWN:                             │
│ ├─ Finishing Expert progress: +2.5%            │
│ ├─ All-Around Threat progress: +1.8%           │
│ └─ Striker Mastery: 84% → 84.2%                │
│                                                 │
│ [Save] [Share]                                 │
└─────────────────────────────────────────────────┘
```

---

## Implementation

### MatchDayUIController Class

```typescript
class MatchDayUIController {
  private match: Match;
  private uiState: 'lineup' | 'match' | 'paused' | 'ended' = 'lineup';
  private selectedPlayer: Player | null = null;
  
  // Initialize pre-match screen
  initializeLineupScreen(): void {
    // Display formation selector
    this.renderFormationView();
    
    // Show player cards with stats
    this.renderPlayerCards();
    
    // Show team chemistry, formation bonuses
    this.renderTeamAnalysis();
  }
  
  // Switch to tactical board during match
  toggleTacticalBoard(): void {
    if (this.uiState === 'match') {
      this.renderTacticalBoard();
      this.subscribeToPositionUpdates();
    }
  }
  
  // Update player condition in real-time
  updatePlayerCondition(playerId: string, fitness: number): void {
    const playerCard = document.getElementById(`player-${playerId}`);
    const fitnessBar = playerCard.querySelector('.fitness-bar');
    const fitnessPercentage = (fitness / 100) * 280; // Bar width
    
    // Animate fitness bar reduction
    fitnessBar.style.width = `${fitnessPercentage}px`;
    
    // Update color based on threshold
    if (fitness > 75) {
      fitnessBar.className = 'fitness-bar green';
    } else if (fitness > 50) {
      fitnessBar.className = 'fitness-bar yellow';
    } else if (fitness > 25) {
      fitnessBar.className = 'fitness-bar orange';
    } else {
      fitnessBar.className = 'fitness-bar red';
      // Show substitution warning
      this.showFatigueWarning(playerId);
    }
  }
  
  // Handle substitution request
  openSubstitutionMenu(playerId: string): void {
    const player = this.match.getPlayer(playerId);
    const benchPlayers = this.match.getBenchPlayers();
    
    // Filter to same role or compatible roles
    const compatiblePlayers = benchPlayers.filter(
      p => p.role === player.role || this.isRoleCompatible(p.role, player.role)
    );
    
    // Render substitution modal
    this.renderSubstitutionModal(player, compatiblePlayers);
  }
  
  // Confirm substitution
  confirmSubstitution(outPlayerId: string, inPlayerId: string): void {
    this.match.performSubstitution(outPlayerId, inPlayerId);
    
    // Animate players
    this.animateSubstitution(outPlayerId, inPlayerId);
    
    // Update UI
    this.updatePlayerCard(inPlayerId);
    this.closeSubstitutionModal();
  }
  
  // Show injury alert
  showInjuryAlert(playerId: string, injury: InjuryData): void {
    const alert = document.createElement('div');
    alert.className = 'injury-alert';
    alert.innerHTML = `
      <h3>⚠️ Injury Alert</h3>
      <p>${this.match.getPlayer(playerId).name}</p>
      <p>Injury: ${injury.type}</p>
      <p>Severity: ${injury.severity}</p>
      <button onclick="substitutePlayer('${playerId}')">Substitute</button>
      <button onclick="continue()">Continue</button>
    `;
    document.body.appendChild(alert);
  }
  
  // Update live stats
  updateMatchStats(stats: MatchStats): void {
    const statsPanel = document.querySelector('.stats-panel');
    statsPanel.innerHTML = `
      <div class="stat-row">
        <span>Possession</span>
        <div class="stat-bar">
          <div class="your-stat" style="width: ${stats.possession}%"></div>
        </div>
        <span>${stats.possession}%</span>
      </div>
      <div class="stat-row">
        <span>Shots</span>
        <span>${stats.yourShots} - ${stats.oppShots}</span>
      </div>
      <div class="stat-row">
        <span>Pass Accuracy</span>
        <span>${stats.yourPassAccuracy}% - ${stats.oppPassAccuracy}%</span>
      </div>
      <!-- More stats... -->
    `;
  }
  
  // Render post-match summary
  renderPostMatchScreen(result: MatchResult): void {
    const screen = document.querySelector('.post-match-screen');
    screen.innerHTML = `
      <h1>${result.winner === 'you' ? '✓ VICTORY!' : '✗ DEFEAT'}</h1>
      <p>${result.yourGoals} - ${result.oppGoals}</p>
      <div class="highlights">
        ${result.goalEvents.map(goal => `
          <div class="goal">
            <span>${goal.minute}'</span>
            <span>${goal.player}</span>
          </div>
        `).join('')}
      </div>
      <div class="rewards">
        <p>ELO: +${result.eloGain}</p>
        <p>Mastery: ${result.masteryGains.join(', ')}</p>
      </div>
    `;
  }
  
  private isRoleCompatible(role1: Role, role2: Role): boolean {
    const compatibilityMap = {
      'CB': ['CB', 'FB'],
      'FB': ['FB', 'CB', 'DM'],
      'DM': ['DM', 'CM', 'FB'],
      'CM': ['CM', 'DM', 'AM'],
      'AM': ['AM', 'CM', 'Winger'],
      'Winger': ['Winger', 'AM', 'FB'],
      'ST': ['ST'],
    };
    return compatibilityMap[role2].includes(role1);
  }
}
```

---

## Match Day UI Summary

✅ **Pre-Match Clarity**: Formation visualization, player stats, team chemistry  
✅ **Tactical Depth**: Heatmaps, positioning analysis, pressing intensity  
✅ **Real-Time Condition**: Fitness bars, injury alerts, fatigue warnings  
✅ **Smart Substitutions**: Position-aware recommendations, tactical swaps  
✅ **Broadcast Quality**: Match stats, player performance, highlight moments  
✅ **Post-Match Insights**: Mastery gains, ELO changes, replay saving  

---

**Status**: Fully Designed, Implementation Ready  
**Last Updated**: January 18, 2026  
**UI/UX Standard**: ✅ Professional Esports Grade
