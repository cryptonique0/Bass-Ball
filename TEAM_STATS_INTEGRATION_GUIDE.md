# 🔗 Team Stats Comparison - Integration Guide

## Quick Integration (5 minutes)

### Step 1: Import Component
```typescript
import { TeamStatsComparison } from '@/components/TeamStatsComparison';
```

### Step 2: Add State
```typescript
const [showStats, setShowStats] = useState(false);
```

### Step 3: Add Button
```typescript
<button onClick={() => setShowStats(true)}>
  📊 View Statistics
</button>
```

### Step 4: Render Component
```typescript
{showStats && (
  <TeamStatsComparison
    homeTeam={homeTeam}
    awayTeam={awayTeam}
    matchStats={matchStats}
    onClose={() => setShowStats(false)}
  />
)}
```

---

## Integration Scenarios

### Scenario 1: Post-Match Display

**File:** `components/LiveMatch.tsx`

```typescript
// At the end of the match
if (matchEngine && gameState.gameTime >= 90) {
  return (
    <div>
      <MatchSummary
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        matchStats={matchStats}
        matchEngine={matchEngine}
        gameTime={gameState.gameTime}
        onRestart={resetMatch}
      />
      
      {/* Add stats comparison button in MatchSummary or here */}
      <button 
        onClick={() => setShowDetailedStats(true)}
        className="mt-4 px-4 py-2 bg-yellow-500 text-black font-bold rounded"
      >
        📊 View Detailed Comparison
      </button>

      {showDetailedStats && (
        <TeamStatsComparison
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          matchStats={matchStats}
          onClose={() => setShowDetailedStats(false)}
        />
      )}
    </div>
  );
}
```

---

### Scenario 2: Live Match Stats

**File:** `components/MatchControls.tsx` or new `LiveStats.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { TeamStatsComparison } from '@/components/TeamStatsComparison';
import { MatchEngine } from '@/lib/matchEngine';

interface LiveStatsProps {
  matchEngine: MatchEngine;
}

export function LiveStats({ matchEngine }: LiveStatsProps) {
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(matchEngine.getMatchStats());

  // Update stats every second
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(matchEngine.getMatchStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [matchEngine]);

  const gameState = matchEngine.getGameState();

  return (
    <>
      {/* Show stats toggle button during match */}
      {gameState.gameTime < 90 && (
        <button 
          onClick={() => setShowStats(!showStats)}
          className="px-3 py-1 bg-yellow-500 text-black font-bold rounded text-sm"
        >
          {showStats ? '📊 Hide' : '📊 View'} Live Stats
        </button>
      )}

      {/* Display stats overlay */}
      {showStats && (
        <TeamStatsComparison
          homeTeam={gameState.homeTeam}
          awayTeam={gameState.awayTeam}
          matchStats={stats}
          onClose={() => setShowStats(false)}
        />
      )}
    </>
  );
}
```

---

### Scenario 3: Team Selection Preview

**File:** `components/TeamSelector.tsx`

```typescript
// Add to existing TeamSelector component

const [showComparison, setShowComparison] = useState(false);

// Add button to show comparison
<div className="flex gap-4 mt-4">
  <button
    onClick={onCancel}
    className="flex-1 btn btn-secondary"
  >
    ← Cancel
  </button>
  
  <button
    onClick={() => setShowComparison(true)}
    className="flex-1 btn btn-info"
  >
    📊 Compare Teams
  </button>
  
  <button
    onClick={handleConfirm}
    className="flex-1 btn btn-primary text-lg"
  >
    ✓ Apply Formation
  </button>
</div>

{/* Show comparison modal */}
{showComparison && (
  <TeamStatsComparison
    homeTeam={teams.home}
    awayTeam={teams.away}
    matchStats={{
      homeTeam: {
        goals: 0,
        shots: 0,
        shotsOnTarget: 0,
        passes: 0,
        passAccuracy: 0,
        tackles: 0,
        fouls: 0,
        possession: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
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
        assists: 0,
        yellowCards: 0,
        redCards: 0,
      },
      events: [],
    }}
    onClose={() => setShowComparison(false)}
  />
)}
```

---

### Scenario 4: Dedicated Stats Page

**File:** `components/StatsPage.tsx` (new file)

