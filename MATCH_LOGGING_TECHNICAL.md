# Match Logging & Replay System - Complete Technical Guide

**Status**: ✅ PRODUCTION READY
**Version**: 1.0
**Date**: January 18, 2026

---

## System Overview

A complete match logging and replay system that records detailed event-level data and enables interactive match replay. All data is stored as simple JSON for maximum portability and compatibility.

### Key Components

1. **MatchLogger** - Records match events and statistics
2. **MatchReplayer** - Plays back match events with controls
3. **MatchReplay Component** - Beautiful React UI for replay visualization

### Design Philosophy

- **Simple JSON Format** - Easy to understand, easy to export, easy to import
- **Event-Based** - Everything is recorded as timestamped events
- **No Dependencies** - Pure TypeScript, no external packages
- **Client-Side** - 100% browser-based, no server required
- **Extensible** - Easy to add new event types

---

## Data Structures

### MatchEvent

Individual recorded event in a match.

```typescript
interface MatchEvent {
  timestamp: number;           // Milliseconds since match start
  type: EventType;             // Event classification
  player: string;              // Player name or ID
  team: 'home' | 'away';       // Team
  details?: {                  // Flexible event-specific data
    [key: string]: any;
  };
}

type EventType = 
  | 'goal'              // Goal scored
  | 'assist'            // Assist provided
  | 'tackle'            // Tackle made
  | 'pass'              // Pass completed
  | 'shot'              // Shot taken
  | 'foul'              // Foul committed
  | 'possession'        // Possession change
  | 'substitution'      // Player substituted
  | 'injury'            // Player injured
  | 'card'              // Yellow/red card
  | 'period_start'      // Period starts
  | 'period_end'        // Period ends
  | 'match_start'       // Match starts
  | 'match_end';        // Match ends
```

### MatchStats

Statistics snapshot at a point in time.

```typescript
interface MatchStats {
  homeScore: number;
  awayScore: number;
  homePossession: number;      // Percentage
  awayPossession: number;      // Percentage
  homeShots: number;
  awayShots: number;
  homeTackles: number;
  awayTackles: number;
  homePasses: number;
  awayPasses: number;
  homeGoals: number;
  awayGoals: number;
  homeAssists: number;
  awayAssists: number;
}
```

### MatchLog

Complete match record.

```typescript
interface MatchLog {
  id: string;                  // Unique match ID
  timestamp: number;           // Match start time (ms since epoch)
  homeTeam: string;
  awayTeam: string;
  duration: number;            // Total duration in minutes
  finalScore: {
    home: number;
    away: number;
  };
  events: MatchEvent[];        // All recorded events
  playerStats: {
    [playerName: string]: {
      team: 'home' | 'away';
      goals: number;
      assists: number;
      shots: number;
      tackles: number;
      passes: number;
      fouls: number;
      cards?: 'yellow' | 'red';
    };
  };
  timeline: MatchStats[];      // Optional stats snapshots
  metadata?: {                 // Optional metadata
    location?: string;
    weather?: string;
    notes?: string;
    [key: string]: any;
  };
}
```

---

## MatchLogger API

### Singleton Pattern

```typescript
// Get logger instance
const logger = MatchLogger.getInstance();

// All subsequent calls use same instance
const logger2 = MatchLogger.getInstance();
console.log(logger === logger2); // true
```

### Core Methods

#### startMatch(homeTeam, awayTeam, duration)

Begins recording a match.

```typescript
logger.startMatch('Team A', 'Team B', 90);
// Automatically records match_start event
```

#### recordEvent(type, player, team, details)

Records a single match event.

```typescript
// Simple event
logger.recordEvent('goal', 'John Doe', 'home');

// Event with details
logger.recordEvent('shot', 'Jane Smith', 'home', {
  onTarget: true,
  powerful: true,
});

// Card event with card type
logger.recordEvent('card', 'Bad Player', 'away', {
  card: 'yellow',  // or 'red'
});
```

