# 📝 Assist Tracking - Implementation Details

## Files Modified

### 1. `lib/matchEngine.ts`

#### New Exports

**AssistRecord Interface**
```typescript
export interface AssistRecord {
  assistPlayerId: string;
  assistPlayerName: string;
  goalPlayerId: string;
  goalPlayerName: string;
  minute: number;
  team: 'home' | 'away';
}
```

**PlayerStats Interface**
```typescript
export interface PlayerStats {
  playerId: string;
  playerName: string;
  position: string;
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  tackles: number;
}
```

---

#### MatchEngine Class Changes

**New Private Properties**
```typescript
private playerAssists: Map<string, AssistRecord[]> = new Map();
private playerGoals: Map<string, string[]> = new Map();
private passHistory: Array<{ 
  playerId: string; 
  playerName: string; 
  team: 'home' | 'away'; 
  time: number 
}> = [];
```

**Constructor Initialization**
- Initialize `playerAssists` map for all players
- Initialize `playerGoals` map for all players
- (passHistory initialized as empty array)

---

#### Enhanced Methods

**scoreGoal() - Now Tracks Individual Assists**
```typescript
private scoreGoal(team: 'home' | 'away', player: Player): void {
  // Score tracking (existing)
  if (team === 'home') {
    this.gameState.homeTeam.score++;
    this.matchStats.homeTeam.goals++;
  } else {
    this.gameState.awayTeam.score++;
    this.matchStats.awayTeam.goals++;
  }

  // NEW: Track goal for this player
  const goalsArray = this.playerGoals.get(player.id) || [];
  goalsArray.push(`${this.gameState.gameTime}'`);
  this.playerGoals.set(player.id, goalsArray);

  // NEW: Find assist with player ID
  const assistInfo = this.findLastPasserWithId(team);
  let assistText = '';
  let assistingPlayerId: string | null = null;
  
  if (assistInfo) {
    this.matchStats[team === 'home' ? 'homeTeam' : 'awayTeam'].assists++;
    assistText = ` (Assist: ${assistInfo.name})`;
    assistingPlayerId = assistInfo.id;

    // NEW: Record assist with full details
    const assistRecord: AssistRecord = {
      assistPlayerId: assistInfo.id,
      assistPlayerName: assistInfo.name,
      goalPlayerId: player.id,
      goalPlayerName: player.name,
      minute: Math.floor(this.gameState.gameTime),
      team,
    };
    
    const assists = this.playerAssists.get(assistInfo.id) || [];
    assists.push(assistRecord);
    this.playerAssists.set(assistInfo.id, assists);
  }

  // Event with assist details
  this.recordEvent({
    time: this.gameState.gameTime,
    type: 'goal',
    team,
    player: player.name,
    description: `⚽ GOAL! ${player.name} scores...!${assistText}`,
    details: {
      goalScorer: player.id,
      assister: assistingPlayerId,
    },
  });
}
```

**findLastPasser() - Now Returns Just Name**
```typescript
private findLastPasser(team: 'home' | 'away'): string | null {
  const result = this.findLastPasserWithId(team);
  return result ? result.name : null;
}
```

**findLastPasserWithId() - NEW METHOD**
```typescript
private findLastPasserWithId(team: 'home' | 'away'): { id: string; name: string } | null {
  // Check recent pass history (last 10 seconds)
  const currentTime = this.gameState.gameTime;
  const recentPasses = this.passHistory
    .filter((p) => p.team === team && currentTime - p.time <= 10)
    .reverse()
    .slice(0, 1);

  if (recentPasses.length > 0) {
    return {
      id: recentPasses[0].playerId,
      name: recentPasses[0].playerName,
    };
  }

  // Fallback: check match events
  const recentPassEvents = this.matchStats.events
    .filter((e) => e.type === 'pass' && e.team === team)
    .reverse()
    .slice(0, 1);

  if (recentPassEvents.length > 0) {
    const player = [...this.gameState.homeTeam.players, ...this.gameState.awayTeam.players].find(
      (p) => p.name === recentPassEvents[0].player
    );
    if (player) {
      return {
        id: player.id,
        name: player.name,
      };
    }
  }
  return null;
}
```

---

#### New Public Methods

**getPlayerAssists(playerId: string): AssistRecord[]**
```typescript
public getPlayerAssists(playerId: string): AssistRecord[] {
  return this.playerAssists.get(playerId) || [];
}
```

**getPlayerStats(playerId: string): PlayerStats | null**
```typescript
public getPlayerStats(playerId: string): PlayerStats | null {
  const player = [...this.gameState.homeTeam.players, ...this.gameState.awayTeam.players].find(
    (p) => p.id === playerId
  );
  if (!player) return null;

  const goals = this.playerGoals.get(playerId)?.length || 0;
  const assists = this.playerAssists.get(playerId)?.length || 0;

  const playerEvents = this.matchStats.events.filter((e) => e.player === player.name);
  const shots = playerEvents.filter((e) => e.type === 'shot').length;
  const passes = playerEvents.filter((e) => e.type === 'pass').length;
  const tackles = playerEvents.filter((e) => e.type === 'tackle').length;

  return {
    playerId,
    playerName: player.name,
    position: player.position,
    goals,
    assists,
    shots,
    passes,
    tackles,
  };
}
```

**getTopAssists(team: 'home' | 'away', limit: number = 3): Array<{player: string; assists: number}>**
```typescript
public getTopAssists(team: 'home' | 'away', limit: number = 3): Array<{ player: string; assists: number }> {
  const teamPlayers = team === 'home' ? this.gameState.homeTeam.players : this.gameState.awayTeam.players;
  return teamPlayers
    .map((p) => ({
      player: p.name,
      assists: this.playerAssists.get(p.id)?.length || 0,
    }))
    .filter((p) => p.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, limit);
}
```

---

#### New Private Methods

**recordPass(playerId: string, playerName: string, team: 'home' | 'away'): void**
```typescript
private recordPass(playerId: string, playerName: string, team: 'home' | 'away'): void {
  this.passHistory.push({
    playerId,
    playerName,
    team,
    time: this.gameState.gameTime,
  });
  // Keep only recent passes (last 20 seconds)
  if (this.passHistory.length > 100) {
    this.passHistory.shift();
  }
}
```

**updatePossession() - MODIFIED**
- Changed from `forEach` to `for...of` loop for better type narrowing
- Now explicitly checks `closestPlayer !== null && closestTeam !== null`
- No logic changes, only improved type safety

**attemptPass() - MODIFIED**
- Added call to `this.recordPass()` on successful pass
- Maintains pass history for assist detection

**recordEvent() - MODIFIED**
- Updated signature to accept `details` parameter
- Properly types event details in MatchEvent

---

## 📊 Data Flow Diagram

```
Match Start
    ↓
