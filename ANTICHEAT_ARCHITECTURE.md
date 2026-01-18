# Anti-Cheat System Architecture & Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    BASS BALL - ANTI-CHEAT SYSTEM                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                   MATCH RECORDING FLOW                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Game Ends                                                       │
│     │                                                            │
│     ▼                                                            │
│  ┌─────────────────────────────────────────┐                   │
│  │ MatchData Collected                     │                   │
│  │ - Scores (home/away)                    │                   │
│  │ - Player goals/assists                  │                   │
│  │ - Duration, teams, result               │                   │
│  └─────────────────────────────────────────┘                   │
│     │                                                            │
│     ▼                                                            │
│  ┌──────────────────────────────────────────────┐              │
│  │ GuestModeManager.recordMatch()               │              │
│  │ (guestMode.ts)                              │              │
│  │ - Creates MatchRecord                        │              │
│  │ - Calls MatchValidator.validateMatch()       │              │
│  │ - Returns { player, validation }             │              │
│  └──────────────────────────────────────────────┘              │
│     │                                                            │
│     ├─────────────────────┬───────────────────────┐             │
│     │                     │                       │             │
│     ▼                     ▼                       ▼             │
│  Valid?               Validation             Validation        │
│  Yes=Add to           Issues Found           Complete          │
│  History              ✓ Logged               (stored with      │
│                                              match)            │
│                                                                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│               VALIDATION LAYERS (6 TOTAL)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Score & Result                                        │
│  ├─ Non-negative scores                                         │
│  ├─ Realistic limits (<50)                                      │
│  ├─ Player goals ≤ team score                                   │
│  └─ Result = Calculated outcome                                 │
│                                                                  │
│  Layer 2: Player Performance                                    │
│  ├─ Non-negative stats                                          │
│  ├─ Goals ≤ 10 per match                                        │
│  ├─ Assists ≤ 8 per match                                       │
│  └─ Contribution ratio checks                                   │
│                                                                  │
│  Layer 3: Match Timing                                          │
│  ├─ Duration ≥ 0 minutes                                        │
│  ├─ Duration 20-200 min (bounds)                                │
│  ├─ Date not in future                                          │
│  └─ Date not >2 years old                                       │
│                                                                  │
│  Layer 4: Physical Plausibility                                 │
│  ├─ Goal rate analysis                                          │
│  ├─ Participation ratio                                         │
│  ├─ Realistic limits (0.5-2 goals/90 min)                       │
│  └─ Logical stat combinations                                   │
│                                                                  │
│  Layer 5: Statistical Anomaly                                   │
│  ├─ 3σ (three sigma) analysis                                   │
│  ├─ Compare to player history                                   │
│  ├─ Check career records                                        │
│  ├─ Win streak probability                                      │
│  └─ Form reversal detection                                     │
│                                                                  │
│  Layer 6: Statistical Consistency                               │
│  ├─ MatchStats validation                                       │
│  ├─ Pass accuracy (0-100%)                                      │
│  ├─ Possession totals                                           │
│  └─ Team stat consistency                                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                  VALIDATION SCORING FLOW                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Start: 100 points                                              │
│     │                                                            │
│     ├─ Critical Issue (-20 to -25) ───────────────┐             │
│     │                                             │             │
│     ├─ High Issue (-10 to -15) ──────────────────┤             │
│     │                                             │             │
│     ├─ Medium Issue (-5 to -10) ────────────────┤             │
│     │                                             │             │
│     ├─ Warning (-2 to -8) ───────────────────────┤             │
│     │                                             │             │
│     ▼                                             │             │
│  Final Score = 100 - Σ(deductions)  ◄───────────┘             │
│  Clamped to 0-100                                              │
│     │                                                            │
│     ▼                                                            │
│  Rating Assignment:                                            │
│  ├─ 95-100 ──► ⭐⭐⭐⭐⭐ Excellent                            │
│  ├─ 80-94  ──► ⭐⭐⭐⭐ Good                                    │
│  ├─ 60-79  ──► ⭐⭐⭐ Fair                                      │
│  └─ 0-59   ──► ⭐⭐ Poor                                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│               FAIRNESS VALIDATOR UI FLOW                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Player Opens Profile                                           │
│     │                                                            │
│     ▼                                                            │
│  ┌─────────────────────────────────┐                           │
│  │ Fairness Button with Badge      │                           │
│  │ 🛡️ Fairness 87                  │                           │
│  │         ⚠️ 2 flagged            │                           │
│  └─────────────────────────────────┘                           │
│     │                                                            │
│     ▼                                                            │
│  FairnessValidator Modal Opens                                 │
│  │                                                              │
│  ├─ ┌───────────────────────────────────────┐                 │
│  │  │ Header: 🛡️ Fairness & Integrity      │                 │
│  │  │ Subtitle: Anti-cheat analysis        │                 │
│  │  └───────────────────────────────────────┘                 │
│  │                                                              │
│  ├─ ┌───────────────────────────────────────┐                 │
│  │  │ Fairness Score Card                  │                 │
│  │  │ Score: 87/100                        │                 │
│  │  │ Rating: ⭐⭐⭐⭐ Good                 │                 │
│  │  │ Matches: 25                          │                 │
│  │  │ Flagged: 2                           │                 │
│  │  └───────────────────────────────────────┘                 │
│  │                                                              │
│  ├─ ┌───────────────────────────────────────┐                 │
│  │  │ Player Stats Profile                 │                 │
│  │  │ Avg Goals/Match: 1.2                │                 │
│  │  │ Avg Assists/Match: 0.5              │                 │
│  │  │ Avg Duration: 87'                   │                 │
│  │  │ Total Matches: 25                   │                 │
│  │  └───────────────────────────────────────┘                 │
│  │                                                              │
│  ├─ ┌───────────────────────────────────────┐                 │
│  │  │ Match Validations (Scrollable)       │                 │
│  │  │ [✓] Team A vs Team B (1/25)          │                 │
│  │  │     Score: 98/100 - Valid           │                 │
│  │  │ [⚠️] Team C vs Team D (5/25)         │                 │
│  │  │     Score: 45/100 - 3 Issues       │                 │
│  │  │     ▼ (click to expand)             │                 │
│  │  │     ├─ Goals exceed score          │                 │
│  │  │     ├─ Anomalous performance       │                 │
│  │  │     └─ Form reversal detected      │                 │
│  │  └───────────────────────────────────────┘                 │
│  │                                                              │
│  ├─ ┌───────────────────────────────────────┐                 │
│  │  │ Suspicious Matches Alert (if any)    │                 │
│  │  │ ⚠️ 2 Suspicious Matches Detected    │                 │
│  │  │ Review match data for accuracy      │                 │
│  │  └───────────────────────────────────────┘                 │
│  │                                                              │
│  └─ ┌───────────────────────────────────────┐                 │
│     │ Anti-Cheat Checklist                 │                 │
│     │ ✓ Match Data Validation (Active)    │                 │
│     │ ✓ Anomaly Detection (Active)        │                 │
│     │ ✓ Timing Validation (Active)        │                 │
│     │ ✓ Plausibility Checks (Active)      │                 │
│     │ ✓ Pattern Recognition (Active)      │                 │
│     │ ⏳ Cryptographic Hashing (Coming)   │                 │
│     └───────────────────────────────────────┘                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│            ANOMALY DETECTION: 3σ SIGMA ANALYSIS                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Player History Analysis:                                       │
│  ├─ Calculate: Average Goals/Match = 0.8                        │
│  ├─ Calculate: Std Dev = 0.3                                    │
│  └─ Current Match: Goals = 4.2                                  │
│                                                                  │
│  Deviation Calculation:                                         │
│  deviation = (4.2 - 0.8) / 0.3 = 11.3σ (MASSIVE)              │
│                                                                  │
│  Interpretation:                                                │
│  ├─ 1σ = 68% of values (normal)                                │
│  ├─ 2σ = 95% of values (slightly unusual)                      │
│  ├─ 3σ = 99.7% of values (rare)                                │
│  └─ >3σ = EXTREMELY UNUSUAL (< 0.3% chance)                   │
│                                                                  │
│  Action:                                                        │
│  ⚠️ FLAG: Goals exceed historical average by 11.3σ            │
│     AND goals exceed career max (2 vs 4.2)                     │
│     = VERY SUSPICIOUS                                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                  DATA STORAGE STRUCTURE                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  localStorage['bass_ball_guest_player']                         │
│  {                                                              │
│    "id": "guest_1705590045123_a7x9q2k1",                       │
│    "username": "PlayerName",                                   │
│    "createdAt": 1705590045123,                                 │
│    "stats": {                                                  │
│      "matchesPlayed": 25,                                      │
│      "wins": 18,                                               │
│      "losses": 5,                                              │
│      "draws": 2,                                               │
│      "totalGoals": 30,                                         │
│      "totalAssists": 12                                        │
│    },                                                          │
│    "matchHistory": [                                           │
│      {                                                         │
│        "id": "match_1705590234567",                            │
│        "date": 1705590234567,                                  │
│        "homeTeam": "Team A",                                   │
│        "awayTeam": "Team B",                                   │
│        "homeScore": 3,                                         │
│        "awayScore": 1,                                         │
│        "playerTeam": "home",                                   │
│        "playerGoals": 1,                                       │
│        "playerAssists": 0,                                     │
│        "result": "win",                                        │
│        "duration": 90                                          │
│      },                                                        │
│      ... (more matches, up to 50)                             │
│    ]                                                           │
│  }                                                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    VALIDATION CODE CATEGORIES                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🚫 CRITICAL ISSUES (Block validity)                           │
│  ├─ NEGATIVE_SCORE: homeScore < 0 or awayScore < 0           │
│  ├─ RESULT_MISMATCH: result ≠ calculated                       │
│  ├─ PLAYER_GOALS_EXCEED_TEAM: playerGoals > teamScore         │
│  ├─ NEGATIVE_STATS: playerGoals < 0 or playerAssists < 0     │
│  ├─ NEGATIVE_DURATION: duration < 0                           │
│  ├─ FUTURE_MATCH: date > now                                  │
│  ├─ STATS_GOAL_MISMATCH: statsGoals ≠ matchGoals             │
│  └─ PLAYER_ASSISTS_EXCEED_TEAM: playerAssists > teamAssists  │
│                                                                  │
│  ⚠️ HIGH ISSUES (Lower score)                                  │
│  ├─ UNREALISTIC_SCORE: score > 50                             │
│  ├─ EXCESSIVE_GOALS: playerGoals > 10                         │
│  ├─ EXCESSIVE_ASSISTS: playerAssists > 8                      │
│  └─ UNREALISTIC_GOAL_RATE: goals/min > realistic             │
│                                                                  │
│  📋 WARNINGS (Additional context)                              │
│  ├─ VERY_SHORT_MATCH: duration < 20 min                       │
│  ├─ VERY_LONG_MATCH: duration > 200 min                       │
│  ├─ ANOMALY_GOALS: goals > 3σ above average                   │
│  ├─ ANOMALY_ASSISTS: assists > 3σ above average               │
│  ├─ FORM_REVERSAL: win after poor form                        │
│  ├─ PERFORMANCE_SPIKE: unusual combo of stats                 │
│  ├─ UNLIKELY_STREAK: statistically improbable                 │
│  └─ POSSESSION_MISMATCH: possession totals ≠ 100%            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── PlayerDashboard
│   ├── FairnessButton (🛡️ Fairness 87 ⚠️ 2)
│   │   └── Click → showFairness = true
│   │
│   └── FairnessValidator Modal
│       ├── Header
│       │   ├── Title: "🛡️ Fairness & Integrity"
│       │   └── Close Button
│       │
│       ├── FairnessScoreCard
│       │   ├── Score: 87/100
│       │   ├── Rating: Good ⭐⭐⭐⭐
│       │   ├── Matches: 25
│       │   ├── Flagged: 2
│       │   └── Progress Bar
│       │
│       ├── PlayerStatsProfile
│       │   ├── Avg Goals/Match: 1.2
│       │   ├── Avg Assists/Match: 0.5
│       │   ├── Avg Duration: 87'
│       │   └── Total Matches: 25
│       │
│       ├── MatchValidationList (Scrollable)
│       │   └── MatchValidationRow
│       │       ├── Match Info
│       │       ├── Score Badge
│       │       └── Expandable Details
│       │
│       ├── SuspiciousMatchesAlert (if any)
│       │
│       └── AntiCheatChecklist
│           ├── Active Measures (✓)
│           └── Coming Soon (⏳)
```

---

## Data Flow Diagram

```
Match End Event
      │
      ▼
