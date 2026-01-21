# Advanced Analytics Guide

## Overview

The Advanced Analytics system provides comprehensive tools for analyzing player performance, match dynamics, and meta-game trends. It includes heatmap visualization, behavior pattern detection, predictive modeling, and strategic analysis.

**System Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained by**: Analytics Team

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Heatmap System](#heatmap-system)
3. [Player Behavior Analytics](#player-behavior-analytics)
4. [Prediction Models](#prediction-models)
5. [Meta-Game Analytics](#meta-game-analytics)
6. [React Integration](#react-integration)
7. [API Reference](#api-reference)
8. [Examples](#examples)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The Advanced Analytics system is composed of three core modules:

### Service Layer

**`services/analytics-advanced.ts`**
- Handles individual player and match analytics
- Manages heatmaps, behavior tracking, and predictions
- Persists data to localStorage

**`lib/metaAnalytics.ts`**
- Analyzes formation effectiveness
- Tracks strategic trends
- Provides comparative analytics across matches

### React Integration

**`src/hooks/useAnalytics.ts`**
- Four custom hooks for analytics features
- State management and data binding
- Integration with service layer

### UI Layer

**`src/app/analytics-demo/page.tsx`**
- Demo dashboard with 4 feature tabs
- Interactive visualizations
- Real-time data updates

### Data Persistence

All analytics data is persisted to localStorage with two root keys:
- `advancedAnalytics:global` - Individual player/match analytics
- `metaAnalytics:global` - Formation and strategic trends

---

## Heatmap System

### Purpose

Heatmaps visualize spatial distribution of player activities across the field. They provide visual insight into:
- Player positioning preferences
- Action hotspots (passes, shots, tackles)
- Coverage patterns and defensive positioning
- Offensive focal points

### Heatmap Types

The system supports five types of heatmaps:

| Type | Description | Use Case |
|------|-------------|----------|
| **pass** | All player passes mapped to field locations | Identifying playmaking areas |
| **shot** | Shot locations and success | Offensive efficiency analysis |
| **tackle** | Defensive actions and positioning | Defensive pattern analysis |
| **run** | High-speed movement patterns | Workload and positioning analysis |
| **dribble** | Ball carrying and progression | Creative player analysis |

### Data Structure

```typescript
interface HeatmapPoint {
  x: number;           // 0-100 field X coordinate
  y: number;           // 0-100 field Y coordinate
  intensity: number;   // 1-100 intensity value
  timestamp: number;   // Event timestamp
}

interface Heatmap {
  id: string;
  playerId: string;
  matchId: string;
  type: 'pass' | 'shot' | 'tackle' | 'run' | 'dribble';
  points: HeatmapPoint[];
  gridSize: 10 | 20;    // Grid resolution
  createdAt: number;
}
```

### Creating a Heatmap

```typescript
const { createHeatmap, addHeatmapPoint, getHeatmapGrid } = useHeatmaps('player123', 'match456');

// Create new heatmap
const heatmapId = await createHeatmap('pass', 10);

// Add points (e.g., pass completion)
await addHeatmapPoint(heatmapId, 45.2, 78.5, 85);  // x, y, intensity
await addHeatmapPoint(heatmapId, 52.1, 65.3, 70);

// Get visualizable grid
const grid = await getHeatmapGrid(heatmapId);  // Returns 2D intensity array
```

### Intensity Calculation

The system uses Gaussian distribution to calculate cell intensity:

```
For each cell in the grid:
  - Calculate distance from each point to cell center
  - Apply Gaussian kernel: exp(-distance² / (2 * sigma²))
  - Normalize to 0-100 range
```

This creates smooth intensity gradients rather than sharp boundaries.

### Grid Visualization

Heatmaps support two grid resolutions:

- **10x10 Grid**: Lower resolution, faster rendering (100 cells)
- **20x20 Grid**: Higher precision, more detail (400 cells)

Each cell shows intensity as a color gradient from cool (low intensity) to hot (high intensity).

---

## Player Behavior Analytics

### Purpose

Behavior analytics tracks player performance characteristics and identifies consistent patterns of play.

### Tracked Metrics (10 Total)

| Metric | Range | Description |
|--------|-------|-------------|
| **passAccuracy** | 0-100 | Percentage of successful passes |
| **shotAccuracy** | 0-100 | Percentage of shots on target |
| **dribbleSuccessRate** | 0-100 | Percentage of successful dribble attempts |
| **avgPassLength** | 0-100 | Average pass distance (meters / field width) |
| **avgRunDistance** | 0-100 | Average sprint distance (normalized) |
| **pressureResistance** | 0-100 | Performance under opponent pressure |
| **creativeIndex** | 0-100 | Offensive creativity and key passes |
| **defensivePresence** | 0-100 | Defensive positioning and intensity |
| **positioningScore** | 0-100 | Tactical positioning effectiveness |
| **consistency** | 0-100 | Performance consistency (variance inverse) |

### Recording Behavior

```typescript
const { recordBehavior, getPlayerBehaviorHistory, analyzePatterns } = useBehaviorAnalytics('player123');

// Record a behavior snapshot
await recordBehavior({
  passAccuracy: 82,
  shotAccuracy: 65,
  dribbleSuccessRate: 71,
  avgPassLength: 45,
  avgRunDistance: 38,
  pressureResistance: 75,
  creativeIndex: 68,
  defensivePresence: 45,
  positioningScore: 79,
  consistency: 81
});

// Get historical data
const history = await getPlayerBehaviorHistory();
// Returns: { recordedAt: number, metrics: ... }[]

// Analyze for patterns
const patterns = await analyzePatterns();
```

### Behavior Patterns

The system automatically detects 6 pattern types:

| Pattern | Characteristics | Confidence |
|---------|-----------------|-----------|
| **aggressive** | High creativity + low pressure resistance | Score 0-100 |
| **defensive** | High defensive presence + low creation | Score 0-100 |
| **creative** | High creative index + variable others | Score 0-100 |
| **balanced** | Consistent metrics across board | Score 0-100 |
| **unpredictable** | High variance in metrics | Score 0-100 |
| **inconsistent** | Low consistency score | Score 0-100 |

### Pattern Detection Algorithm

Patterns are triggered automatically when recording behavior:

```
1. Calculate metric averages over last 5 records
2. Check pattern conditions:
   - Aggressive: creativity > 70 && pressure < 40
   - Defensive: defensive > 70 && creative < 40
   - Creative: creativity > 75 && passing > 70
   - Balanced: all metrics within ±10 of average
   - Unpredictable: metric variance > threshold
   - Inconsistent: consistency < 50
3. Generate pattern with confidence score
4. Store triggers (metric combinations that activate pattern)
5. Calculate pattern effectiveness
```

---

## Prediction Models

### Purpose

Prediction models forecast player performance, injury risk, match outcomes, and player ratings using historical data and behavior patterns.

### Model Types

| Type | Target | Features | Accuracy |
|------|--------|----------|----------|
| **performance** | Next match rating (0-100) | Recent stats, patterns | Calibrated |
| **injury_risk** | Injury probability (%) | Workload, consistency | Calibrated |
| **match_outcome** | Win/Draw/Loss probability | Formation, trends | Calibrated |
| **player_rating** | Next match rating | Behavior metrics | Calibrated |

### Creating a Model

```typescript
const { createModel, makePrediction, verifyPrediction } = usePredictions();

// Create a new model
const modelId = await createModel('performance', {
  minSamples: 10,        // Minimum historical records
  trainingPeriod: 604800, // 7 days in ms
  features: ['passAccuracy', 'creativeIndex', 'consistency']
});

// Make a prediction
const prediction = await makePrediction(modelId, {
  passAccuracy: 80,
  creativeIndex: 75,
  consistency: 82
});

// Returns:
// {
//   id: string,
//   modelId: string,
//   prediction: 78.5,
//   probability: 0.85,
//   confidence: 87,
//   reasoning: "Player showing consistent high performance...",
//   createdAt: number,
//   expiresAt: number
// }
```

### Calibration

Models track calibration to improve accuracy:

```typescript
// Verify prediction with actual outcome
await verifyPrediction(predictionId, actualOutcome);

// Returns calibration metrics:
// {
//   totalPredictions: 145,
//   correctPredictions: 128,
//   accuracy: 88.3,
//   calibrationError: 2.1
// }
```

### Prediction Lifecycle

1. **Creation** - Model trained on historical data
2. **Prediction** - Forecast generated with confidence score
3. **Expiration** - Predictions expire after 7 days
4. **Verification** - Actual outcome recorded when available
5. **Calibration** - Model accuracy updated based on verification

---

## Meta-Game Analytics

### Purpose

Meta-game analytics analyzes formation effectiveness, strategic trends, and competitive balance across the player base.

### Formations

Five pre-configured formations available:

| Formation | Defensive Rating | Offensive Rating | Balance | Description |
|-----------|-----------------|-----------------|---------|-------------|
| **4-3-3** | 75 | 78 | 76 | Balanced, versatile setup |
| **4-4-2** | 80 | 72 | 76 | Defensive stability, classic |
| **5-3-2** | 88 | 65 | 76 | Highly defensive |
| **3-5-2** | 70 | 82 | 76 | Aggressive, open |
| **4-2-3-1** | 78 | 79 | 78 | Flexible, modern |

### Formation Statistics

For each formation, system tracks:

```typescript
interface FormationStats {
  matches: number;        // Total matches
  wins: number;           // Victory count
  draws: number;          // Draw count
  losses: number;         // Loss count
  avgPossession: number;  // % possession
  avgShots: number;       // Shots per match
  avgAccuracy: number;    // Shot accuracy %
}
```

### Strategy System

Strategies combine a formation with specific tactics:

```typescript
interface Strategy {
  id: string;
  formation: string;                    // Formation ID
  tactics: string[];                    // Tactical keywords
  winRate: number;                      // Win rate %
  counters: CounterStrategy[];          // Effective counters
}

interface CounterStrategy {
  strategy: string;                     // Counter strategy ID
  effectiveness: number;                // 0-100 effectiveness rating
}
```

### Recording Formation Performance

```typescript
const { recordFormationMatch, getTopFormations } = useMetaAnalytics();

// Record match result
await recordFormationMatch('4-3-3', 'win', {
  possession: 55.2,
  shots: 14,
  accuracy: 64.3
});

// Get top formations by win rate
const topFormations = await getTopFormations(5);
// Returns sorted by win rate descending
```

### Meta Trends

System tracks formation popularity and performance trends:

```typescript
interface MetaTrend {
  formation: string;
  direction: 'rising' | 'falling' | 'stable';
  momentum: number;           // -100 to 100
  lastPeriodWinRate: number; // Current period %
  previousWinRate: number;   // Previous period %
  periodType: 'week' | 'month' | 'season';
}
```

### Trend Analysis

```typescript
const { recordTrend, getRisingTrends, getFallingTrends } = useMetaAnalytics();

// Record formation trend
await recordTrend('4-3-3', {
  currentWinRate: 62.5,
  previousWinRate: 58.2,
  periodType: 'week'
});

// Get rising formations
const rising = await getRisingTrends();
// Formations gaining popularity and winning

// Get falling formations
const falling = await getFallingTrends();
// Formations losing effectiveness
```

### Formation Advantage Analysis

```typescript
const { analyzeFormationMismatch } = useMetaAnalytics();

// Analyze advantage
const analysis = await analyzeFormationMismatch('4-3-3', '5-3-2');
// Returns:
// {
//   attackingFormation: '4-3-3',
//   defendingFormation: '5-3-2',
//   advantageRating: 65,
//   winRateAgainst: 58.2,
//   tacticalNotes: "Attacking formation has mobility advantage..."
// }
```

---

## React Integration

### Hook: useHeatmaps

Creates and manages heatmaps for a specific player and match.

```typescript
const {
  heatmaps,                    // All heatmaps for this player/match
  selectedHeatmap,             // Currently selected heatmap
  createHeatmap,               // (type, gridSize) => Promise<string>
  addHeatmapPoint,             // (id, x, y, intensity) => Promise<void>
  selectHeatmap,               // (id) => void
  deleteHeatmap,               // (id) => void
  getHeatmapGrid               // (id) => Promise<number[][]>
} = useHeatmaps(playerId, matchId);
```

### Hook: useBehaviorAnalytics

Tracks and analyzes player behavior patterns.

```typescript
const {
  behaviors,                   // Historical behavior records
  currentBehavior,             // Latest behavior snapshot
  averageBehavior,             // 5-record average
  patterns,                    // Detected behavior patterns
  recordBehavior,              // (metrics) => Promise<void>
  getPlayerBehaviorHistory,    // () => Promise<BehaviorRecord[]>
  getAverageBehavior,          // () => Promise<Metrics>
  analyzePatterns              // () => Promise<BehaviorPattern[]>
} = useBehaviorAnalytics(playerId);
```

### Hook: usePredictions

Creates prediction models and makes forecasts.

```typescript
const {
  models,                      // All trained models
  predictions,                 // All predictions
  createModel,                 // (type, config) => Promise<string>
  makePrediction,              // (modelId, data) => Promise<Prediction>
  verifyPrediction,            // (id, outcome) => Promise<void>
  getModelAccuracy             // (modelId) => Promise<number>
} = usePredictions();
```

### Hook: useMetaAnalytics

Analyzes formations, strategies, and trends.

```typescript
const {
  formations,                  // All formation stats
  strategies,                  // All strategies
  trends,                      // Meta trends
  getFormation,                // (id) => Promise<FormationStats>
  recordFormationMatch,        // (formationId, result, stats) => Promise<void>
  getTopFormations,            // (count) => Promise<FormationStats[]>
  createStrategy,              // (formation, tactics) => Promise<string>
  recordTrend,                 // (formation, trend) => Promise<void>
  getRisingTrends              // () => Promise<MetaTrend[]>
} = useMetaAnalytics();
```

### Combined Hook: useAdvancedAnalytics

Integrates all analytics features for simplified access.

```typescript
const analytics = useAdvancedAnalytics(playerId, matchId);

// Access all features through single hook
analytics.heatmaps.createHeatmap('pass', 10);
analytics.behavior.recordBehavior({...});
analytics.predictions.makePrediction(modelId, {...});
analytics.meta.getTopFormations(5);
```

---

## API Reference

### Advanced Analytics Service

Located at `services/analytics-advanced.ts`

#### Methods

**Heatmap Management**
- `createHeatmap(playerId, matchId, type, gridSize): string` - Create new heatmap, returns ID
- `addHeatmapPoint(heatmapId, x, y, intensity): void` - Add point to heatmap
- `getHeatmapGrid(heatmapId): number[][]` - Get visualization grid with gaussian intensity
- `selectHeatmap(heatmapId): void` - Set selected heatmap
- `deleteHeatmap(heatmapId): void` - Remove heatmap

**Behavior Tracking**
- `recordBehavior(playerId, metrics): void` - Record behavior snapshot
- `getPlayerBehaviorHistory(playerId): BehaviorRecord[]` - Get all records
- `getAverageBehavior(playerId, recordLimit): Metrics` - Calculate average metrics
- `analyzePatterns(playerId): BehaviorPattern[]` - Detect patterns from history

**Prediction Models**
- `createModel(type, config): string` - Create prediction model, returns ID
- `makePrediction(modelId, inputData): Prediction` - Generate forecast
- `verifyPrediction(predictionId, actualValue): CalibrationMetrics` - Update model accuracy
- `getModelAccuracy(modelId): CalibrationMetrics` - Get model performance stats
- `clearExpiredPredictions(): void` - Remove 7-day-old predictions

**Data Management**
- `exportAnalytics(): ExportedAnalytics` - Export all data
- `clearAnalytics(scope): void` - Clear analytics data (player/match/all)

### Meta-Game Analytics Service

Located at `lib/metaAnalytics.ts`

#### Methods

**Formation Management**
- `getFormation(formationId): FormationStats` - Get formation statistics
- `recordFormationMatch(formationId, result, stats): void` - Log formation performance
- `getTopFormations(count): FormationStats[]` - Get top formations by win rate
- `getAllFormations(): FormationStats[]` - Get all formations

**Strategy Management**
- `createStrategy(formation, tactics): string` - Create strategy, returns ID
- `updateStrategyWinRate(strategyId, wins, total): void` - Update strategy performance
- `addCounterStrategy(strategyId, counterStrategy, effectiveness): void` - Add counter
- `getBestCounter(strategyId): CounterStrategy` - Get most effective counter

**Trend Analysis**
- `recordTrend(formation, trend): void` - Record formation trend
- `getTrends(): MetaTrend[]` - Get all trends
- `getRisingTrends(): MetaTrend[]` - Get formations gaining effectiveness
- `getFallingTrends(): MetaTrend[]` - Get formations losing effectiveness

**Advanced Analysis**
- `analyzeFormationMismatch(attacking, defending): MismatchAnalysis` - Formation matchup analysis
- `getMismatch(attacking, defending): MismatchAnalysis` - Get cached mismatch analysis

**Data Management**
- `exportMetaData(): ExportedMetaData` - Export all meta data
- `createPlayerRole(formation, role, skills): string` - Create player role type
- `recordRolePerformance(roleId, performance): void` - Log role performance

---

## Examples

### Example 1: Analyzing Player Heatmap

**Scenario**: Analyze where a forward player receives the ball.

```typescript
import { useHeatmaps } from '@/hooks/useAnalytics';

export function AnalyzeForwardReception() {
  const { createHeatmap, addHeatmapPoint, getHeatmapGrid } = useHeatmaps('forward1', 'match123');

  useEffect(() => {
    async function analyze() {
      // Create heatmap for forward passes
      const heatmapId = await createHeatmap('pass', 20); // 20x20 for detail

      // Add pass reception locations
      await addHeatmapPoint(heatmapId, 85, 50, 95); // Received in box, high frequency
      await addHeatmapPoint(heatmapId, 80, 45, 88);
      await addHeatmapPoint(heatmapId, 88, 55, 92);
      await addHeatmapPoint(heatmapId, 82, 40, 75);

      // Get grid for visualization
      const grid = await getHeatmapGrid(heatmapId);

      // Find hottest zone (receiving area)
      const maxIntensity = Math.max(...grid.flat());
      console.log(`Forward's reception hotspot intensity: ${maxIntensity}/100`);
    }

    analyze();
  }, []);

  return <div>Forward heatmap analysis complete</div>;
}
```

### Example 2: Behavior Pattern Detection

**Scenario**: Identify if a midfielder is playing aggressively or defensively.

```typescript
import { useBehaviorAnalytics } from '@/hooks/useAnalytics';

export function AnalyzeMidfielderStyle() {
  const { recordBehavior, analyzePatterns } = useBehaviorAnalytics('midfielder1');

  async function recordMatch() {
    // Record match performance
    await recordBehavior({
      passAccuracy: 88,      // High accuracy
      shotAccuracy: 45,      // Low shot accuracy
      dribbleSuccessRate: 72,
      avgPassLength: 35,     // Shorter passes
      avgRunDistance: 82,    // High distance covered
      pressureResistance: 88, // Handles pressure well
      creativeIndex: 42,     // Lower creativity
      defensivePresence: 88, // Strong defensive positioning
      positioningScore: 85,
      consistency: 87
    });

    // Analyze patterns
    const patterns = await analyzePatterns();
    const defensivePattern = patterns.find(p => p.type === 'defensive');

    if (defensivePattern?.confidence) {
      console.log(`Midfielder playing defensively: ${defensivePattern.confidence}% confidence`);
      console.log(`Triggers: ${defensivePattern.triggers.join(', ')}`);
    }
  }

  return <button onClick={recordMatch}>Analyze Midfielder</button>;
}
```

### Example 3: Prediction Model for Player Rating

**Scenario**: Create a model to predict next match rating based on recent performance.

```typescript
import { usePredictions } from '@/hooks/useAnalytics';

export function PredictPlayerRating() {
  const { createModel, makePrediction, verifyPrediction } = usePredictions();

  async function trainAndPredict() {
    // Create model trained on 7 days of data
    const modelId = await createModel('player_rating', {
      minSamples: 8,
      trainingPeriod: 604800, // 7 days
      features: ['passAccuracy', 'creativeIndex', 'consistency', 'defensivePresence']
    });

    // Current form for prediction
    const currentPerformance = {
      passAccuracy: 82,
      creativeIndex: 71,
      consistency: 79,
      defensivePresence: 65
    };

    // Make prediction
    const prediction = await makePrediction(modelId, currentPerformance);

    console.log(`Predicted rating: ${prediction.prediction}/100`);
    console.log(`Confidence: ${prediction.confidence}%`);
    console.log(`Reasoning: ${prediction.reasoning}`);

    // Later, after match, verify
    setTimeout(async () => {
      const actualRating = 81;
      await verifyPrediction(prediction.id, actualRating);
      console.log('Prediction verified and model updated');
    }, 86400000); // After match (1 day later)
  }

  return <button onClick={trainAndPredict}>Train and Predict</button>;
}
```

### Example 4: Formation Meta-Game Analysis

**Scenario**: Determine which formation is trending and find its best counter.

```typescript
import { useMetaAnalytics } from '@/hooks/useAnalytics';

export function AnalyzeFormationMeta() {
  const { getRisingTrends, recordFormationMatch, getBestCounter } = useMetaAnalytics();

  async function analyzeMeta() {
    // Get rising formations
    const risingFormations = await getRisingTrends();

    if (risingFormations.length > 0) {
      const topRising = risingFormations[0];
      console.log(`${topRising.formation} is rising with ${topRising.momentum}% momentum`);
      console.log(`Win rate: ${topRising.lastPeriodWinRate}% (up from ${topRising.previousWinRate}%)`);

      // Find best counter
      const strategy = await createStrategy(topRising.formation, ['counter', 'pressure']);
      const bestCounter = await getBestCounter(strategy);

      console.log(`Best counter: ${bestCounter.strategy} with ${bestCounter.effectiveness}% effectiveness`);

      // Record our counter formation performance
      await recordFormationMatch('3-5-2', 'win', {
        possession: 52.1,
        shots: 16,
        accuracy: 68.5
      });
    }
  }

  return <button onClick={analyzeMeta}>Analyze Meta</button>;
}
```

### Example 5: Comprehensive Player Profile

**Scenario**: Create complete player analysis combining all systems.

```typescript
import { useAdvancedAnalytics } from '@/hooks/useAnalytics';

export function CreatePlayerProfile() {
  const analytics = useAdvancedAnalytics('player123', 'match456');

  async function buildProfile() {
    // 1. Create heatmap
    const heatmapId = await analytics.heatmaps.createHeatmap('pass', 20);
    for (let i = 0; i < 50; i++) {
      await analytics.heatmaps.addHeatmapPoint(
        heatmapId,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 50 + 50
      );
    }

    // 2. Record behavior
    await analytics.behavior.recordBehavior({
      passAccuracy: 85,
      shotAccuracy: 70,
      dribbleSuccessRate: 75,
      avgPassLength: 40,
      avgRunDistance: 45,
      pressureResistance: 80,
      creativeIndex: 72,
      defensivePresence: 55,
      positioningScore: 80,
      consistency: 82
    });

    // 3. Analyze patterns
    const patterns = await analytics.behavior.analyzePatterns();
    console.log('Detected patterns:', patterns.map(p => `${p.type} (${p.confidence}%)`));

    // 4. Make performance prediction
    const modelId = await analytics.predictions.createModel('performance', {
      minSamples: 10,
      trainingPeriod: 604800,
      features: ['passAccuracy', 'creativeIndex', 'consistency']
    });

    const prediction = await analytics.predictions.makePrediction(modelId, {
      passAccuracy: 85,
      creativeIndex: 72,
      consistency: 82
    });

    // 5. Get formation context
    const topFormations = await analytics.meta.getTopFormations(3);
    const playerFormations = topFormations.filter(f => f.matches > 5);

    return {
      playerId: 'player123',
      heatmap: heatmapId,
      behavior: await analytics.behavior.getAverageBehavior(),
      patterns: patterns,
      predictedPerformance: prediction.prediction,
      confidence: prediction.confidence,
      topFormations: playerFormations
    };
  }

  return <button onClick={buildProfile}>Build Profile</button>;
}
```

---

## Troubleshooting

### Issue: Heatmap Grid Shows No Intensity

**Cause**: No points added to heatmap or gaussian calculation failure

**Solution**:
```typescript
// Verify points were added
const heatmap = analytics.heatmaps.selectedHeatmap;
console.log('Points in heatmap:', heatmap?.points.length);

// Ensure intensity values are in range 1-100
await analytics.heatmaps.addHeatmapPoint(id, 50, 50, 75); // ✓ Valid

// Check grid generation
const grid = await analytics.heatmaps.getHeatmapGrid(id);
const maxIntensity = Math.max(...grid.flat());
console.log('Max grid intensity:', maxIntensity);
```

### Issue: Patterns Not Detected

**Cause**: Insufficient behavior records or metrics don't match pattern triggers

**Solution**:
```typescript
// Record multiple snapshots to establish baseline
for (let i = 0; i < 5; i++) {
  await analytics.behavior.recordBehavior({
    passAccuracy: 80 + Math.random() * 10,
    // ... other metrics
  });
}

// Check current behavior meets pattern condition
const current = analytics.behavior.currentBehavior;
console.log('Creative index:', current?.creativeIndex);
console.log('Defensive presence:', current?.defensivePresence);

// Manually analyze patterns
const patterns = await analytics.behavior.analyzePatterns();
console.log('Available patterns:', patterns.map(p => p.type));
```

### Issue: Predictions Not Accurate

**Cause**: Model not trained with enough data or poor feature selection

**Solution**:
```typescript
// Check model training data
const history = await analytics.behavior.getPlayerBehaviorHistory();
console.log('Training samples available:', history.length);

// Ensure 10+ records minimum
if (history.length < 10) {
  console.warn('Insufficient training data - predictions will be unreliable');
}

// Verify prediction accuracy over time
const accuracy = await analytics.predictions.getModelAccuracy(modelId);
console.log('Model accuracy:', accuracy.accuracy + '%');

// Check calibration
console.log('Calibration error:', accuracy.calibrationError);
```

### Issue: Formation Win Rates Not Updating

**Cause**: Formation matches recorded incorrectly or localStorage corrupted

**Solution**:
```typescript
// Verify formation exists
const formation = await analytics.meta.getFormation('4-3-3');
console.log('Formation found:', formation);

// Record with valid result
await analytics.meta.recordFormationMatch('4-3-3', 'win', {
  possession: 55,
  shots: 12,
  accuracy: 65
});

// Result must be: 'win' | 'draw' | 'loss'
// Stats object is optional but recommended

// Force refresh
const allFormations = await analytics.meta.getAllFormations();
console.log('All formations:', allFormations.map(f => ({
  id: f.formation,
  wins: f.wins,
  winRate: (f.wins / f.matches * 100).toFixed(1) + '%'
})));
```

### Issue: localStorage Data Corrupted

**Cause**: Browser localStorage limit exceeded or corrupted JSON

**Solution**:
```typescript
// Export data before clearing
const backup = await analytics.advanced.exportAnalytics();
console.log('Exported', backup.heatmaps.length, 'heatmaps');

// Clear corrupted data
await analytics.advanced.clearAnalytics('all');

// Restore from backup
// (Manual restoration requires implementing import function)

// Check localStorage directly
const storageData = localStorage.getItem('advancedAnalytics:global');
console.log('Storage data exists:', !!storageData);
console.log('Data size:', storageData?.length || 0, 'bytes');

// If corrupted, parse and validate
try {
  const parsed = JSON.parse(storageData || '{}');
  console.log('Storage data valid');
} catch (e) {
  console.error('Storage data corrupted:', e.message);
  localStorage.removeItem('advancedAnalytics:global');
}
```

### Issue: Memory Usage Growing

**Cause**: Too many heatmap points or predictions accumulating

**Solution**:
```typescript
// Limit heatmap points per heatmap
const maxPointsPerHeatmap = 500;
if (heatmap.points.length > maxPointsPerHeatmap) {
  console.warn('Heatmap exceeds point limit');
}

// Clean up expired predictions
await analytics.predictions.clearExpiredPredictions();

// Delete unused heatmaps
for (const heatmap of analytics.heatmaps.heatmaps) {
  if (heatmap.points.length === 0) {
    await analytics.heatmaps.deleteHeatmap(heatmap.id);
  }
}

// Monitor localStorage size
function checkStorageSize() {
  const advanced = localStorage.getItem('advancedAnalytics:global');
  const meta = localStorage.getItem('metaAnalytics:global');
  const totalBytes = (advanced?.length || 0) + (meta?.length || 0);
  const totalMB = (totalBytes / 1024 / 1024).toFixed(2);
  console.log(`Analytics storage: ${totalMB} MB`);
  return totalMB < 5; // Warn if approaching 5MB limit
}
```

---

## Performance Optimization

### Heatmap Grid Calculation

For large heatmaps (500+ points), gaussian calculation can be expensive:

```typescript
// Use 10x10 grid instead of 20x20 for real-time visualization
const heatmapId = await analytics.heatmaps.createHeatmap('pass', 10);

// Batch add points instead of individual calls
const points = [
  { x: 45, y: 50, intensity: 75 },
  { x: 52, y: 48, intensity: 82 },
  // ... up to 100 points
];

for (const point of points) {
  await analytics.heatmaps.addHeatmapPoint(
    heatmapId,
    point.x,
    point.y,
    point.intensity
  );
}

// Cache grid results
let cachedGrid: number[][] | null = null;
let cacheTime = 0;

async function getCachedGrid(id: string) {
  const now = Date.now();
  if (cachedGrid && now - cacheTime < 5000) { // 5s cache
    return cachedGrid;
  }
  cachedGrid = await analytics.heatmaps.getHeatmapGrid(id);
  cacheTime = now;
  return cachedGrid;
}
```

### Behavior Pattern Detection

Limit pattern checking frequency:

```typescript
let lastPatternCheck = 0;
const patternCheckInterval = 60000; // Check every minute

async function checkPatternsThrottled() {
  const now = Date.now();
  if (now - lastPatternCheck < patternCheckInterval) {
    return; // Skip check
  }
  lastPatternCheck = now;
  const patterns = await analytics.behavior.analyzePatterns();
  // Process patterns
}
```

### Prediction Model Training

Limit model creation frequency:

```typescript
const modelCache = new Map<string, string>();

async function getOrCreateModel(type: string) {
  if (modelCache.has(type)) {
    return modelCache.get(type)!;
  }

  const modelId = await analytics.predictions.createModel(type, {
    minSamples: 10,
    trainingPeriod: 604800
  });

  modelCache.set(type, modelId);
  return modelId;
}
```

---

## Best Practices

1. **Record Behavior Regularly**: Record at least one behavior snapshot per match for reliable pattern detection
2. **Use Appropriate Grid Size**: 10x10 for real-time, 20x20 for analysis
3. **Verify Predictions**: Always verify predictions with actual outcomes to calibrate models
4. **Monitor Storage**: Check localStorage size monthly to prevent quota issues
5. **Export Data**: Regularly export analytics data for backup
6. **Batch Operations**: Group related operations to minimize state updates
7. **Cache Results**: Cache heatmap grids and trend calculations

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial release with heatmaps, behavior analytics, prediction models, and meta-game analysis |

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [Examples](#examples) for usage patterns
3. Consult the [API Reference](#api-reference) for method signatures
4. Export and inspect your data using `exportAnalytics()` and `exportMetaData()`

---

**Last Updated**: 2024  
**Maintained by**: Analytics Development Team
