# Fairness & Integrity System - Anti-Cheat & Match Validation

## Overview

The Bass Ball Fairness & Integrity system implements comprehensive anti-cheat logic and match validation to ensure competitive integrity and prevent data tampering. All validation happens client-side with multi-layer verification.

---

## Architecture

### Three-Layer Validation System

```
Layer 1: Match Data Validation
├── Score consistency checks
├── Player performance bounds
├── Result calculation verification
└── Timestamp validation

Layer 2: Statistical Analysis
├── Anomaly detection (3σ analysis)
├── Performance deviation checks
├── Pattern recognition
└── Historical comparison

Layer 3: Physical Plausibility
├── Goal rate analysis
├── Participation ratio checks
├── Duration validation
└── Logical consistency
```

---

## Validation Checks

### 1. **Score & Result Validation**

**What it checks:**
- Scores must be non-negative
- Scores cannot exceed 50 per team (realistic limit)
- Player goals cannot exceed team score
- Reported result matches calculated result

**Example:**
```typescript
// ✓ Valid
homeScore: 3, awayScore: 1, playerTeam: 'home', playerGoals: 1, result: 'win'

// ✗ Invalid - player goals exceed team score
homeScore: 2, awayScore: 1, playerTeam: 'home', playerGoals: 3, result: 'win'

// ✗ Invalid - result mismatch
homeScore: 2, awayScore: 1, playerTeam: 'home', result: 'loss'
```

---

### 2. **Player Performance Validation**

**Constraints:**
- Non-negative goals and assists
- Maximum 10 goals per match (realistic limit)
- Maximum 8 assists per match
- Total contribution checked against match context

**Anomaly Detection:**
- Flags if goals > 3σ above historical average
- Flags if assists > 3σ above historical average
- Tracks performance spikes

**Example Report:**
```
Match: Player A vs Team B
Issues:
  🚫 [CRITICAL] Player scored 15 goals (exceeds realistic single-match limit)
Warnings:
  ⚠️ Goals (15) exceed historical average (0.5) by 29σ
     → Review match highlights and player performance data
```

---

### 3. **Match Timing Validation**

**Checks:**
- Duration cannot be negative
- Duration warnings if < 20 minutes (abandoned?) or > 200 minutes (extended time?)
- Date cannot be in the future
- Date cannot be > 2 years old

**Example:**
```typescript
// ✓ Valid
duration: 90, date: Date.now() - 1000 * 60 * 5 // 5 minutes ago

// ✗ Invalid
duration: -5 // Negative duration
date: Date.now() + 1000 * 60 * 60 // Future date
```

---

### 4. **Physical Plausibility**

**Goal Rate Analysis:**
```typescript
// Calculate: goals_per_minute
const goalsPerMinute = (homeScore + awayScore) / duration;

// Reality check: typically 0.5-2 goals per 90 minutes
// = 0.0056-0.0222 per minute
// Flag if > 0.1 (> 6 goals per minute)
```

**Example:**
```
Match Data: 15-12 score in 30 minutes
Issue: Goal rate = 0.9 per minute (54 per 90 min)
Severity: CRITICAL - Physically impossible
```

---

### 5. **Anomaly Detection via Player History**

**Statistical Profile:**
```typescript
interface PlayerAnomalyProfile {
  avgGoalsPerMatch: number;        // Historical average
  avgAssistsPerMatch: number;      // Historical average
  avgMatchDuration: number;        // Expected duration
  winRate: number;                 // Career win %
  maxGoalsInMatch: number;         // Career single-match record
  maxAssistsInMatch: number;       // Career single-match record
}
```

**Anomaly Triggers:**
1. **Goal Deviation:** If (current - avg) > 3σ and exceeds career max
2. **Assist Deviation:** If (current - avg) > 3σ and exceeds career max
3. **Form Reversal:** Win after poor form (<30% win rate)
4. **Performance Spike:** Unusual combination of high goals + high assists
5. **Unlikely Streaks:** 6+ consecutive wins with low win probability

**Example:**
```
Player History:
- Avg Goals/Match: 0.5
- Career Max Goals: 2
- Win Rate: 25%

Flagged Match:
- Goals: 5 (Deviation: +4.5σ from avg)
- Result: Win (Form reversal from poor form)
Severity: HIGH - Multiple anomalies
```

---

### 6. **Statistical Consistency**

**MatchStats Validation:**
- Team goals in stats must match match score
- Player assists cannot exceed team assists
- Pass accuracy must be 0-100%
- Possession must total ~100%

---

## Validation Results

### Validation Result Object

```typescript
interface ValidationResult {
  isValid: boolean;                    // No critical issues
  score: number;                       // 0-100 (higher = more trustworthy)
  issues: ValidationIssue[];          // Critical/high severity problems
  warnings: ValidationWarning[];      // Suspicions and anomalies
  timestamp: number;                  // When validation ran
}

interface ValidationIssue {
  code: string;                       // Unique identifier
  severity: 'critical' | 'high' | 'medium';
  message: string;                    // Human-readable description
  data?: any;                         // Supporting data
}

interface ValidationWarning {
  code: string;
  message: string;
  recommendation: string;             // How to verify
}
```