Get Match Result Data
      │
      ├─ homeTeam, awayTeam
      ├─ homeScore, awayScore
      ├─ playerTeam, playerGoals, playerAssists
      ├─ duration
      └─ timestamp
      │
      ▼
GuestModeManager.recordMatch()
      │
      ├─ Create MatchRecord
      │   └─ Include all data + generate ID
      │
      ├─ Calculate Result
      │   └─ win/loss/draw based on teamScore vs opponentScore
      │
      ├─ MatchValidator.validateMatch()
      │   │
      │   ├─ Layer 1: Score Validation
      │   ├─ Layer 2: Performance Validation
      │   ├─ Layer 3: Timing Validation
      │   ├─ Layer 4: Physical Plausibility
      │   ├─ Layer 5: Anomaly Detection (compare to history)
      │   └─ Layer 6: Statistical Consistency
      │   │
      │   └─ Return ValidationResult {
      │       isValid: boolean,
      │       score: 0-100,
      │       issues: [],
      │       warnings: []
      │     }
      │
      ├─ Check if Suspicious
      │   └─ isSuspicious(validation) → boolean
      │
      ├─ Update Player Stats
      │   ├─ matchesPlayed++
      │   ├─ wins/losses/draws++
      │   ├─ totalGoals += playerGoals
      │   └─ totalAssists += playerAssists
      │
      ├─ Add to Match History
      │   ├─ Unshift (add to beginning)
      │   └─ Prune to 50 matches max
      │
      ├─ Save to localStorage
      │   └─ Entire player object with updated stats
      │
      └─ Return { player, validation }
            │
            ├─ Display to user
            │   ├─ If valid: "Match Verified ✓"
            │   └─ If suspicious: "Review Data ⚠️"
            │
            └─ Show fairness score update
                └─ Recalculate average validation score