#### recordStats(stats)

Records a statistics snapshot (optional).

```typescript
logger.recordStats({
  homeScore: 1,
  awayScore: 0,
  homePossession: 55,
  awayPossession: 45,
  homeShots: 5,
  awayShots: 3,
  homeTackles: 12,
  awayTackles: 10,
  homePasses: 250,
  awayPasses: 200,
  homeGoals: 1,
  awayGoals: 0,
  homeAssists: 1,
  awayAssists: 0,
});
```

#### endMatch(finalScore)

Completes match recording.

```typescript
const match = logger.endMatch({ home: 2, away: 1 });
// Returns: MatchLog object with all recorded data
// Automatically records match_end event
```

### Static Storage Methods

#### saveToStorage(match, key?)

Saves match to localStorage.

```typescript
MatchLogger.saveToStorage(match);
// Key: match_log_${match.id}

MatchLogger.saveToStorage(match, 'custom_key');
// Custom key: custom_key
```

#### loadFromStorage(key)

Loads match from localStorage.

```typescript
const match = MatchLogger.loadFromStorage('match_log_xyz');
// Returns: MatchLog | null
```

#### getAllLogsFromStorage()

Retrieves all stored matches (sorted newest first).

```typescript
const matches = MatchLogger.getAllLogsFromStorage();
// Returns: MatchLog[] (sorted by timestamp descending)
```

### Static Export Methods

#### toJSON(match)

Converts match to JSON string.

```typescript
const json = MatchLogger.toJSON(match);
// Pretty-printed with 2-space indent

// Send to server or file
fetch('/api/matches', {
  method: 'POST',
  body: json,
});
```

#### fromJSON(json)

Parses match from JSON string.

```typescript
const json = '{"id":"match_123",...}';
const match = MatchLogger.fromJSON(json);
// Returns: MatchLog
```

#### toCSV(match)

Exports match as CSV format.

```typescript
const csv = MatchLogger.toCSV(match);
// Returns: Multi-section CSV string
// Sections: Match info, Player stats, Events
```

#### generateHighlights(match)

Extracts key match moments.

```typescript
const highlights = MatchLogger.generateHighlights(match);
// Returns: string[] of formatted highlights
// Example: ["⚽ John Doe (home) - 2'", "🟡 Bad Player - 45'"]
```

#### getMatchStats(match)

Calculates match statistics.

```typescript
const stats = MatchLogger.getMatchStats(match);
// Returns: {
//   totalEvents: 45,
//   totalGoals: 3,
//   totalAssists: 2,
//   totalTackles: 32,
//   totalPasses: 512,
//   topScorer: { name: 'John Doe', goals: 2 },
//   topAssister: { name: 'Jane Smith', assists: 1 }
// }
```

#### generateReport(match)

Creates human-readable match report.

```typescript
const report = MatchLogger.generateReport(match);
// Returns: Formatted text report with:
// - Match summary
// - Final score
// - Highlights
// - Player statistics
// - Statistics totals
```

---

## MatchReplayer API

### Constructor

```typescript
const replayer = new MatchReplayer(match);
// Create replayer for specific match
```

### Control Methods

#### play(onEvent?)

Starts playback.

```typescript
replayer.play((event) => {
  console.log(`Event: ${event.type} by ${event.player}`);
});

// Or without callback
replayer.play();
```

#### pause()

Pauses playback at current position.

```typescript
replayer.pause();
// Can later call resume()
```

#### resume(onEvent?)

Resumes from pause.

```typescript
replayer.resume((event) => {
  updateUI(event);
});
```

#### stop()

Stops and resets to beginning.

```typescript
replayer.stop();
// Resets currentEventIndex to 0
```

#### skipTo(seconds)

Jumps to specific time.

```typescript
replayer.skipTo(45); // Jump to 45-second mark
// Automatically finds nearest event
```

#### getNextEvent()