```typescript
'use client';

import React, { useState } from 'react';
import { TeamStatsComparison } from '@/components/TeamStatsComparison';
import { MatchEngine } from '@/lib/matchEngine';

interface StatsPageProps {
  matchEngine: MatchEngine;
}

export function StatsPage({ matchEngine }: StatsPageProps) {
  const gameState = matchEngine.getGameState();
  const matchStats = matchEngine.getMatchStats();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-4">
        <h1 className="text-3xl font-bold text-white">Match Statistics</h1>
      </div>

      {/* Stats Component */}
      <div className="p-4">
        <TeamStatsComparison
          homeTeam={gameState.homeTeam}
          awayTeam={gameState.awayTeam}
          matchStats={matchStats}
        />
      </div>
    </div>
  );
}
```

---

## Component Props

### Required Props

```typescript
interface TeamStatsComparisonProps {
  homeTeam: Team;           // Home team with players
  awayTeam: Team;           // Away team with players
  matchStats: MatchStats;   // Statistics object
  onClose?: () => void;     // Close callback (optional)
}
```

### Team Interface
```typescript
interface Team {
  id: string;
  name: string;
  formation: string;        // e.g., "4-3-3"
  players: Player[];
  score: number;
  possession: number;
}
```

### MatchStats Interface
```typescript
interface MatchStats {
  homeTeam: {
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
  awayTeam: {
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

---

## Data Flow

```
MatchEngine
    ↓
gameState {
  homeTeam: Team
  awayTeam: Team
  ...
}
    ↓
matchStats {
  homeTeam: { goals, shots, ... }
  awayTeam: { goals, shots, ... }
  events: MatchEvent[]
}
    ↓
TeamStatsComparison Component
    ├─ Extract stats
    ├─ Calculate percentages
    ├─ Generate insights
    └─ Render UI
         ├─ StatComparison bars
         ├─ SquadOverview
         ├─ PerformanceCategory
         ├─ TeamStrengthBar
         └─ KeyInsights
```

---

## State Management

### Option 1: Local State (Simple)
```typescript
const [showStats, setShowStats] = useState(false);

return (
  <>
    <button onClick={() => setShowStats(true)}>View Stats</button>
    {showStats && <TeamStatsComparison {...props} />}
  </>
);
```

### Option 2: Context (Complex App)
```typescript
// Create context
const StatsContext = createContext();

// Provider wrapper
<StatsContext.Provider value={{ showStats, setShowStats }}>
  {children}
</StatsContext.Provider>

// Use in component
const { showStats, setShowStats } = useContext(StatsContext);
```

### Option 3: Zustand (Large Scale)
```typescript
const useStatsStore = create((set) => ({
  showStats: false,
  setShowStats: (show) => set({ showStats: show }),
}));

// In component
const { showStats, setShowStats } = useStatsStore();
```

---

## Styling Integration

### Using Existing Tailwind Classes

The component uses standard Tailwind classes:
- `bg-gray-800`, `bg-gray-900` - Backgrounds
- `text-white`, `text-gray-300` - Text colors
- `border-yellow-500`, `border-cyan-600` - Borders
- `rounded-lg`, `rounded-xl` - Border radius
- `p-4`, `p-6` - Padding
- `flex`, `grid` - Layout

### Custom Styling

Add wrapper div for custom styling:
```typescript
<div className="my-custom-wrapper">
  <TeamStatsComparison {...props} />
</div>
```

With custom CSS:
```css
.my-custom-wrapper {
  /* Custom styles */
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(...);
}
```

---

## Performance Optimization

### Memoization

Wrap component usage with React.memo if it re-renders frequently:
```typescript
const MemoizedStats = React.memo(TeamStatsComparison);
```

### Update Frequency

Control how often stats refresh:
```typescript
// Update every 2 seconds
const interval = setInterval(() => {
  setStats(matchEngine.getMatchStats());
}, 2000);
```

### Conditional Rendering

Only show when needed:
```typescript
{showStats && <TeamStatsComparison {...props} />}
```

---

## Error Handling

### Handle Missing Data

```typescript
// Provide default/empty stats
const defaultStats: MatchStats = {
  homeTeam: { goals: 0, shots: 0, /* ... */ },
  awayTeam: { goals: 0, shots: 0, /* ... */ },
  events: [],
};

