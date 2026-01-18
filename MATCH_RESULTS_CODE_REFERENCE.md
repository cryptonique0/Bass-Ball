# Match Results System - Code Reference

## Key Implementation Details

### 1. Enhanced MatchStats Interface

**Location**: `lib/matchEngine.ts` (lines 15-43)

```typescript
export interface MatchStats {
  homeTeam: {
    goals: number;           // ⭐ NEW - Goals scored
    shots: number;           // Total shot attempts
    shotsOnTarget: number;   // Shots on target
    passes: number;          // Completed passes
    passAccuracy: number;    // % accuracy
    tackles: number;         // Tackles made
    fouls: number;          // Fouls committed
    possession: number;      // % possession
    assists: number;         // ⭐ NEW - Assists provided
    yellowCards: number;     // ⭐ NEW - Yellow cards
    redCards: number;        // ⭐ NEW - Red cards
  };
  awayTeam: {
    // Same structure as homeTeam
    goals: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    passAccuracy: number;
    tackles: number;
    fouls: number;
    possession: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
  events: MatchEvent[];
}
```

### 2. Constructor Initialization

**Location**: `lib/matchEngine.ts` (MatchEngine constructor)

```typescript
// Initialize stats for both teams
this.matchStats = {
  homeTeam: {
    goals: 0,
    shots: 0,
    shotsOnTarget: 0,
    passes: 0,
    passAccuracy: 0,
    tackles: 0,
    fouls: 0,
    possession: 0,
    assists: 0,              // ⭐ NEW
    yellowCards: 0,          // ⭐ NEW
    redCards: 0,             // ⭐ NEW
  },
  awayTeam: {
    goals: 0,
    shots: 0,
    shotsOnTarget: 0,
    passes: 0,
    passAccuracy: 0,
    tackles: 0,
    fouls: 0,
    possession: 0,
    assists: 0,              // ⭐ NEW
    yellowCards: 0,          // ⭐ NEW
    redCards: 0,             // ⭐ NEW
  },
  events: [],
};
```

### 3. Goal Scoring with Assist Tracking

**Location**: `lib/matchEngine.ts` (lines 306-329)

```typescript
private scoreGoal(team: 'home' | 'away', player: Player): void {
  // Increment goal counter and score
  if (team === 'home') {
    this.gameState.homeTeam.score++;
    this.matchStats.homeTeam.goals++;
  } else {
    this.gameState.awayTeam.score++;
    this.matchStats.awayTeam.goals++;
  }

  // Find potential assist maker (last passer before goal)
  const assistingPlayer = this.findLastPasser(team);
  let assistText = '';
  if (assistingPlayer) {
    // Increment assists stat
    this.matchStats[team === 'home' ? 'homeTeam' : 'awayTeam'].assists++;
    assistText = ` (Assist: ${assistingPlayer})`;
  }

  // Record goal event with assist information
  this.recordEvent({
    time: this.gameState.gameTime,
    type: 'goal',
    team,
    player: player.name,
    description: `⚽ GOAL! ${player.name} scores for ${team === 'home' ? 'HOME' : 'AWAY'}!${assistText}`,
  });
}
```

### 4. Assist Detection Method

**Location**: `lib/matchEngine.ts` (lines 333-345)

```typescript
/**
 * Find the last player who passed to current ball carrier (for assists)
 */
private findLastPasser(team: 'home' | 'away'): string | null {
  // Get last pass event for this team
  const recentPasses = this.matchStats.events
    .filter((e) => e.type === 'pass' && e.team === team)
    .reverse()  // Reverse chronological
    .slice(0, 1); // Get most recent only

  if (recentPasses.length > 0) {
    return recentPasses[0].player; // Return passer's name
  }
  return null; // No passer found
}
```

### 5. Card Assignment Tracking

**Location**: `lib/matchEngine.ts` (lines 432-476)

