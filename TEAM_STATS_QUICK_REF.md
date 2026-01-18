# 📊 Team Stats Comparison - Quick Reference

## ⚡ Quick Start

```typescript
import { TeamStatsComparison } from '@/components/TeamStatsComparison';

// Basic usage
<TeamStatsComparison
  homeTeam={homeTeam}
  awayTeam={awayTeam}
  matchStats={matchStats}
  onClose={() => setShowStats(false)}
/>
```

---

## 📋 Features at a Glance

| Feature | Description | Components |
|---------|-------------|------------|
| **11 Statistics** | Goals, shots, possession, passes, tackles, fouls, cards, assists | StatComparison |
| **Comparison Bars** | Yellow (home) vs Cyan (away) visual comparison | StatComparison |
| **Squad Overview** | Player counts by position (GK, DEF, MID, FWD) | SquadOverview |
| **Categories** | Attacking, Possession, Defending groupings | PerformanceCategory |
| **Team Strength** | 0-100 power rating based on attributes | TeamStrengthBar |
| **Key Insights** | AI-generated match analysis | KeyInsights |
| **Responsive** | Mobile, tablet, and desktop layouts | All |

---

## 🎨 Component Structure

```
TeamStatsComparison (Main)
├── Header
├── Team Headers (Home | Overall | Away)
├── Squad Overview (3 cards)
├── Main Statistics Grid (11 bars)
├── Performance Categories (3 columns)
│   ├── Attacking
│   ├── Possession
│   └── Defending
├── Team Strength Analysis
├── Key Insights
└── Close Button
```

---

## 📊 Statistics Displayed

### Core Stats (11 Total)

```
⚽ Goals          - Scored goals
🎯 Shots          - Total shot attempts
🎪 Shots on Target - On-goal shots
🔵 Possession %   - Time with ball
🔀 Passes         - Completed passes
✓  Pass Accuracy  - Successful pass %
🛡️  Tackles        - Defensive actions
⚠️  Fouls         - Rule violations
🟨 Yellow Cards   - Warnings
🟥 Red Cards      - Sending offs
🤝 Assists        - Goal assists
```

---

## 🎨 Color Scheme

| Category | Color | Use |
|----------|-------|-----|
| Home | Yellow/Gold | Team 1 bars |
| Away | Cyan/Blue | Team 2 bars |
| Attacking | Red | Attack stats |
| Possession | Blue | Ball control |
| Defending | Green | Defensive stats |
| Background | Dark Gray | Main background |

---

## 💡 Key Insights Logic

Automatically generates insights for:

- ✅ **Possession Dominance** - If >15% difference
- ✅ **Shot Accuracy** - If >20% difference
- ✅ **Defensive Strength** - If >5 more tackles
- ✅ **Discipline** - If >2 more cards
- ✅ **Balanced Match** - If stats are even

---

## 🔧 Sub-Components

### SquadOverview
Shows player distribution by position.
```typescript
<SquadOverview team={team} isHome={true} />
```

### StatComparison
Single stat with comparison bar.
```typescript
<StatComparison
  label="Possession %"
  home={55}
  away={45}
  icon="🔵"
  max={100}
/>
```

### PerformanceCategory
Grouped statistics section.
```typescript
<PerformanceCategory
  title="Attacking"
  stats={[...]}
  color="red"
/>
```

### TeamStrengthBar
Power rating visualization.
```typescript
<TeamStrengthBar
  label="Team Name"
  strength={72.5}
  color="from-yellow-400 to-yellow-600"
  position="left"
/>
```

### KeyInsights
Match analysis generator.
```typescript
<KeyInsights
  homeTeam={homeTeam}
  awayTeam={awayTeam}
  matchStats={matchStats}
/>
```

---

## 📱 Responsive Breakpoints

| Device | Layout | Notes |
|--------|--------|-------|
| Mobile (<640px) | 1 column | Stacked cards, full-width bars |
| Tablet (640-1024px) | 2 column | Optimized spacing |
| Desktop (>1024px) | 3 column | Full layout, large bars |

---

## ⚙️ Props Interface

```typescript
interface TeamStatsComparisonProps {
  homeTeam: Team;              // Home team object
  awayTeam: Team;              // Away team object
  matchStats: MatchStats;      // Match stats from engine
  onClose?: () => void;        // Close callback
}
```

---