Gets next event in sequence.

```typescript
const event = replayer.getNextEvent();
if (event) {
  console.log(event);
} else {
  console.log('Replay complete');
}
```

#### getCurrentTime()

Gets current playback time in seconds.

```typescript
const seconds = replayer.getCurrentTime();
// 0-4200 for 70-minute match
```

#### getProgress()

Gets playback progress percentage.

```typescript
const progress = replayer.getProgress();
// 0-100
```

#### setSpeed(speed)

Sets playback speed multiplier.

```typescript
replayer.setSpeed(1.5);    // 1.5x speed
replayer.setSpeed(0.5);    // 0.5x speed (slow-mo)
replayer.setSpeed(2);      // 2x speed (fast-forward)
// Clamped to 0.25x - 2x
```

---

## MatchReplay Component

### Props

```typescript
interface MatchReplayProps {
  match: MatchLog;             // Required
  compact?: boolean;           // Default: false
  autoPlay?: boolean;          // Default: false
}
```

### Display Modes

**Full Mode** (compact={false})
- Large score display
- Play/pause controls
- Speed selector
- Timeline scrubber
- Event timeline (left)
- Player stats (right)
- Statistics summary
- Export buttons (JSON, CSV, Report)

**Compact Mode** (compact={true})
- Smaller score display
- Play/pause + reset buttons
- Timeline scrubber
- Event summary cards
- No export buttons
- Minimal visual footprint

### Features

**Score Display**
- Live updating during replay
- Color-coded home (blue) vs away (indigo)
- Large, easy-to-read numbers

**Timeline Scrubber**
- Click anywhere to seek
- Smooth progress indicator
- Time display (current/total)
- Hover to expand

**Event Timeline**
- Color-coded by type (goals, cards, etc.)
- Player names
- Timestamps
- Emoji indicators
- Real-time filtering based on replay time

**Player Stats**
- Top scorer highlight
- Top assister highlight
- Performance ranking
- Full stat breakdown

**Match Statistics**
- Total events
- Total goals/assists/tackles/passes
- Quick glance metrics

**Export Options**
- JSON (full data)
- CSV (spreadsheet)
- Report (text summary)
- One-click downloads

---

## Usage Examples

### Simple Match Recording

```typescript
import { createSimpleMatchLogger } from '@/lib/matchLogger';

const log = createSimpleMatchLogger();

// During match
log.recordGoal('John Doe', 'home');
log.recordAssist('Jane Smith', 'home');
log.recordShot('Mike Johnson', 'away');
log.recordTackle('Defender Name', 'home');
log.recordFoul('Bad Player', 'away');
log.recordCard('Bad Player', 'away', 'yellow');

// After match (get from guestMode)
const match = /* match from game */;
MatchLogger.saveToStorage(match);
```

### Detailed Match Recording

```typescript
import { MatchLogger } from '@/lib/matchLogger';

const logger = MatchLogger.getInstance();

logger.startMatch('Team A', 'Team B', 90);

// First period
logger.recordEvent('period_start', 'system', 'home');

// Events with 45-second interval
logger.recordEvent('goal', 'John Doe', 'home', {
  type: 'open_play',
  distance: 15,
});

logger.recordEvent('assist', 'Jane Smith', 'home');

// After 45 minutes
logger.recordStats({
  homeScore: 1,
  awayScore: 0,
  homePossession: 60,
  awayPossession: 40,
  // ... more stats
});

// Second period
logger.recordEvent('period_start', 'system', 'home');

logger.recordEvent('card', 'Bad Player', 'away', {
  card: 'yellow',
});

logger.recordEvent('goal', 'Away Scorer', 'away', {
  type: 'open_play',
});

// End match
const match = logger.endMatch({ home: 1, away: 1 });

// Save
MatchLogger.saveToStorage(match);
```

### Display with React Component