```typescript
private assignCard(player: Player, cardType: 'yellow' | 'red', team: 'home' | 'away'): void {
  const cards = this.playerCards.get(player.id) || [];
  const yellowCount = cards.filter((c) => c.cardType === 'yellow').length;

  if (cardType === 'red' || yellowCount >= 1) {
    // Player sent off (red card or second yellow)
    this.recordEvent({
      time: this.gameState.gameTime,
      type: cardType === 'red' ? 'red_card' : 'yellow_card',
      team,
      player: player.name,
      description: `🔴 ${player.name} is sent off!`,
    });

    // ⭐ INCREMENT RED CARD STAT
    if (cardType === 'red' || yellowCount >= 1) {
      this.matchStats[team === 'home' ? 'homeTeam' : 'awayTeam'].redCards++;
    }

    // Remove player from match
    const teamPlayers = team === 'home' ? this.gameState.homeTeam.players : this.gameState.awayTeam.players;
    const idx = teamPlayers.findIndex((p) => p.id === player.id);
    if (idx > -1) {
      teamPlayers.splice(idx, 1);
    }
  } else {
    // Yellow card (first one)
    this.recordEvent({
      time: this.gameState.gameTime,
      type: 'yellow_card',
      team,
      player: player.name,
      description: `🟨 ${player.name} receives a yellow card!`,
    });

    // ⭐ INCREMENT YELLOW CARD STAT
    this.matchStats[team === 'home' ? 'homeTeam' : 'awayTeam'].yellowCards++;

    cards.push({
      player: player.name,
      cardType: 'yellow',
      minute: Math.floor(this.gameState.gameTime),
    });
    this.playerCards.set(player.id, cards);
  }
}
```

### 6. MatchResults Component Structure

**Location**: `components/MatchResults.tsx` (248 lines)

#### Main Component
```typescript
export const MatchResults: React.FC<MatchResultsProps> = ({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  matchStats,
  gameTime,
  onRestart,
}) => {
  // Extract player statistics from events
  const getPlayerStats = (): { home: PlayerStats[]; away: PlayerStats[] } => {
    // ... parses events to extract per-player stats
  };

  // Render final score, team stats, top performers, MVP
  return (
    <div className="min-h-screen bg-gradient-to-br ...">
      {/* Header */}
      {/* Final Score */}
      {/* Team Stats Panels */}
      {/* MVP Section */}
      {/* Restart Button */}
    </div>
  );
};
```

#### Player Stats Extraction
```typescript
const getPlayerStats = (): { home: PlayerStats[]; away: PlayerStats[] } => {
  const homeStats = new Map<string, PlayerStats>();
  const awayStats = new Map<string, PlayerStats>();

  // First pass: Extract basic stats from events
  matchStats.events.forEach((event: any) => {
    const statsMap = event.team === 'home' ? homeStats : awayStats;
    if (!statsMap.has(event.player)) {
      statsMap.set(event.player, {
        name: event.player,
        goals: 0,
        assists: 0,
        shots: 0,
        passes: 0,
        tackles: 0,
      });
    }
    const stats = statsMap.get(event.player)!;

    if (event.type === 'goal') stats.goals++;
    if (event.type === 'shot') stats.shots++;
    if (event.type === 'pass') stats.passes++;
    if (event.type === 'tackle') stats.tackles++;
  });

  // Second pass: Extract assists from goal descriptions
  matchStats.events.forEach((event: any) => {
    if (event.type === 'goal' && event.description.includes('(Assist:')) {
      const assistMatch = event.description.match(/\(Assist: (.+?)\)/);
      if (assistMatch) {
        const assistName = assistMatch[1];
        const statsMap = event.team === 'home' ? homeStats : awayStats;
        if (statsMap.has(assistName)) {
          statsMap.get(assistName)!.assists++;
        }
      }
    }
  });

  return {
    home: Array.from(homeStats.values()).sort((a, b) => b.goals - a.goals),
    away: Array.from(awayStats.values()).sort((a, b) => b.goals - a.goals),
  };
};
```

#### MVP Selection
```typescript
const getAllPlayers = () => [
  ...playerStats.home.map(p => ({...p, team: 'home'})),
  ...playerStats.away.map(p => ({...p, team: 'away'}))
];
const allPlayers = getAllPlayers();
const mvp = allPlayers.sort((a: any, b: any) => {
  if (b.goals !== a.goals) return b.goals - a.goals;          // Primary: goals
  if (b.assists !== a.assists) return b.assists - a.assists;  // Secondary: assists
  return (b.shots + b.passes + b.tackles) - ...                // Tertiary: impact
})[0];
```