## 🚀 Common Use Cases

### 1. Post-Match Display
```typescript
if (matchEngine.gameState.gameTime >= 90) {
  return <TeamStatsComparison {...props} />;
}
```

### 2. Real-Time Live Stats
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setStats(matchEngine.getMatchStats());
  }, 1000);
}, [matchEngine]);
```

### 3. Team Selection Preview
```typescript
<button onClick={() => setShowComparison(true)}>
  Compare Teams
</button>
{showComparison && <TeamStatsComparison {...props} />}
```

### 4. Tactical Analysis
```typescript
// Compare by formation
const stats = matchStats.events.filter(
  e => homeTeam.formation === selectedFormation
);
```

---

## 🎯 Data Sources

| Data | Source | Update Frequency |
|------|--------|------------------|
| Goals, Shots | MatchEngine | Per shot event |
| Possession | updatePossession() | Every frame |
| Passes | recordPass() | Per pass event |
| Tackles | checkTackle() | Per match tick |
| Cards | playerCards Map | Per infraction |
| Assists | playerAssists Map | Per goal event |
| Player Stats | getPlayerStats() | On request |

---

## 📈 Calculation Formulas

### Team Strength
```
strength = avg(pace, shooting, passing, dribbling, defense, physical)
range: 0-100
```

### Stat Percentages
```
percent = (value / max) * 100
```

### Shot Efficiency
```
efficiency = (shotsOnTarget / totalShots) * 100
```

### Pass Accuracy
```
accuracy = (completedPasses / totalPasses) * 100
```

---

## 🎓 Examples

### Example 1: Basic Usage
```typescript
function MatchResult() {
  const [showStats, setShowStats] = useState(false);

  return (
    <>
      <button onClick={() => setShowStats(true)}>View Stats</button>
      {showStats && (
        <TeamStatsComparison
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          matchStats={matchStats}
          onClose={() => setShowStats(false)}
        />
      )}
    </>
  );
}
```

### Example 2: Styled Button Integration
```typescript
<button
  onClick={() => setShowComparison(true)}
  className="px-4 py-2 bg-yellow-500 text-black font-bold rounded"
>
  📊 Compare Teams
</button>
```

### Example 3: Modal Dialog
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

## 🔍 Customization Quick Tips

### Change Colors
Edit `colorMap` in `PerformanceCategory`:
```typescript
const colorMap = {
  red: {
    bg: 'bg-purple-900 bg-opacity-20',
    border: 'border-purple-700',
    text: 'text-purple-400',
  },
  // ...
};
```

### Add New Statistic
In `stats` useMemo:
```typescript
{
  label: 'New Stat',
  home: matchStats.homeTeam.newStat,
  away: matchStats.awayTeam.newStat,
  icon: '📊',
}
```

### Modify Insights Threshold
In `KeyInsights` component:
```typescript
if (homePoss > awayPoss + 20) {  // Changed from 15
  result.push({...});
}
```

---

## ⚡ Performance Tips

- ✅ Uses `useMemo` for expensive calculations
- ✅ Conditional rendering for insights
- ✅ CSS transitions for smooth animations
- ✅ No unnecessary re-renders

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Stats not updating | Verify matchEngine updates matchStats |
| Colors not showing | Check Tailwind CSS config |
| Modal overflow | Already handles with max-h-[90vh] |
| Bars too small | Check stat values are non-zero |
| Text cut off | Responsive design handles all sizes |

---

## 📦 Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Game Engine (for MatchStats)

---

## 🚀 Next Steps

1. Add to LiveMatch for post-match view
2. Integrate with MatchSummary
3. Add export/download feature
4. Create team comparison view
5. Add historical stat tracking
6. Implement leaderboard system

---

## 📊 Quick Stats Reference

```
Attacking Stats:
  • Goals (⚽)
  • Shots (🎯)
  • Shots on Target (🎪)
  • Assists (🤝)

Possession Stats:
  • Possession % (🔵)
  • Passes (🔀)
  • Pass Accuracy % (✓)

Defending Stats:
  • Tackles (🛡️)
  • Fouls (⚠️)
  • Yellow Cards (🟨)
  • Red Cards (🟥)
```

---

## 📝 File Location
`/components/TeamStatsComparison.tsx` (900+ lines)

---

## ✅ Status
**Production Ready** ✓ - Fully functional, type-safe, optimized