```

---

## Scoring Example

```
Match Data:
├─ homeTeam: "Team A", awayTeam: "Team B"
├─ homeScore: 2, awayScore: 3
├─ playerTeam: "away", playerGoals: 5, playerAssists: 2
├─ result: "win"
└─ duration: 90

Validation Process:

Layer 1: Score Validation
├─ Non-negative scores? ✓
├─ Scores < 50? ✓
├─ playerGoals (5) ≤ teamScore (3)? ✗ CRITICAL (-25)
└─ Result matches calculation? 
   └─ teamScore (3) > opponentScore (2) = "win" ✓

Layer 2: Performance
├─ Non-negative? ✓
├─ Goals ≤ 10? ✓
├─ Assists ≤ 8? ✓
└─ Total contribution reasonable? 5+2=7 = OK

Layer 3: Timing
├─ Duration ≥ 0? ✓
├─ Duration 20-200? ✓
├─ Date in future? ✓
└─ Date < 2 years old? ✓

Layer 4: Physical Plausibility
├─ Goal rate: 5/90 = 0.056 goals/min = 5 per 90 min ✓
├─ Player goal rate: 5/90 = 0.056 (high but possible) ✓
└─ Logical: playerGoals > teamScore ✗ CRITICAL (-20)

Layer 5: Anomaly Detection (vs history)
├─ Historical avg goals: 0.5
├─ Current goals: 5
├─ Deviation: (5-0.5)/1 = 4.5σ ⚠️ HIGH (-15)
└─ Career max exceeded? ✓

Layer 6: Statistical Consistency
├─ All stats present? ✓
└─ No conflicts? ✓

FINAL CALCULATION:
Start: 100 points
- Layer 1 Critical: -25
- Layer 4 Critical: -20
- Layer 5 Anomaly: -15
= 40/100 (POOR) 🚫

Result:
✗ INVALID
Score: 40/100
Rating: Poor ⭐⭐
Issues: 2 CRITICAL
  - Player goals exceed team score
  - Result doesn't match calculated outcome
Warnings: 1 HIGH
  - Anomalous performance spike
```

---

This visualization shows the complete architecture, validation layers, UI flow, data structures, and example scoring.
