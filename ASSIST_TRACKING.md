# 🎯 Assist Tracking System - Enhanced

## Overview

The assist tracking system has been **significantly enhanced** to provide detailed per-player assist tracking, improved assist detection logic, and new utility methods for retrieving assist statistics.

---

## ✨ New Features

### 1. **Per-Player Assist Tracking**
- Each assist is now recorded with complete details
- Tracks who assisted, who scored, minute, and team
- Maintains historical record of all assists in the match

### 2. **Improved Assist Detection**
- Enhanced `findLastPasser()` to detect passes up to 10 seconds before goal
- Falls back to recent event history if pass history is unavailable
- More reliable assist attribution

### 3. **Player Statistics**
- New `getPlayerStats()` method returns:
  - Goals scored
  - Assists made
  - Shots taken
  - Passes completed
  - Tackles made

### 4. **Top Assists Query**
- `getTopAssists()` method to find best playmakers
- Configurable limit (default: top 3)
- Team-specific queries

---

## 📊 New Interfaces

### `AssistRecord`
```typescript
export interface AssistRecord {
  assistPlayerId: string;          // ID of assisting player
  assistPlayerName: string;        // Name of assisting player
  goalPlayerId: string;            // ID of scoring player
  goalPlayerName: string;          // Name of scoring player
  minute: number;                  // Match minute (0-90)
  team: 'home' | 'away';          // Which team scored
}
```

### `PlayerStats`
```typescript
export interface PlayerStats {
  playerId: string;                // Player ID
  playerName: string;              // Player name
  position: string;                // GK | DEF | MID | FWD
  goals: number;                   // Goals scored
  assists: number;                 // Assists made
  shots: number;                   // Shots taken
  passes: number;                  // Passes completed
  tackles: number;                 // Tackles won
}
```

---

## 🔧 New Methods

### `getPlayerAssists(playerId: string): AssistRecord[]`
Get all assists made by a specific player.

**Usage:**
```typescript
const assists = matchEngine.getPlayerAssists('player-123');
assists.forEach(assist => {
  console.log(`${assist.assistPlayerName} assisted ${assist.goalPlayerName}`);
});
```

### `getPlayerStats(playerId: string): PlayerStats | null`
Get comprehensive stats for a player.

**Usage:**
```typescript
const stats = matchEngine.getPlayerStats('player-123');
if (stats) {
  console.log(`${stats.playerName}: ${stats.goals} goals, ${stats.assists} assists`);
}
```

### `getTopAssists(team: 'home' | 'away', limit?: number): Array<{player: string; assists: number}>`
Get the top playmakers by number of assists.

**Usage:**
```typescript
const topAssists = matchEngine.getTopAssists('home', 3);
topAssists.forEach(p => {
  console.log(`${p.player}: ${p.assists} assists`);
});
// Output:
// Messi: 3 assists
// Xavi: 2 assists
// Busquets: 1 assist
```

### `recordPass(playerId: string, playerName: string, team: 'home' | 'away'): void`
**Internal method** - Records a pass in the history for assist detection. Called automatically during gameplay.

---

## 🎮 How It Works

### Pass Recording Flow
```
Player makes pass
    ↓
attemptPass() method called
    ↓
If pass successful:
    - recordPass() adds to passHistory
    - Pass event recorded to matchStats
    - Stored with timestamp for 10-second window
    ↓
Pass history maintained (max 100 recent passes)
```

### Goal & Assist Flow
```
Goal attempt succeeds
    ↓
scoreGoal() method called
    ↓
findLastPasserWithId() searches:
  1. Last 10 seconds of passHistory
  2. Falls back to recent pass events
    ↓
AssistRecord created with:
  - Assisting player ID & name
  - Scoring player ID & name
  - Match minute
  - Team
    ↓
Record stored in playerAssists map
Team assist counter incremented
Event logged with assist info
```

---

## 📈 Example Usage in Components

### Display Player Assist Count
```tsx
'use client';

import { useGameState } from '@/hooks/useGameState';
import { MatchEngine } from '@/lib/matchEngine';

export function PlayerCard({ playerId }: { playerId: string }) {
  const gameState = useGameState();
  const stats = gameState.matchEngine?.getPlayerStats(playerId);

  if (!stats) return null;

  return (
    <div className="player-card">
      <h3>{stats.playerName}</h3>
      <p>Position: {stats.position}</p>
      <p>Goals: {stats.goals}</p>
      <p>Assists: {stats.assists}</p>
      <p>Shots: {stats.shots}</p>
      <p>Passes: {stats.passes}</p>
      <p>Tackles: {stats.tackles}</p>
    </div>
  );
}
```