```tsx
import MatchReplay from '@/components/MatchReplay';
import { MatchLogger } from '@/lib/matchLogger';

export function MatchDetail({ matchId }: { matchId: string }) {
  const match = MatchLogger.loadFromStorage(`match_log_${matchId}`);

  if (!match) {
    return <div>Match not found</div>;
  }

  return <MatchReplay match={match} />;
}
```

### Export and Analysis

```typescript
const allMatches = MatchLogger.getAllLogsFromStorage();

// Generate reports
allMatches.forEach(match => {
  const report = MatchLogger.generateReport(match);
  console.log(report);

  const highlights = MatchLogger.generateHighlights(match);
  console.log('Highlights:', highlights);

  const stats = MatchLogger.getMatchStats(match);
  console.log('Stats:', stats);
});

// Export as JSON
const json = MatchLogger.toJSON(allMatches[0]);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'match.json';
a.click();
```

---

## Data Flow

### Recording Flow

```
User Action
    ↓
recordEvent(type, player, team, details)
    ↓
Create MatchEvent (with timestamp)
    ↓
Add to eventBuffer
    ↓
Update playerStats
    ↓
Store in eventBuffer
    ↓
Later: endMatch() → Compile into MatchLog
    ↓
Save to localStorage
```

### Replay Flow

```
MatchLog
    ↓
New MatchReplayer(match)
    ↓
play()
    ↓
Loop through events in order
    ↓
Calculate delay between events
    ↓
Call onEvent callback with event
    ↓
Update UI (score, timeline, etc.)
    ↓
Continue until all events played
    ↓
Completion
```

---

## Storage Structure

### localStorage Layout

```
Key: match_log_${match.id}
Value: {
  "id": "match_1705600000000_abc123",
  "timestamp": 1705600000000,
  "homeTeam": "Team A",
  "awayTeam": "Team B",
  "duration": 90,
  "finalScore": { "home": 2, "away": 1 },
  "events": [ ... ],
  "playerStats": { ... },
  "timeline": [ ... ]
}
```

### Size Estimation

- Minimal match (10 events): ~1 KB
- Average match (50 events): ~3 KB
- Detailed match (100+ events): ~5 KB
- With timeline snapshots: +10 KB per snapshot

### Optimization

```typescript
// Clear old matches (keep only last 50)
const matches = MatchLogger.getAllLogsFromStorage();
if (matches.length > 50) {
  matches.slice(50).forEach(m => {
    localStorage.removeItem(`match_log_${m.id}`);
  });
}

// Reduce timeline data
match.timeline = match.timeline.slice(0, 5); // Keep only 5 snapshots
MatchLogger.saveToStorage(match);
```

---

## Integration Points

### With GuestModeManager

```typescript
// In recordMatch() in guestMode.ts
import { MatchLogger } from '@/lib/matchLogger';

const logger = MatchLogger.getInstance();
logger.startMatch(homeTeam, awayTeam, duration);

// During match
logger.recordEvent('goal', playerName, team);
logger.recordEvent('assist', assistName, team);

// At end
const matchLog = logger.endMatch(finalScore);
MatchLogger.saveToStorage(matchLog);

// Return both match record and log
return {
  player,
  match: matchRecord,
  matchLog,
};
```

### With PlayerProfile

```tsx
// Display match replays in player history
{player.matchHistory.map(match => (
  <MatchReplay
    key={match.id}
    match={matchLog}
    compact={true}
  />
))}
```

### With FairnessValidator

```typescript
// Analyze events for anomalies
const match = MatchLogger.loadFromStorage(key);
const stats = MatchLogger.getMatchStats(match);

// Check consistency
if (stats.totalGoals !== match.finalScore.home + match.finalScore.away) {
  flagMatch('Score inconsistency');
}

// Check for suspicious patterns
const goalEvents = match.events.filter(e => e.type === 'goal');
const timeBetweenGoals = goalEvents.map((e, i) => {
  if (i === 0) return 0;
  return e.timestamp - goalEvents[i - 1].timestamp;
});

// Detect rapid scoring (suspicious)
if (timeBetweenGoals.some(t => t < 5000)) { // Less than 5 seconds
  flagMatch('Rapid consecutive goals');
}
```