<TeamStatsComparison
  homeTeam={homeTeam || defaultTeam}
  awayTeam={awayTeam || defaultTeam}
  matchStats={matchStats || defaultStats}
/>
```

### Type Checking

```typescript
// Verify props before rendering
if (!homeTeam || !awayTeam || !matchStats) {
  return <div>Loading statistics...</div>;
}

return <TeamStatsComparison {...props} />;
```

---

## Testing Integration

### Unit Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { TeamStatsComparison } from '@/components/TeamStatsComparison';

describe('TeamStatsComparison', () => {
  it('renders with props', () => {
    const mockTeam = { /* ... */ };
    const mockStats = { /* ... */ };

    render(
      <TeamStatsComparison
        homeTeam={mockTeam}
        awayTeam={mockTeam}
        matchStats={mockStats}
      />
    );

    expect(screen.getByText('Team Statistics Comparison')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn();

    render(
      <TeamStatsComparison
        homeTeam={mockTeam}
        awayTeam={mockTeam}
        matchStats={mockStats}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

---

## Browser Compatibility

The component uses standard React and Tailwind CSS features compatible with:

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Responsive Behavior

Component automatically adapts:

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 640px | 1 column, stacked |
| Tablet | 640-1024px | 2 columns, mixed |
| Desktop | > 1024px | 3 columns, full |

No additional configuration needed!

---

## Common Integration Patterns

### Pattern 1: Match Result Page
```typescript
// Show after match ends
<MatchSummary {...props} />
<TeamStatsComparison {...props} />
```

### Pattern 2: Sidebar View
```typescript
// Show alongside game in sidebar
<div className="grid grid-cols-3 gap-4">
  <div className="col-span-2"><FootballPitch /></div>
  <div className="col-span-1"><TeamStatsComparison /></div>
</div>
```

### Pattern 3: Modal View
```typescript
// Show in modal overlay
{showStats && (
  <div className="fixed inset-0 bg-black bg-opacity-50">
    <TeamStatsComparison {...props} />
  </div>
)}
```

### Pattern 4: Tab View
```typescript
// Show in tabs
<Tabs>
  <Tab label="Summary"><MatchSummary /></Tab>
  <Tab label="Stats"><TeamStatsComparison /></Tab>
  <Tab label="Timeline"><MatchTimeline /></Tab>
</Tabs>
```

---

## Troubleshooting Integration

| Issue | Solution |
|-------|----------|
| Component not showing | Check onClose prop is passed |
| Stats not updating | Verify matchStats prop updates |
| Colors look wrong | Check Tailwind CSS is imported |
| Modal scrolling broken | Component handles max-h-[90vh] |
| Props missing error | Verify all required props passed |
| Slow performance | Wrap in React.memo if re-rendering frequently |

---

## Migration from Old Stats Component

If migrating from another stats component:

```typescript
// Old
<OldStatsComponent stats={stats} />

// New
<TeamStatsComparison
  homeTeam={homeTeam}
  awayTeam={awayTeam}
  matchStats={matchStats}
  onClose={onClose}
/>
```

---

## Next Steps After Integration

1. ✅ Import component
2. ✅ Add state and button
3. ✅ Render with props
4. ✅ Test on all screen sizes
5. ✅ Verify stats update correctly
6. ✅ Customize colors if needed
7. ✅ Deploy to production
8. ✅ Monitor performance

---

## Documentation Reference

| Document | Purpose |
|----------|---------|
| [TEAM_STATS_QUICK_REF.md](TEAM_STATS_QUICK_REF.md) | Quick start (5 min) |
| [TEAM_STATS_COMPARISON.md](TEAM_STATS_COMPARISON.md) | Complete guide (20 min) |
| [TEAM_STATS_VISUAL.md](TEAM_STATS_VISUAL.md) | Visual layouts (15 min) |
| [TEAM_STATS_COMPARISON_INDEX.md](TEAM_STATS_COMPARISON_INDEX.md) | Navigation (3 min) |
| [TEAM_STATS_DELIVERY_SUMMARY.md](TEAM_STATS_DELIVERY_SUMMARY.md) | Overview (5 min) |

---

## Support

**Component Location:** `/components/TeamStatsComparison.tsx`  
**Lines of Code:** 900+  
**Status:** Production Ready ✅  
**Last Updated:** January 18, 2026  