### Show Top Playmakers
```tsx
'use client';

import { useGameState } from '@/hooks/useGameState';

export function TopAssists() {
  const gameState = useGameState();
  const topAssists = gameState.matchEngine?.getTopAssists('home', 5);

  return (
    <div className="top-assists">
      <h3>🎯 Best Playmakers (Home)</h3>
      {topAssists?.map((entry, i) => (
        <div key={i}>
          {i + 1}. {entry.player} - {entry.assists} assists
        </div>
      ))}
    </div>
  );
}
```

### Display Assist List
```tsx
'use client';

import { useGameState } from '@/hooks/useGameState';

export function AssistHistory({ playerId }: { playerId: string }) {
  const gameState = useGameState();
  const assists = gameState.matchEngine?.getPlayerAssists(playerId);

  if (!assists || assists.length === 0) {
    return <p>No assists yet</p>;
  }

  return (
    <div className="assists">
      <h4>Assists</h4>
      {assists.map((a, i) => (
        <div key={i} className="assist-item">
          <span className="minute">{a.minute}'</span>
          <span className="assister">{a.assistPlayerName}</span>
          <span className="arrow">→</span>
          <span className="scorer">{a.goalPlayerName}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Testing the System

### In Match Results
The `MatchResults` component now receives enhanced data:
```typescript
// From match end
const stats = matchEngine.getTopAssists('home', 3);
const playerStats = matchEngine.getPlayerStats(playerId);
```

### In Live Display
Show assists as they happen:
```typescript
// In an event listener
if (event.type === 'goal' && event.details?.assister) {
  console.log(`Goal with assist recorded!`);
}
```

---

## 📊 Data Structure

### Pass History (Internal)
```typescript
private passHistory: Array<{
  playerId: string;
  playerName: string;
  team: 'home' | 'away';
  time: number;  // gameTime when pass occurred
}> = [];
```
- Maintained as a sliding window (max 100 entries)
- Auto-cleaned after 20 seconds
- Helps detect assists up to 10 seconds before goal

### Player Assists Map
```typescript
private playerAssists: Map<string, AssistRecord[]> = new Map();
```
- Key: Player ID
- Value: Array of AssistRecord objects
- Access with `getPlayerAssists(playerId)`

### Player Goals Map
```typescript
private playerGoals: Map<string, string[]> = new Map();
```
- Key: Player ID
- Value: Array of goal timestamps
- Used to calculate total goals per player

---

## 🎯 Integration Points

### MatchResults Component
```typescript
// In MatchResults.tsx
const topAssists = matchEngine.getTopAssists('home', 3);
const topAssists_away = matchEngine.getTopAssists('away', 3);

// Display in player stats section
{topAssists.map(p => (
  <div>{p.player}: {p.assists} assists</div>
))}
```

### LiveMatch Component
```typescript
// Show ongoing assists
matchEngine.getTopAssists('home').map(p => (
  <span>{p.player} ({p.assists})</span>
))
```

### Player Profile/Card
```typescript
// Show individual stats
const stats = matchEngine.getPlayerStats(playerId);
// Display: {stats.assists} assists
```

---

## 🚀 Performance Notes

- **Pass History**: Maintained as a simple array, cleaned periodically
- **Lookup Speed**: O(1) for player maps, O(n) for filtering
- **Memory**: Lightweight (only stores player IDs, names, and timestamps)
- **Impact**: Negligible on frame rate

---

## 🔍 Debugging

### Check if Assists are Being Recorded
```typescript
// In console
const engine = gameState.matchEngine;
console.log(engine?.getPlayerAssists('player-id'));
// Should show array of AssistRecord objects
```

### View Top Assists at Any Time
```typescript
// During or after match
console.log(engine?.getTopAssists('home'));
// [ { player: 'Messi', assists: 3 }, ... ]
```

### Get Player Stats
```typescript
console.log(engine?.getPlayerStats('player-id'));
// Shows full stats object with all metrics
```

---

## 📝 Summary

| Feature | Status | Details |
|---------|--------|---------|
| Basic Assist Tracking | ✅ Complete | Team-level assists counted |
| Per-Player Assists | ✅ Complete | Full AssistRecord with details |
| Pass History | ✅ Complete | 10-second window for detection |
| Player Stats | ✅ Complete | Goals, assists, shots, passes, tackles |
| Top Playmakers | ✅ Complete | Queryable by team and limit |
| Event Integration | ✅ Complete | Assists included in goal events |

---

## 🎮 Quick Reference

```typescript
// Get player assist count
matchEngine.getPlayerAssists('playerId').length

// Get top 3 playmakers (home team)
matchEngine.getTopAssists('home', 3)

// Get all player stats
matchEngine.getPlayerStats('playerId')

// Show assists in MatchResults
const assists = matchEngine.getTopAssists(team, 3);
```

Everything is integrated and ready to use! 🚀