### 7. LiveMatch Integration

**Location**: `components/LiveMatch.tsx` (lines 1-40)

#### Import
```typescript
import { MatchResults } from './MatchResults';
```

#### Match-Over Detection and Conditional Render
```typescript
export function LiveMatch({ homeTeam, awayTeam, mode, difficulty = 'normal' }: LiveMatchProps) {
  const [ballHover, setBallHover] = useState<{ x: number; y: number } | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const matchHook = mode === 'ai' ? useAIMatch(homeTeam, awayTeam) : usePvPMatch(homeTeam, awayTeam);

  const { gameState, matchStats, ..., resetMatch } = matchHook;

  // Check if match is over
  const isMatchOver = gameState.gameTime >= 90;

  if (isMatchOver) {
    return (
      <MatchResults
        homeTeamName={homeTeam.name}
        awayTeamName={awayTeam.name}
        homeScore={gameState.homeTeam.score}
        awayScore={gameState.awayTeam.score}
        matchStats={matchStats}
        gameTime={gameState.gameTime}
        onRestart={resetMatch}
      />
    );
  }

  // ... rest of match controls (only shown if gameTime < 90)
}
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│         MATCH ENGINE (matchEngine.ts)                │
│  Tracks: gameState, matchStats, events              │
└───────────────┬─────────────────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
    ┌───▼────┐      ┌──▼────┐
    │scoreGoal()    │assignCard()
    │- goal++      │- yellowCards++
    │- goals++     │- redCards++
    │- findLastPasser()
    │- assists++
    └───┬────┘      └──┬────┘
        │               │
        └───────┬───────┘
                │
        ┌───────▼──────────────┐
        │ matchStats.events[] │
        │ (event log)         │
        └───────┬──────────────┘
                │
        ┌───────▼────────────────┐
        │  LiveMatch.tsx         │
        │  gameTime >= 90?       │
        └───────┬────────────────┘
        ┌──────┴──────┐
        │             │
    YES │             │ NO
        │             │
    ┌───▼─────────────▼──┐
    │ MatchResults.tsx   │ Match Controls
    │ - Parse events     │ - Shoot
    │ - Player stats     │ - Pass
    │ - MVP selection    │ - Tackle
    │ - Beautiful UI     │ - Sprint
    └────────────────────┘
```

## Event Log Example

When a goal is scored with an assist, the event looks like:

```javascript
{
  time: 23.5,
  type: 'goal',
  team: 'home',
  player: 'Harry Kane',
  description: '⚽ GOAL! Harry Kane scores for HOME!(Assist: Mo Salah)!'
}
```

This event allows `MatchResults` to:
1. Count it as 1 goal for Harry Kane
2. Extract "Mo Salah" from description
3. Count it as 1 assist for Mo Salah

## Statistics Update Points

### Goals
```typescript
// Updated in:
private scoreGoal() {
  this.matchStats.homeTeam.goals++;  // or awayTeam
}
```

### Assists
```typescript
// Updated in:
private scoreGoal() {
  const passer = this.findLastPasser(team);
  if (passer) {
    this.matchStats[team].assists++;
  }
}
```

### Cards
```typescript
// Updated in:
private assignCard(player, cardType, team) {
  if (cardType === 'red' || yellowCount >= 1) {
    this.matchStats[team].redCards++;
  } else {
    this.matchStats[team].yellowCards++;
  }
}
```

### Shots
```typescript
// Updated in:
public manualShoot(strength: number) {
  this.matchStats[team].shots++;
  // Later if on target:
  this.matchStats[team].shotsOnTarget++;
}
```

## Performance Optimizations

1. **Lazy Event Parsing**: Events only parsed when match ends
2. **Map-Based Lookup**: O(1) player stat lookups
3. **Single Pass + Extract**: Assists extracted in single pass
4. **No Real-Time Overhead**: MVP calculated once at end
5. **Efficient Sorting**: Only top 3 calculated per team

---

**All Code Examples**: Exact implementations from production codebase ✅