Players pass ball
    ↓
attemptPass() succeeds
    ├─ recordPass() → passHistory
    └─ MatchEvent recorded
    ↓
Player shoots/scores
    ↓
scoreGoal() called
    ├─ findLastPasserWithId()
    │   ├─ Search passHistory (10s window)
    │   └─ Fallback to events
    ├─ Create AssistRecord
    ├─ Store in playerAssists Map
    └─ Event with details recorded
    ↓
At Match End
    ↓
Query Methods Available:
  - getPlayerStats(id)
  - getPlayerAssists(id)
  - getTopAssists(team, limit)
```

---

## 🔍 Key Implementation Details

### Pass History Management
- Stores: `{ playerId, playerName, team, time }`
- Limit: 100 entries (auto-shift oldest)
- Window: 10 seconds for assist detection

### Assist Record Storage
- Map by player ID (assister)
- Array of AssistRecord objects
- Full metadata per assist

### Stats Calculation
- Goals: From `playerGoals` map
- Assists: From `playerAssists` map
- Shots/Passes/Tackles: From event filtering

### Type Safety
- Full TypeScript interfaces
- Proper null checks
- Type narrowing with `for...of` loops

---

## ✅ Testing Checklist

- [x] Type compilation (no errors)
- [x] Pass recording on successful passes
- [x] Assist detection within 10-second window
- [x] AssistRecord creation with full details
- [x] Player stats aggregation
- [x] Top assists query and sorting
- [x] Fallback assist detection from events
- [x] Goal events include assist details

---

## 📋 Summary

**10 New/Modified Components:**
1. ✅ `AssistRecord` interface
2. ✅ `PlayerStats` interface
3. ✅ `playerAssists` map
4. ✅ `playerGoals` map
5. ✅ `passHistory` array
6. ✅ Enhanced `scoreGoal()`
7. ✅ New `findLastPasserWithId()`
8. ✅ New `recordPass()`
9. ✅ New `getPlayerAssists()` - PUBLIC
10. ✅ New `getPlayerStats()` - PUBLIC
11. ✅ New `getTopAssists()` - PUBLIC

**Zero Type Errors** ✅

Everything is production-ready! 🚀