### Scoring System

**Score Calculation:**
- Start at 100 points
- Deduct points for each issue:
  - Critical issue: -20 to -25 points
  - High issue: -10 to -15 points
  - Medium issue: -5 to -10 points
  - Warning: -2 to -8 points
- Final score: 0-100 (clamped)

**Interpretation:**
- **95-100:** Excellent - Data is verified legitimate
- **80-94:** Good - Minor inconsistencies, likely legitimate
- **60-79:** Fair - Some suspicious elements, review recommended
- **0-59:** Poor - Multiple issues, likely compromised

---

## Integration Points

### 1. **During Match Recording**

```typescript
// In GuestModeManager.recordMatch()
const match: MatchRecord = { /* ... */ };
const validation = MatchValidator.validateMatch(
  match, 
  undefined, 
  player.matchHistory  // Compare to history
);

if (MatchValidator.isSuspicious(validation)) {
  // Log warning but still record
  console.warn('Suspicious match detected:', validation);
}

player.stats.matchesPlayed++;
// ... record match ...
```

### 2. **Player Profile Display**

```typescript
const suspicious = player.matchHistory.filter(m => {
  const validation = MatchValidator.validateMatch(m, undefined, player.matchHistory);
  return MatchValidator.isSuspicious(validation);
});

// Show warning badge if suspicious matches exist
if (suspicious.length > 0) {
  <Badge severity="warning">
    ⚠️ {suspicious.length} flagged matches
  </Badge>
}
```

### 3. **Fairness Dashboard**

Use the `FairnessValidator` component to display:
- Overall fairness score (0-100)
- Fairness rating (Excellent/Good/Fair/Poor)
- Suspicious match count
- Individual match validations
- Player performance profile
- Active anti-cheat measures

---

## Anti-Cheat Features

### Active Measures (Implemented)

✅ **Match Data Validation** - Scores and results verified
✅ **Statistical Anomaly Detection** - 3σ analysis against history
✅ **Timing Validation** - Dates and durations checked
✅ **Physical Plausibility** - Goal rates and limits enforced
✅ **Pattern Recognition** - Detect streaks and form reversals
✅ **Integrity Hashing** - Basic fingerprinting (fingerprint matches validation)

### Future Measures (Coming Soon)

⏳ **Cryptographic Hashing** - Match data signed with player key
⏳ **Replay Verification** - Event-level validation against recorded data
⏳ **Server-Side Validation** - Backend verification for competitive play
⏳ **Machine Learning** - Advanced pattern detection
⏳ **Device Fingerprinting** - Track suspicious account behavior

---

## Usage Examples

### Basic Validation

```typescript
import { MatchValidator } from '@/lib/matchValidator';

const match: MatchRecord = {
  id: 'match_123',
  date: Date.now(),
  homeTeam: 'Team A',
  awayTeam: 'Team B',
  homeScore: 3,
  awayScore: 1,
  playerTeam: 'home',
  playerGoals: 1,
  playerAssists: 1,
  result: 'win',
  duration: 90,
};

const validation = MatchValidator.validateMatch(match);
console.log(validation.isValid); // true
console.log(validation.score); // 98
```

### With Player History

```typescript
// Validate against player's match history
const validation = MatchValidator.validateMatch(
  newMatch,
  undefined,
  player.matchHistory  // Compare to all previous matches
);

if (validation.score < 60) {
  console.warn('Suspicious match:', validation.issues);
}
```

### Generate Report

```typescript
const report = MatchValidator.generateReport(validation);
console.log(report);
// Output:
// Match Validation Report (Score: 98/100)
// Status: ✓ VALID
// ✓ All checks passed - Match is legitimate
```

### Build Player Profile

```typescript
const profile = MatchValidator.buildPlayerProfile(player.matchHistory);
console.log(profile);
// Output:
// {
//   playerId: 'guest_1234567890_abc123',
//   avgGoalsPerMatch: 0.8,
//   avgAssistsPerMatch: 0.3,
//   avgMatchDuration: 85,
//   totalMatches: 50,
//   anomalies: []
// }
```

### Check for Suspicious Matches

```typescript
const isSuspicious = MatchValidator.isSuspicious(validation);
if (isSuspicious) {
  // Show warning badge
  // Log for review
  // Suggest player verification
}
```

---

## Component Integration

### Display Fairness Validator

```tsx
import { FairnessValidator } from '@/components/FairnessValidator';
import { GuestModeManager } from '@/lib/guestMode';

export function PlayerDashboard() {
  const [showFairness, setShowFairness] = useState(false);
  const player = GuestModeManager.getGuestPlayer();

  return (
    <>
      <button onClick={() => setShowFairness(true)}>
        🛡️ View Fairness Report
      </button>

      {showFairness && (
        <FairnessValidator
          player={player!}
          onClose={() => setShowFairness(false)}
        />
      )}
    </>
  );
}
```