---

## Performance Characteristics

### Time Complexity

| Operation | Time |
|-----------|------|
| recordEvent | O(1) |
| startMatch | O(1) |
| endMatch | O(n) where n=events |
| toJSON | O(n) |
| getMatchStats | O(p) where p=players |
| generateReport | O(n + p) |
| Replay play | O(n) over time |

### Space Complexity

| Data | Space |
|------|-------|
| Per event | ~200 bytes |
| Per match (50 events) | ~3 KB |
| 100 matches | ~300 KB |

### Optimization Tips

1. **Lazy load matches** - Don't load all at once
2. **Limit timeline snapshots** - Use ~5 snapshots max
3. **Clean old matches** - Archive matches older than 30 days
4. **Compress JSON** - gzip reduces by 80%

---

## Testing

### Unit Tests

```typescript
// Test recording
test('records events correctly', () => {
  const logger = MatchLogger.getInstance();
  logger.startMatch('A', 'B', 90);
  
  logger.recordEvent('goal', 'John', 'home');
  logger.recordEvent('assist', 'Jane', 'home');
  
  const match = logger.endMatch({ home: 1, away: 0 });
  
  expect(match.events).toHaveLength(4); // start + 2 + end
  expect(match.playerStats['John'].goals).toBe(1);
  expect(match.playerStats['Jane'].assists).toBe(1);
});

// Test replay
test('replays events in order', () => {
  const replayer = new MatchReplayer(match);
  const events: MatchEvent[] = [];
  
  replayer.play(e => events.push(e));
  
  // Wait for replay to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  expect(events.length).toBe(match.events.length);
});

// Test storage
test('saves and loads from storage', () => {
  const match = createTestMatch();
  MatchLogger.saveToStorage(match);
  
  const loaded = MatchLogger.loadFromStorage(`match_log_${match.id}`);
  
  expect(JSON.stringify(loaded)).toBe(JSON.stringify(match));
});
```

---

## Troubleshooting

### Events not recording

**Cause**: startMatch() not called
**Solution**: Always call `logger.startMatch()` before recording

### Score not updating in replay

**Cause**: Using wrong event type
**Solution**: Use `recordEvent('goal', ...)` not custom type

### Replay stops mid-match

**Cause**: Invalid timestamps
**Solution**: Ensure timestamps increase: `timestamp > previousTimestamp`

### localStorage full

**Cause**: Too many matches stored
**Solution**: Delete old matches or export and archive

### Export file blank

**Cause**: Match has no events
**Solution**: Ensure events recorded before endMatch()

---

## Future Enhancements

1. **Real-time sync** - Sync with server during match
2. **Video overlay** - Sync with video footage
3. **Heat maps** - Visualize player positions
4. **Pass accuracy** - Track successful vs failed passes
5. **Distance covered** - Calculate player distance
6. **Speed metrics** - Peak speed, average speed
7. **Predictive analysis** - ML-based predictions
8. **Multi-angle replay** - Multiple camera angles
9. **Instant replay** - Slow-motion key moments
10. **Social sharing** - Share highlights easily

---

## Best Practices

✅ **Do**
- Call startMatch before recording
- Call endMatch to finalize match
- Save to storage after match ends
- Use appropriate event types
- Include details for important events
- Clean old matches periodically
- Export for analysis and backup

❌ **Don't**
- Create multiple MatchLogger instances (use getInstance)
- Modify match object after endMatch
- Rely on localStorage alone (export important data)
- Record timestamps manually (they're automatic)
- Forget to save to storage
- Store sensitive player data
- Exceed 5MB localStorage limit

---

**Version**: 1.0
**Status**: ✅ Production Ready
**Last Updated**: January 18, 2026