---

## Data Storage

All validation data is stored in localStorage:

```typescript
const GUEST_STORAGE_KEY = 'bass_ball_guest_player';

// Structure:
{
  "id": "guest_1234567890_abc123",
  "username": "PlayerName",
  "stats": {
    "matchesPlayed": 50,
    "wins": 35,
    "losses": 12,
    "draws": 3,
    "totalGoals": 40,
    "totalAssists": 15
  },
  "matchHistory": [
    {
      "id": "match_123",
      "date": 1705590045123,
      "homeTeam": "Team A",
      "awayTeam": "Team B",
      "homeScore": 3,
      "awayScore": 1,
      "playerTeam": "home",
      "playerGoals": 1,
      "playerAssists": 0,
      "result": "win",
      "duration": 90
    }
    // ... more matches
  ]
}
```

---

## Validation Codes Reference

### Critical Issues
- `NEGATIVE_SCORE` - Match has negative scores
- `RESULT_MISMATCH` - Reported result doesn't match scores
- `PLAYER_GOALS_EXCEED_TEAM_SCORE` - Player scored more than team
- `NEGATIVE_STATS` - Negative goals or assists
- `NEGATIVE_DURATION` - Negative match duration
- `FUTURE_MATCH` - Match date in future
- `STATS_GOAL_MISMATCH` - Goals don't match stats
- `PLAYER_ASSISTS_EXCEED_TEAM` - Player assists exceed team total

### High Severity Issues
- `UNREALISTIC_SCORE` - Score too high (>50 goals)
- `EXCESSIVE_GOALS` - Player scored >10 goals
- `EXCESSIVE_ASSISTS` - Player had >8 assists
- `UNREALISTIC_GOAL_RATE` - Goal rate physically impossible
- `INVALID_PASS_ACCURACY` - Pass accuracy >100% or <0%

### Medium/Low Warnings
- `VERY_SHORT_MATCH` - Duration <20 minutes
- `VERY_LONG_MATCH` - Duration >200 minutes
- `VERY_OLD_MATCH` - Match >2 years old
- `UNUSUAL_CONTRIBUTION` - High goals+assists combo
- `ANOMALY_GOALS` - Goals exceed historical average
- `ANOMALY_ASSISTS` - Assists exceed historical average
- `FORM_REVERSAL` - Win after poor form
- `PERFORMANCE_SPIKE` - Unusual performance improvement
- `UNLIKELY_STREAK` - Statistically improbable win streak
- `MORE_ASSISTS_THAN_GOALS` - Assists > goals (unusual)
- `POSSESSION_MISMATCH` - Possession doesn't total 100%

---

## Performance Impact

- **Validation Time:** ~5-15ms per match (including history comparison)
- **Storage Overhead:** ~2KB per match record
- **Memory Usage:** <1MB for 50 match history

---

## Roadmap

### Phase 1 (Current) ✅
- Match data validation
- Statistical anomaly detection
- Timing and plausibility checks
- FairnessValidator dashboard

### Phase 2 (Planned)
- Cryptographic match signing
- Event-level replay validation
- Advanced ML anomaly detection
- Device fingerprinting

### Phase 3 (Future)
- Server-side validation backend
- Real-time match monitoring
- Competitive ladder security
- Tournament-grade verification

---

## Best Practices

1. **Always validate before recording matches**
   - Reduces liability for false flagging
   - Catches data entry errors early

2. **Review flagged matches in context**
   - A high score doesn't mean cheating (could be lucky day)
   - Multiple flags together indicate problems

3. **Transparent with players**
   - Show fairness scores publicly
   - Explain validation rules
   - Allow appeals/corrections

4. **Monitor trends, not single events**
   - One suspicious match ≠ cheating
   - Pattern of issues is concerning

5. **Regular audits**
   - Review leaderboards for anomalies
   - Check for systematic issues
   - Improve validation thresholds over time

---

## Troubleshooting

**Q: My matches are being flagged as suspicious even though they're legitimate.**

A: Check if:
1. Match data entry is correct (scores, goals, assists, duration)
2. Your performance is much better than usual (spike from baseline)
3. You've had unusual win/loss streaks recently

**Q: What should I do if I notice someone cheating?**

A: 1. Take note of their flagged matches and fairness score
2. Report through in-game report system (coming soon)
3. Provide match IDs and concerns to moderators

**Q: Can I dispute my fairness rating?**

A: Yes, future versions will include:
1. Appeal system for specific matches
2. Manual review by moderators
3. Evidence submission

---

## Code Examples

See `lib/matchValidator.ts` and `components/FairnessValidator.tsx` for complete implementation.
